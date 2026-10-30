
using System.Threading.RateLimiting;
using DotNetEnv;
using Microsoft.AspNetCore.HttpOverrides;
using Terranova.Api.Extensions;
using Terranova.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;

var currentDirectory = Directory.GetCurrentDirectory();

var envPath = Path.Combine(currentDirectory, ".env");

if (!File.Exists(envPath))
{
	envPath = Path.GetFullPath(
		Path.Combine(currentDirectory, "../../.env"));
}

if (File.Exists(envPath))
{
	Env.Load(envPath);
}


var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();


builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddProblemDetails();

builder.Services.AddExceptionHandler(options =>
{
	options.ExceptionHandlingPath = "/error";
});


builder.Services.AddRateLimiter(options =>
{
	options.RejectionStatusCode =
		StatusCodes.Status429TooManyRequests;

	options.AddPolicy("standard", context =>
		RateLimitPartition.GetFixedWindowLimiter(
			context.Connection.RemoteIpAddress?.ToString()
				?? "unknown",
			_ => new FixedWindowRateLimiterOptions
			{
				PermitLimit = 60,
				Window = TimeSpan.FromMinutes(1),
				QueueLimit = 0,
				AutoReplenishment = true
			}));

	options.AddPolicy("expensive", context =>
		RateLimitPartition.GetFixedWindowLimiter(
			context.Connection.RemoteIpAddress?.ToString()
				?? "unknown",
			_ => new FixedWindowRateLimiterOptions
			{
				PermitLimit = 30,
				Window = TimeSpan.FromMinutes(1),
				QueueLimit = 0,
				AutoReplenishment = true
			}));
});

var app = builder.Build();

app.UseExceptionHandler();

if (!app.Environment.IsDevelopment())
{
	app.UseHsts();
}

app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
	context.Response.OnStarting(() =>
	{
		var headers = context.Response.Headers;

		headers["X-Content-Type-Options"] = "nosniff";
		headers["X-Frame-Options"] = "DENY";
		headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
		headers["Permissions-Policy"] =
			"camera=(), microphone=(), geolocation=()";

		headers.Remove("X-Powered-By");
		headers.Remove("Server");

		return Task.CompletedTask;
	});

	await next();
});

app.UseRateLimiter();

app.MapGet("/", () => Results.Ok(new
{
	name = "Terranova API",
	version = "v1"
}))
.RequireRateLimiting("global");

app.MapTerranovaEndpoints();

app.Map("/error", () =>
{
	return Results.Problem(
		statusCode: StatusCodes.Status500InternalServerError,
		title: "An unexpected error occurred.");
});

app.Run();
