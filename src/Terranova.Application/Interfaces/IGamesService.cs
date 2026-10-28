
using Terranova.Application.Games;

namespace Terranova.Application.Interfaces;

public interface IGamesService
{
	Task<ResultPage<GameSummary>> GetGamesAsync(GamesQuery query, CancellationToken cancellationToken);

	Task<GameDetail?> GetGameAsync(string idOrSlug, CancellationToken cancellationToken);

	Task<ResultPage<Screenshot>> GetScreenshotsAsync(
		string idOrSlug, ListQuery query, CancellationToken cancellationToken);

	Task<ResultPage<CatalogItem>> GetGenresAsync(ListQuery query, CancellationToken cancellationToken);

	Task<ResultPage<CatalogItem>> GetPlatformsAsync(ListQuery query, CancellationToken cancellationToken);
}
