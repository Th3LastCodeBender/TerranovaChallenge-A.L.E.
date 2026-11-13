

export const mockGames = [
	{
		id: "1",
		name: "The Witcher 3",
		genres: ["RPG", "Adventure"],
		themes: ["Fantasy", "Medieval"],
		keywords: ["Open World", "Story Rich", "Magic"],
		gameModes: ["Single Player"],
		platforms: ["PC", "PlayStation", "Xbox"],
		companies: ["CD Projekt Red"],
		rating: 95,
	},
	{
		id: "2",
		name: "Elden Ring",
		genres: ["RPG", "Action"],
		themes: ["Fantasy", "Dark Fantasy"],
		keywords: ["Open World", "Soulslike", "Exploration"],
		gameModes: ["Single Player", "Multiplayer"],
		platforms: ["PC", "PlayStation", "Xbox"],
		companies: ["FromSoftware"],
		rating: 96,
	},
	{
		id: "3",
		name: "Skyrim",
		genres: ["RPG", "Adventure"],
		themes: ["Fantasy", "Medieval"],
		keywords: ["Open World", "Magic", "Exploration"],
		gameModes: ["Single Player"],
		platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
		companies: ["Bethesda"],
		rating: 94,
	},
	{
		id: "4",
		name: "Baldur's Gate 3",
		genres: ["RPG", "Strategy"],
		themes: ["Fantasy", "Medieval"],
		keywords: ["Turn Based", "Story Rich", "Magic"],
		gameModes: ["Single Player", "Co-op"],
		platforms: ["PC", "PlayStation", "Xbox"],
		companies: ["Larian Studios"],
		rating: 96,
	},
	{
		id: "5",
		name: "Cyberpunk 2077",
		genres: ["RPG", "Shooter"],
		themes: ["Science Fiction", "Cyberpunk"],
		keywords: ["Open World", "Story Rich", "Futuristic"],
		gameModes: ["Single Player"],
		platforms: ["PC", "PlayStation", "Xbox"],
		companies: ["CD Projekt Red"],
		rating: 86,
	},
	{
		id: "6",
		name: "Dark Souls III",
		genres: ["RPG", "Action"],
		themes: ["Dark Fantasy", "Medieval"],
		keywords: ["Soulslike", "Difficult", "Exploration"],
		gameModes: ["Single Player", "Multiplayer"],
		platforms: ["PC", "PlayStation", "Xbox"],
		companies: ["FromSoftware"],
		rating: 89,
	},
	{
		id: "7",
		name: "Hogwarts Legacy",
		genres: ["RPG", "Adventure"],
		themes: ["Fantasy", "Magic"],
		keywords: ["Open World", "Exploration", "Magic"],
		gameModes: ["Single Player"],
		platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
		companies: ["Avalanche Software"],
		rating: 84,
	},
	{
		id: "8",
		name: "Red Dead Redemption 2",
		genres: ["Adventure", "Action"],
		themes: ["Western", "Historical"],
		keywords: ["Open World", "Story Rich", "Exploration"],
		gameModes: ["Single Player", "Multiplayer"],
		platforms: ["PC", "PlayStation", "Xbox"],
		companies: ["Rockstar Games"],
		rating: 97,
	},
	{
		id: "9",
		name: "Final Fantasy XVI",
		genres: ["RPG", "Action"],
		themes: ["Fantasy", "Medieval"],
		keywords: ["Story Rich", "Magic", "Combat"],
		gameModes: ["Single Player"],
		platforms: ["PC", "PlayStation"],
		companies: ["Square Enix"],
		rating: 88,
	},
	{
		id: "10",
		name: "Minecraft",
		genres: ["Sandbox", "Adventure"],
		themes: ["Fantasy"],
		keywords: ["Building", "Exploration", "Survival"],
		gameModes: ["Single Player", "Multiplayer", "Co-op"],
		platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
		companies: ["Mojang"],
		rating: 93,
	},
	{
		id: "11",
		name: "Assassin's Creed Valhalla",
		genres: ["RPG", "Action", "Adventure"],
		themes: ["Historical", "Medieval"],
		keywords: ["Open World", "Exploration", "Combat"],
		gameModes: ["Single Player"],
		platforms: ["PC", "PlayStation", "Xbox"],
		companies: ["Ubisoft"],
		rating: 82,
	},
	{
		id: "12",
		name: "Stardew Valley",
		genres: ["RPG", "Simulation"],
		themes: ["Fantasy", "Rural"],
		keywords: ["Farming", "Building", "Relaxing"],
		gameModes: ["Single Player", "Multiplayer"],
		platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
		companies: ["ConcernedApe"],
		rating: 91,
	},
];

export const mockInteractions = [
	{
		userId: "user-1",
		gameId: "1",
		interactionWeight: 4,
		interactionType: "favorite",
	},
	{
		userId: "user-1",
		gameId: "2",
		interactionWeight: 5,
		interactionType: "completed",
	},
	{
		userId: "user-1",
		gameId: "3",
		interactionWeight: 4,
		interactionType: "favorite",
	},
	{
		userId: "user-1",
		gameId: "4",
		interactionWeight: 3,
		interactionType: "rating",
	},
];

const weights = {
	genres: 0.30,
	themes: 0.20,
	keywords: 0.15,
	gameModes: 0.10,
	platforms: 0.10,
	companies: 0.10,
	rating: 0.05,
};

export function jaccardSimilarity(
	a: string[],
	b: string[]
): number {
	const setA = new Set(a);
	const setB = new Set(b);

	if (setA.size === 0 || setB.size === 0)
		return 0;

	const intersection = [...setA].filter(
		item => setB.has(item)
	).length;

	const union = new Set([...setA, ...setB]).size;

	return intersection / union;
}

export function getRecommendations(
	userId: string,
	limit = 20
) {
	const interactions = mockInteractions.filter(
		interaction =>
			interaction.userId === userId &&
			interaction.interactionWeight > 0
	);

	if (interactions.length === 0)
		return [];

	const profile = {
		genres: [] as string[],
		themes: [] as string[],
		keywords: [] as string[],
		gameModes: [] as string[],
		platforms: [] as string[],
		companies: [] as string[],
	};

	for (const interaction of interactions) {
		const game = mockGames.find(
			game => game.id === interaction.gameId
		);

		if (!game) continue;

		profile.genres.push(...game.genres);
		profile.themes.push(...game.themes);
		profile.keywords.push(...game.keywords);
		profile.gameModes.push(...game.gameModes);
		profile.platforms.push(...game.platforms);
		profile.companies.push(...game.companies);
	}

	for (const key of Object.keys(profile) as
		(keyof typeof profile)[]) {
		profile[key] = [...new Set(profile[key])];
	}

	const seenGameIds = interactions.map(
		interaction => interaction.gameId
	);

	const candidates = mockGames.filter(
		game => !seenGameIds.includes(game.id)
	);

	const recommendations = candidates.map(game => {
		const score =
			jaccardSimilarity(profile.genres, game.genres)
				* weights.genres +

			jaccardSimilarity(profile.themes, game.themes)
				* weights.themes +

			jaccardSimilarity(profile.keywords, game.keywords)
				* weights.keywords +

			jaccardSimilarity(profile.gameModes, game.gameModes)
				* weights.gameModes +

			jaccardSimilarity(profile.platforms, game.platforms)
				* weights.platforms +

			jaccardSimilarity(profile.companies, game.companies)
				* weights.companies +

			((game.rating ?? 0) / 100) * weights.rating;

		return {
			...game,
			recommendationScore:
				Math.round(score * 10000) / 100,
		};
	});

	return recommendations
		.sort(
			(a, b) =>
				b.recommendationScore - a.recommendationScore
		)
		.slice(0, limit);
}

const recommendations = getRecommendations("user-1", 10);

console.log("Giochi consigliati:");

console.table(
	recommendations.map(game => ({
		name: game.name,
		score: game.recommendationScore
	}))
);
