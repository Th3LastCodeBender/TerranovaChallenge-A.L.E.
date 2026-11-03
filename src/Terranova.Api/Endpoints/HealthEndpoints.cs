using Microsoft.EntityFrameworkCore;
using Terranova.Infrastructure.Persistence;

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

		app.MapGet("/health/db", async (
			AppDbContext dbContext,
			CancellationToken cancellationToken) =>
		{
			var connected = await dbContext.Database
				.CanConnectAsync(cancellationToken);

			return connected
				? Results.Ok(new
				{
					status = "healthy",
					database = "PostgreSQL",
					timestamp = DateTimeOffset.UtcNow
				})
				: Results.Problem(
					title: "Database unavailable",
					statusCode: StatusCodes.Status503ServiceUnavailable
				);
		})
		.WithTags("Health");

		return app;
	}
}
