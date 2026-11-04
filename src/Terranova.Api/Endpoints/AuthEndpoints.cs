using Microsoft.AspNetCore.Mvc;
using Terranova.Application.Auth;

namespace Terranova.Api.Endpoints;

public static class AuthEndpoints
{
	public static IEndpointRouteBuilder MapAuthEndpoints(
		this IEndpointRouteBuilder app)
	{
		var group = app.MapGroup("/api/auth")
			.WithTags("Authentication");

		group.MapPost("/register", async (
			RegisterRequest request,
			IAuthService authService) =>
		{
			try
			{
				var user = await authService.RegisterAsync(request);

				return Results.Created("/api/auth/me", user);
			}
			catch (InvalidOperationException ex)
			{
				return Results.BadRequest(new
				{
					errors = ex.Message
				});
			}
		});

		group.MapPost("/login", async (
			LoginRequest request,
			IAuthService authService) =>
		{
			var user = await authService.LoginAsync(request);

			if (user is null)
				return Results.Unauthorized();

			return Results.Ok(user);
		});

		group.MapPost("/logout", async (
			IAuthService authService) =>
		{
			await authService.LogoutAsync();

			return Results.NoContent();
		})
		.RequireAuthorization();

		group.MapGet("/me", async (
			IAuthService authService) =>
		{
			var user = await authService.GetCurrentUserAsync();

			return user is null
				? Results.Unauthorized()
				: Results.Ok(user);
		})
		.RequireAuthorization();

		return app;
	}
}