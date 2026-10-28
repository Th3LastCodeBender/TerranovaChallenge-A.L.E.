namespace Terranova.Application.Games;

public sealed record GamesQuery(
	int Page,
	int PageSize,
	string? Search,
	bool? SearchPrecise,
	bool? SearchExact,
	string? Platforms,
	string? ParentPlatforms,
	string? Stores,
	string? Developers,
	string? Publishers,
	string? Genres,
	string? Tags,
	string? Creators,
	string? Dates,
	string? Updated,
	string? Metacritic,
	string? Ordering);

public sealed record ListQuery(int Page, int PageSize, string? Ordering);

public sealed record ResultPage<T>(int Count, IReadOnlyList<T> Results);

public sealed record NamedRef(int Id, string Name, string Slug);

public sealed record PlatformEntry(NamedRef Platform);

public sealed record EsrbRating(int Id, string Name, string Slug);

public sealed record GameSummary(
	int Id,
	string Slug,
	string Name,
	DateOnly? Released,
	bool Tba,
	string? BackgroundImage,
	double Rating,
	int RatingTop,
	int RatingsCount,
	int? Metacritic,
	int Playtime,
	DateTimeOffset? Updated,
	IReadOnlyList<PlatformEntry>? Platforms,
	IReadOnlyList<NamedRef>? Genres);

public sealed record GameDetail(
	int Id,
	string Slug,
	string Name,
	string? Description,
	string? DescriptionRaw,
	DateOnly? Released,
	bool Tba,
	string? Website,
	string? BackgroundImage,
	double Rating,
	int RatingTop,
	int RatingsCount,
	int? Metacritic,
	int Playtime,
	DateTimeOffset? Updated,
	IReadOnlyList<PlatformEntry>? Platforms,
	IReadOnlyList<NamedRef>? Genres,
	IReadOnlyList<NamedRef>? Developers,
	IReadOnlyList<NamedRef>? Publishers,
	EsrbRating? EsrbRating);

public sealed record Screenshot(int Id, string Image, int? Width, int? Height);

public sealed record CatalogItem(
	int Id,
	string Name,
	string Slug,
	int GamesCount,
	string? ImageBackground);