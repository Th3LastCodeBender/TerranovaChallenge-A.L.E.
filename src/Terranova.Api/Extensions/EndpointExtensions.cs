using Terranova.Api.Endpoints;

namespace Terranova.Api.Extensions;

public static class EndpointExtensions
{
    public static WebApplication MapTerranovaEndpoints(
        this WebApplication app)
    {
        app.MapHealthEndpoints();
        app.MapExternalEndpoints();

        return app;
    }
}
