using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Terranova.Application.Games;
using Terranova.Application.Interfaces;

namespace Terranova.Infrastructure.ExternalServices;

public sealed class RawgGamesService(HttpClient http, IOptions<RawgOptions> options) : IGamesService
{
	private static readonly JsonSerializerOptions JsonOptions = new()
	{
		PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
		PropertyNameCaseInsensitive = true
	};

	private sealed record RawgList<T>(int Count, IReadOnlyList<T>? Results);

	public Task<ResultPage<GameSummary>> GetGamesAsync(GamesQuery q, CancellationToken ct) =>
		GetPageAsync<GameSummary>("games", ct,
			("page", q.Page.ToString()),
			("page_size", q.PageSize.ToString()),
			("search", q.Search),
			("search_precise", q.SearchPrecise?.ToString().ToLowerInvariant()),
			("search_exact", q.SearchExact?.ToString().ToLowerInvariant()),
			("platforms", q.Platforms),
			("parent_platforms", q.ParentPlatforms),
			("stores", q.Stores),
			("developers", q.Developers),
			("publishers", q.Publishers),
			("genres", q.Genres),
			("tags", q.Tags),
			("creators", q.Creators),
			("dates", q.Dates),
			("updated", q.Updated),
			("metacritic", q.Metacritic),
			("ordering", q.Ordering));

	public async Task<GameDetail?> GetGameAsync(string idOrSlug, CancellationToken ct)
	{
		using var response = await http.GetAsync(
			BuildUrl($"games/{Uri.EscapeDataString(idOrSlug)}"), ct);

		if (response.StatusCode == HttpStatusCode.NotFound)
			return null;

		response.EnsureSuccessStatusCode();
		return await response.Content.ReadFromJsonAsync<GameDetail>(JsonOptions, ct);
	}

	public Task<ResultPage<Screenshot>> GetScreenshotsAsync(
		string idOrSlug, ListQuery q, CancellationToken ct) =>
		GetPageAsync<Screenshot>(
			$"games/{Uri.EscapeDataString(idOrSlug)}/screenshots", ct,
			("page", q.Page.ToString()),
			("page_size", q.PageSize.ToString()),
			("ordering", q.Ordering));

	public Task<ResultPage<CatalogItem>> GetGenresAsync(ListQuery q, CancellationToken ct) =>
		GetPageAsync<CatalogItem>("genres", ct,
			("page", q.Page.ToString()),
			("page_size", q.PageSize.ToString()),
			("ordering", q.Ordering));

	public Task<ResultPage<CatalogItem>> GetPlatformsAsync(ListQuery q, CancellationToken ct) =>
		GetPageAsync<CatalogItem>("platforms", ct,
			("page", q.Page.ToString()),
			("page_size", q.PageSize.ToString()),
			("ordering", q.Ordering));

	private async Task<ResultPage<T>> GetPageAsync<T>(
		string path, CancellationToken ct, params (string Key, string? Value)[] parameters)
	{
		var response = await http.GetFromJsonAsync<RawgList<T>>(
			BuildUrl(path, parameters), JsonOptions, ct);

		return new ResultPage<T>(response?.Count ?? 0, response?.Results ?? []);
	}

	private string BuildUrl(string path, params (string Key, string? Value)[] parameters)
	{
		var qs = parameters
			.Prepend((Key: "key", Value: options.Value.ApiKey))
			.Where(p => !string.IsNullOrWhiteSpace(p.Value))
			.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value!)}");

		return $"{path}?{string.Join("&", qs)}";
	}
}