using Terranova.Application.Interfaces;

namespace Terranova.Api.Endpoints;

public static class ExternalEndpoints
{
	public static IEndpointRouteBuilder MapExternalEndpoints(
		this IEndpointRouteBuilder app)
	{
		var group = app.MapGroup("/api/v1/external")
			.WithTags("External API");

		group.MapGet("/search", async (
			string query,
			IExternalApiService externalApi,
			CancellationToken cancellationToken) =>
		{
			if (string.IsNullOrWhiteSpace(query))
			{
				return Results.BadRequest(new
				{
					error = "Il parametro query è obbligatorio."
				});
			}

			try
			{
				var result = await externalApi.SearchAsync(
					query,
					cancellationToken);

				return Results.Content(
					result.Content,
					result.ContentType,
					statusCode: result.StatusCode);
			}
			catch (HttpRequestException)
			{
				return Results.Problem(
					statusCode: StatusCodes.Status502BadGateway,
					title: "Errore nella chiamata al servizio esterno.");
			}
			catch (TaskCanceledException)
				when (!cancellationToken.IsCancellationRequested)
			{
				return Results.Problem(
					statusCode: StatusCodes.Status504GatewayTimeout,
					title: "Timeout del servizio esterno.");
			}
		})
		.WithName("SearchExternalApi");

		return app;
	}
}
