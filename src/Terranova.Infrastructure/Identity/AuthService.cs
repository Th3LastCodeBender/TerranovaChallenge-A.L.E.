using Microsoft.AspNetCore.Identity;
using Terranova.Application.Auth;

namespace Terranova.Infrastructure.Identity;

public class AuthService : IAuthService
{
	private readonly UserManager<ApplicationUser> _userManager;
	private readonly SignInManager<ApplicationUser> _signInManager;

	public AuthService(
		UserManager<ApplicationUser> userManager,
		SignInManager<ApplicationUser> signInManager)
	{
		_userManager = userManager;
		_signInManager = signInManager;
	}

	public async Task<AuthResponse?> RegisterAsync(
		RegisterRequest request,
		CancellationToken cancellationToken = default)
	{
		var user = new ApplicationUser
		{
			UserName = request.Email,
			Email = request.Email,
			DisplayName = request.DisplayName
		};

		var result = await _userManager.CreateAsync(
			user,
			request.Password
		);

		if (!result.Succeeded)
		{
			throw new InvalidOperationException(
				string.Join(", ", result.Errors.Select(e => e.Description))
			);
		}

		await _signInManager.SignInAsync(
			user,
			isPersistent: false
		);

		return new AuthResponse(
			user.Id,
			user.Email!,
			user.DisplayName!
		);
	}

	public async Task<AuthResponse?> LoginAsync(
		LoginRequest request,
		CancellationToken cancellationToken = default)
	{
		var result = await _signInManager.PasswordSignInAsync(
			request.Email,
			request.Password,
			isPersistent: false,
			lockoutOnFailure: true
		);

		if (!result.Succeeded)
			return null;

		var user = await _userManager.FindByEmailAsync(request.Email);

		if (user is null)
			return null;

		return new AuthResponse(
			user.Id,
			user.Email!,
			user.DisplayName!
		);
	}

	public async Task LogoutAsync()
	{
		await _signInManager.SignOutAsync();
	}

	public async Task<AuthResponse?> GetCurrentUserAsync()
	{
		var user = await _userManager.GetUserAsync(
			_signInManager.Context.User
		);

		if (user is null)
			return null;

		return new AuthResponse(
			user.Id,
			user.Email!,
			user.DisplayName!
		);
	}
}