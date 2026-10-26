using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Terranova.Application.Interfaces;
using Terranova.Infrastructure.ExternalServices;

namespace Terranova.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var baseUrl = configuration["ExternalApi:BaseUrl"]
            ?? throw new InvalidOperationException(
                "ExternalApi:BaseUrl non configurato.");

        var apiKey = configuration["ExternalApi:ApiKey"]
            ?? throw new InvalidOperationException(
                "ExternalApi:ApiKey non configurata.");

        services.AddHttpClient<IExternalApiService, ExternalApiService>(client =>
        {
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.Add("X-API-Key", apiKey);
        });

        return services;
    }
}
