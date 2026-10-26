using Terranova.Application.Interfaces;

namespace Terranova.Infrastructure.ExternalServices;

public sealed class ExternalApiService : IExternalApiService
{
	private readonly HttpClient _httpClient;

	public ExternalApiService(HttpClient httpClient)
	{
		_httpClient = httpClient;
	}

	public async Task<(int StatusCode, string Content, string ContentType)> SearchAsync(
		string query,
		CancellationToken cancellationToken = default)
	{
		var path = $"v1/search?query={Uri.EscapeDataString(query)}";

		using var response = await _httpClient.GetAsync(path, cancellationToken);

		var content = await response.Content.ReadAsStringAsync(cancellationToken);
		var contentType = response.Content.Headers.ContentType?.ToString()
			?? "application/json";

		return ((int)response.StatusCode, content, contentType);
	}
}