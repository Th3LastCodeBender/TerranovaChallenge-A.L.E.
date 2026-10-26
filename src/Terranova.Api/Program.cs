using DotNetEnv;
using Terranova.Api.Extensions;
using Terranova.Infrastructure;

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

var app = builder.Build();

app.MapGet("/", () => Results.Ok(new
{
	name = "Terranova API",
	version = "v1"
}));

app.MapTerranovaEndpoints();

app.Run();
