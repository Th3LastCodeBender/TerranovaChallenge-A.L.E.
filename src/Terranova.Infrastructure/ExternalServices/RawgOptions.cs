namespace Terranova.Infrastructure.ExternalServices;

public sealed class RawgOptions
{
	public string BaseUrl { get; set; } = "https://api.rawg.io/api/";
	public string ApiKey { get; set; } = string.Empty;
}