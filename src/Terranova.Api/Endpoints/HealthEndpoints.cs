namespace Terranova.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(
        this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () => Results.Ok(new
        {
            status = "healthy",
            service = "Terranova.Api",
            timestamp = DateTimeOffset.UtcNow
        }))
        .WithTags("Health");

        return app;
    }
}
