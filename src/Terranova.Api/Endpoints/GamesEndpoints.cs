
using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Terranova.Application.Games;
using Terranova.Application.Interfaces;

namespace Terranova.Api.Endpoints;

public static partial class GamesEndpoints
{
	private const int DefaultPageSize = 20;
	private const int MaxPageSize = 40;
	private const int MaxPage = 10_000;
	private const int MaxSearchLength = 200;
	private const int MaxFilterLength = 500;

	private static readonly HashSet<string> GamesOrderingFields =
		new(StringComparer.OrdinalIgnoreCase)
		{
			"name",
			"released",
			"added",
			"created",
			"updated",
			"rating",
			"metacritic"
		};

	private static readonly HashSet<string> GenericOrderingFields =
		new(StringComparer.OrdinalIgnoreCase)
		{
			"name",
			"id",
			"slug",
			"created",
			"updated",
			"released",
			"rating",
			"metacritic",
			"count"
		};

	[GeneratedRegex(@"^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$")]
	private static partial Regex DatesRegex();

	[GeneratedRegex(@"^\d+,\d+$")]
	private static partial Regex MetacriticRegex();

	[GeneratedRegex(@"^[a-z0-9][a-z0-9\-]{0,127}$", RegexOptions.IgnoreCase)]
	private static partial Regex IdOrSlugRegex();

	public sealed record ListRequest(
		[FromQuery(Name = "page")] int? Page,
		[FromQuery(Name = "page_size")] int? PageSize,
		[FromQuery(Name = "ordering")] string? Ordering);

	public sealed record GamesRequest(
		[FromQuery(Name = "page")] int? Page,
		[FromQuery(Name = "page_size")] int? PageSize,
		[FromQuery(Name = "search")] string? Search,
		[FromQuery(Name = "search_precise")] bool? SearchPrecise,
		[FromQuery(Name = "search_exact")] bool? SearchExact,
		[FromQuery(Name = "platforms")] string? Platforms,
		[FromQuery(Name = "parent_platforms")] string? ParentPlatforms,
		[FromQuery(Name = "stores")] string? Stores,
		[FromQuery(Name = "developers")] string? Developers,
		[FromQuery(Name = "publishers")] string? Publishers,
		[FromQuery(Name = "genres")] string? Genres,
		[FromQuery(Name = "tags")] string? Tags,
		[FromQuery(Name = "creators")] string? Creators,
		[FromQuery(Name = "dates")] string? Dates,
		[FromQuery(Name = "updated")] string? Updated,
		[FromQuery(Name = "metacritic")] string? Metacritic,
		[FromQuery(Name = "ordering")] string? Ordering);

	public sealed record PagedResponse<T>(
		int Count,
		string? Next,
		string? Previous,
		IReadOnlyList<T> Results);

	public static IEndpointRouteBuilder MapGamesEndpoints(
		this IEndpointRouteBuilder app)
	{
		var standardGroup = app.MapGroup("/api/v1").RequireRateLimiting("standard");
		var expensiveGroup = app.MapGroup("/api/v1").RequireRateLimiting("expensive");

		expensiveGroup.MapGet("/games", (
			[AsParameters] GamesRequest r,
			HttpContext http,
			IGamesService games,
			CancellationToken ct) =>
		{
			var page = r.Page ?? 1;
			var pageSize = r.PageSize ?? DefaultPageSize;

			var errors = ValidatePaging(page, pageSize);

			ValidateOrdering(
				r.Ordering,
				GamesOrderingFields,
				errors);

			ValidateSearch(r.Search, errors);

			ValidateFilter(r.Platforms, "platforms", errors);
			ValidateFilter(r.ParentPlatforms, "parent_platforms", errors);
			ValidateFilter(r.Stores, "stores", errors);
			ValidateFilter(r.Developers, "developers", errors);
			ValidateFilter(r.Publishers, "publishers", errors);
			ValidateFilter(r.Genres, "genres", errors);
			ValidateFilter(r.Tags, "tags", errors);
			ValidateFilter(r.Creators, "creators", errors);

			ValidateDateRange(r.Dates, "dates", errors);
			ValidateDateRange(r.Updated, "updated", errors);
			ValidateMetacritic(r.Metacritic, errors);

			if (errors.Count > 0)
				return Task.FromResult(
					Results.ValidationProblem(errors));

			var query = new GamesQuery(
				page,
				pageSize,
				r.Search?.Trim(),
				r.SearchPrecise,
				r.SearchExact,
				r.Platforms,
				r.ParentPlatforms,
				r.Stores,
				r.Developers,
				r.Publishers,
				r.Genres,
				r.Tags,
				r.Creators,
				r.Dates,
				r.Updated,
				r.Metacritic,
				r.Ordering);

			return Guard(
				async () =>
				{
					var result = await games.GetGamesAsync(query, ct);

					return ToPaged(
						http.Request,
						result,
						page,
						pageSize);
				},
				ct);
		})
		.WithTags("Games")
		.WithName("GetGames");

		standardGroup.MapGet("/games/{idOrSlug}", (
			string idOrSlug,
			IGamesService games,
			CancellationToken ct) =>
		{
			if (!IsValidId(idOrSlug))
				return Task.FromResult(InvalidId());

			return Guard(
				async () =>
				{
					var game = await games.GetGameAsync(
						idOrSlug,
						ct);

					return game is null
						? Results.NotFound()
						: Results.Ok(game);
				},
				ct);
		})
		.WithTags("Games")
		.WithName("GetGame");

		expensiveGroup.MapGet("/games/{idOrSlug}/screenshots", (
			string idOrSlug,
			[AsParameters] ListRequest r,
			HttpContext http,
			IGamesService games,
			CancellationToken ct) =>
		{
			if (!IsValidId(idOrSlug))
				return Task.FromResult(InvalidId());

			if (!TryBuildList(r, out var query, out var error))
				return Task.FromResult(error!);

			return Guard(
				async () =>
				{
					var result = await games.GetScreenshotsAsync(
						idOrSlug,
						query,
						ct);

					return ToPaged(
						http.Request,
						result,
						query.Page,
						query.PageSize);
				},
				ct);
		})
		.WithTags("Games")
		.WithName("GetGameScreenshots");

		standardGroup.MapGet("/genres", (
			[AsParameters] ListRequest r,
			HttpContext http,
			IGamesService games,
			CancellationToken ct) =>
		{
			if (!TryBuildList(r, out var query, out var error))
				return Task.FromResult(error!);

			return Guard(
				async () =>
				{
					var result = await games.GetGenresAsync(
						query,
						ct);

					return ToPaged(
						http.Request,
						result,
						query.Page,
						query.PageSize);
				},
				ct);
		})
		.WithTags("Catalog")
		.WithName("GetGenres");

		standardGroup.MapGet("/platforms", (
			[AsParameters] ListRequest r,
			HttpContext http,
			IGamesService games,
			CancellationToken ct) =>
		{
			if (!TryBuildList(r, out var query, out var error))
				return Task.FromResult(error!);

			return Guard(
				async () =>
				{
					var result = await games.GetPlatformsAsync(
						query,
						ct);

					return ToPaged(
						http.Request,
						result,
						query.Page,
						query.PageSize);
				},
				ct);
		})
		.WithTags("Catalog")
		.WithName("GetPlatforms");

		return app;
	}

	private static Dictionary<string, string[]> ValidatePaging(
		int page,
		int pageSize)
	{
		var errors = new Dictionary<string, string[]>();

		if (page is < 1 or > MaxPage)
		{
			errors["page"] =
			[
				$"Deve essere tra 1 e {MaxPage}."
			];
		}

		if (pageSize is < 1 or > MaxPageSize)
		{
			errors["page_size"] =
			[
				$"Deve essere tra 1 e {MaxPageSize}."
			];
		}

		return errors;
	}

	private static void ValidateSearch(
		string? search,
		Dictionary<string, string[]> errors)
	{
		if (search is { Length: > MaxSearchLength })
		{
			errors["search"] =
			[
				$"Massimo {MaxSearchLength} caratteri."
			];
		}
	}

	private static void ValidateFilter(
		string? value,
		string name,
		Dictionary<string, string[]> errors)
	{
		if (value is { Length: > MaxFilterLength })
		{
			errors[name] =
			[
				$"Massimo {MaxFilterLength} caratteri."
			];
		}
	}

	private static void ValidateOrdering(
		string? ordering,
		HashSet<string> allowedFields,
		Dictionary<string, string[]> errors)
	{
		if (ordering is null)
			return;

		var field = ordering.StartsWith('-')
			? ordering[1..]
			: ordering;

		if (string.IsNullOrWhiteSpace(field) ||
			!allowedFields.Contains(field))
		{
			errors["ordering"] =
			[
				$"Ordinamento non valido. Valori consentiti: {string.Join(", ", allowedFields)}."
			];
		}
	}

	private static void ValidateDateRange(
		string? value,
		string name,
		Dictionary<string, string[]> errors)
	{
		if (value is null)
			return;

		if (!DatesRegex().IsMatch(value))
		{
			errors[name] =
			[
				"Formato: YYYY-MM-DD,YYYY-MM-DD."
			];

			return;
		}

		var parts = value.Split(',');

		var validStart = DateOnly.TryParseExact(
			parts[0],
			"yyyy-MM-dd",
			CultureInfo.InvariantCulture,
			DateTimeStyles.None,
			out var start);

		var validEnd = DateOnly.TryParseExact(
			parts[1],
			"yyyy-MM-dd",
			CultureInfo.InvariantCulture,
			DateTimeStyles.None,
			out var end);

		if (!validStart || !validEnd || start > end)
		{
			errors[name] =
			[
				"Intervallo date non valido."
			];
		}
	}

	private static void ValidateMetacritic(
		string? value,
		Dictionary<string, string[]> errors)
	{
		if (value is null)
			return;

		if (!MetacriticRegex().IsMatch(value))
		{
			errors["metacritic"] =
			[
				"Formato: min,max (es. 80,100)."
			];

			return;
		}

		var parts = value.Split(',');

		if (!int.TryParse(
				parts[0],
				NumberStyles.None,
				CultureInfo.InvariantCulture,
				out var min) ||
			!int.TryParse(
				parts[1],
				NumberStyles.None,
				CultureInfo.InvariantCulture,
				out var max) ||
			min > max ||
			min < 0 ||
			max > 100)
		{
			errors["metacritic"] =
			[
				"I valori devono essere compresi tra 0 e 100 e min deve essere <= max."
			];
		}
	}

	private static bool IsValidId(string idOrSlug)
	{
		return !string.IsNullOrWhiteSpace(idOrSlug)
			&& IdOrSlugRegex().IsMatch(idOrSlug);
	}

	private static bool TryBuildList(
		ListRequest r,
		out ListQuery query,
		out IResult? error)
	{
		var page = r.Page ?? 1;
		var pageSize = r.PageSize ?? DefaultPageSize;

		var errors = ValidatePaging(page, pageSize);

		ValidateOrdering(
			r.Ordering,
			GenericOrderingFields,
			errors);

		query = new ListQuery(page, pageSize, r.Ordering);

		error = errors.Count > 0
			? Results.ValidationProblem(errors)
			: null;

		return error is null;
	}

	private static IResult InvalidId()
	{
		return Results.ValidationProblem(
			new Dictionary<string, string[]>
			{
				["idOrSlug"] =
				[
					"Deve essere un ID numerico o uno slug valido."
				]
			});
	}

	private static IResult ToPaged<T>(
		HttpRequest request,
		ResultPage<T> result,
		int page,
		int pageSize)
	{
		var hasNext =
			(long)page * pageSize < result.Count
			&& page < MaxPage;

		var hasPrevious = page > 1;

		return Results.Ok(
			new PagedResponse<T>(
				result.Count,
				hasNext
					? PageUrl(request, page + 1)
					: null,
				hasPrevious
					? PageUrl(request, page - 1)
					: null,
				result.Results));
	}

	private static string PageUrl(
		HttpRequest request,
		int page)
	{
		var query = request.Query.ToDictionary(
			kv => kv.Key,
			kv => kv.Value);

		query["page"] = page.ToString(
			CultureInfo.InvariantCulture);

		return $"{request.Path}{QueryString.Create(query)}";
	}

	private static async Task<IResult> Guard(
		Func<Task<IResult>> action,
		CancellationToken ct)
	{
		try
		{
			return await action();
		}
		catch (HttpRequestException ex)
			when (ex.StatusCode == HttpStatusCode.NotFound)
		{
			return Results.NotFound();
		}
		catch (HttpRequestException ex)
			when (ex.StatusCode == HttpStatusCode.TooManyRequests)
		{
			return Results.Problem(
				statusCode: StatusCodes.Status503ServiceUnavailable,
				title: "Quota del servizio esterno esaurita.");
		}
		catch (HttpRequestException)
		{
			return Results.Problem(
				statusCode: StatusCodes.Status502BadGateway,
				title: "Errore nella chiamata al servizio esterno.");
		}
		catch (OperationCanceledException)
			when (!ct.IsCancellationRequested)
		{
			return Results.Problem(
				statusCode: StatusCodes.Status504GatewayTimeout,
				title: "Timeout del servizio esterno.");
		}
	}
}
