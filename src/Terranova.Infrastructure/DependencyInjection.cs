using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;
using Terranova.Application.Interfaces;
using Terranova.Infrastructure.ExternalServices;
using Terranova.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Terranova.Application.Auth;
using Terranova.Infrastructure.Identity;

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

		var connectionString = configuration.GetConnectionString("DefaultConnection");

		services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
 		
		services.AddIdentity<ApplicationUser, IdentityRole>(options =>
			{
				options.Password.RequiredLength = 8;
				options.Password.RequireDigit = true;
				options.Password.RequireUppercase = true;
				options.Password.RequireLowercase = true;
				options.Password.RequireNonAlphanumeric = false;

				options.Lockout.MaxFailedAccessAttempts = 5;
				options.Lockout.DefaultLockoutTimeSpan =
					TimeSpan.FromMinutes(5);

				options.User.RequireUniqueEmail = true;
			})
			.AddEntityFrameworkStores<AppDbContext>()
			.AddDefaultTokenProviders();

		services.ConfigureApplicationCookie(options =>
		{
			options.Cookie.Name = "Terranova.Auth";
			options.Cookie.HttpOnly = true;
			options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
			options.Cookie.SameSite = SameSiteMode.Lax;

			options.ExpireTimeSpan = TimeSpan.FromHours(12);
			options.SlidingExpiration = true;

			options.LoginPath = "/api/auth/login";
		});

		services.AddScoped<IAuthService, AuthService>();

		return services;
	}
}