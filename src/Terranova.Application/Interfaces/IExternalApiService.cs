namespace Terranova.Application.Interfaces;

public interface IExternalApiService
{
	Task<(int StatusCode, string Content, string ContentType)> SearchAsync(
		string query,
		CancellationToken cancellationToken = default);
}