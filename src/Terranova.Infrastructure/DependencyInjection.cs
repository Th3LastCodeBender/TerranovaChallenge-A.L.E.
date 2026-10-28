using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;
using Terranova.Application.Interfaces;
using Terranova.Infrastructure.ExternalServices;

namespace Terranova.Infrastructure;

public static class DependencyInjection
{
	public static IServiceCollection AddInfrastructure(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		services.AddOptions<RawgOptions>()
			.Bind(configuration.GetSection("Rawg"))
			.Validate(
				o => !string.IsNullOrWhiteSpace(o.BaseUrl)
					 && Uri.TryCreate(o.BaseUrl, UriKind.Absolute, out _),
				"Rawg:BaseUrl mancante o non valido.")
			.Validate(
				o => !string.IsNullOrWhiteSpace(o.ApiKey),
				"Rawg:ApiKey mancante.")
			.ValidateOnStart();

		services.AddHttpClient<IGamesService, RawgGamesService>((sp, client) =>
			{
				var options = sp.GetRequiredService<IOptions<RawgOptions>>().Value;
				client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
				client.Timeout = TimeSpan.FromSeconds(10);
			})
			.RemoveAllLoggers();

		return services;
	}
}