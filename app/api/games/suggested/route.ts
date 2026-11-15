import { jsonError, requireEnv } from "@/lib/utils"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { listFavourites } from "@/query/favourites"
import { getTwitchAccessToken } from "@/lib/igdb-api/twitch-auth"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import type { IgdbGame } from "@/lib/igdb-api/types"

const weights = {
	genres: 0.30,
	themes: 0.20,
	keywords: 0.15,
	gameModes: 0.10,
	platforms: 0.10,
	companies: 0.10,
	rating: 0.05,
}

type Game = {
	id: number
	name: string
	genres: string[]
	themes: string[]
	keywords: string[]
	gameModes: string[]
	platforms: string[]
	companies: string[]
	rating: number
}

const CANDIDATE_POOL_SIZE = 100

type Favourite = {
	gameId: number
}

async function getGamesByIds(ids: number[], limit = 20)
{
	if (ids.length === 0)
		return {
			ok: true as const,
			games: [] as IgdbGame[]
		}

	const token = await getTwitchAccessToken()

	const response = await fetch(
		"https://api.igdb.com/v4/games",
		{
			method: "POST",
			headers: {
				"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
				Authorization: `Bearer ${token}`,
				"Content-Type": "text/plain"
			},
			body: `
				where id = (${ids.join(",")});
				fields
					id,
					name,
					slug,
					cover.image_id,
					first_release_date,
					rating,
					total_rating,
					aggregated_rating,
					genres.id,
					genres.name,
					themes.name,
					keywords.name,
					game_modes.name,
					platforms.id,
					platforms.name,
					platforms.abbreviation,
					involved_companies.company.name;
				sort rating_count desc;
				limit ${limit};
			`
		}
	)

	if (!response.ok)
		return {
			ok: false as const,
			error: await response.text(),
			status: response.status
		}

	return {
		ok: true as const,
		games: await response.json() as IgdbGame[]
	}
}

async function getRecommendationCandidates(limit = 10)
{
	const token = await getTwitchAccessToken()

	const response = await fetch(
		"https://api.igdb.com/v4/games",
		{
			method: "POST",
			headers: {
				"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
				Authorization: `Bearer ${token}`,
				"Content-Type": "text/plain"
			},
			body: `
				where rating_count > 20
					& rating != null;
				fields
					id,
					name,
					slug,
					cover.image_id,
					first_release_date,
					rating,
					total_rating,
					aggregated_rating,
					genres.id,
					genres.name,
					themes.name,
					keywords.name,
					game_modes.name,
					platforms.id,
					platforms.name,
					platforms.abbreviation,
					involved_companies.company.name;
				sort rating_count desc;
				limit ${limit};
			`
		}
	)

	if (!response.ok)
		return {
			ok: false as const,
			error: await response.text(),
			status: response.status
		}

	return {
		ok: true as const,
		games: await response.json() as IgdbGame[]
	}
}

export function jaccardSimilarity(a: string[], b: string[]): number
{
	const setA = new Set(a)
	const setB = new Set(b)

	if (setA.size === 0 || setB.size === 0)
		return 0

	const intersection = [...setA].filter(item => setB.has(item)).length

	const union = new Set([...setA, ...setB]).size

	return intersection / union
}

function normalizeGame(game: IgdbGame): Game
{
	return {
		id: game.id,
		name: game.name ?? "Unknown",

		genres: game.genres?.map((item) => item.name) ?? [],
		themes: game.themes?.map((item) => item.name) ?? [],
		keywords: game.keywords?.map((item) => item.name) ?? [],
		gameModes: game.game_modes?.map((item) => item.name) ?? [],
		platforms: game.platforms?.map((item) => item.name) ?? [],
		// filter con "!== undefined" e non Boolean: così TypeScript sa che restano solo stringhe
		companies: game.involved_companies?.map((item) => item.company?.name).filter((name) => name !== undefined) ?? [],
		rating: game.rating ?? 0,
	}
}

async function getRecommendations(userId: number, limit: number = 5)
{
	const favs: Favourite[] = await listFavourites(userId, {limit: limit, offset: 0})

	if (favs.length < 2)
	{
		const candidates = await getRecommendationCandidates(5)

		if (!candidates.ok)
			return candidates

		return {
			ok: true as const,
			data: candidates.games
		}
	}

	const favouriteIds = favs.map(fav => fav.gameId)
	const favouriteResponse = await getGamesByIds(favouriteIds, limit)

	if (!favouriteResponse.ok)
		return favouriteResponse

	const favouriteGames: Game[] = favouriteResponse.games.map(normalizeGame)

	if (favouriteGames.length === 0)
		return {
			ok: true as const,
			data: []
		}

	const profile =
	{
		genres: [] as string[],
		themes: [] as string[],
		keywords: [] as string[],
		gameModes: [] as string[],
		platforms: [] as string[],
		companies: [] as string[],
	}

	for (const game of favouriteGames)
	{
		profile.genres.push(...game.genres)
		profile.themes.push(...game.themes)
		profile.keywords.push(...game.keywords)
		profile.gameModes.push(...game.gameModes)
		profile.platforms.push(...game.platforms)
		profile.companies.push(...game.companies)
	}

	for (const key of Object.keys(profile) as (keyof typeof profile)[])
		profile[key] = [...new Set(profile[key])]

	// Il pool di candidati è più ampio del risultato, così lo score sceglie davvero
	const candidatesResponse = await getRecommendationCandidates(CANDIDATE_POOL_SIZE)

	if (!candidatesResponse.ok)
			return candidatesResponse

	const seenGameIds = new Set(favouriteIds)

	// Lo score si calcola sul gioco normalizzato, ma si restituisce l'oggetto IGDB originale
	// (con cover, slug, genres {id, name}...) così il frontend lo usa come gli altri IgdbGame
	const candidates = candidatesResponse.games.filter((game) => !seenGameIds.has(game.id))

	const recommendations = candidates.map(rawGame =>
	{
		const game = normalizeGame(rawGame)

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

			(game.rating / 100) * weights.rating

		return {
			...rawGame,
			recommendationScore: Math.round(score * 10000) / 100
		}
	})

	return {
		ok: true as const,
		data: recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, limit)
	}
}

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/games/suggested", RATE_LIMIT_POLICIES.suggest)

			if (!rl_result.success)
			{
				return NextResponse.json(
				{error: "Too many requests. Please try again later."},
				{
					status: 429,
					headers: {
						"Retry-After": String(rl_result.retryAfter),
						"X-RateLimit-Limit": String(rl_result.limit),
						"X-RateLimit-Remaining": "0"
					}
				}
				)
			}			
		}
		catch(error)
		{
			console.error(error)
			return jsonError("Service temporarily unavailable", 503)
		}

		const recommended = await getRecommendations(session.userId)		
		if (!recommended.ok)
		{
			console.error("IGDB ERROR:", {
				status: recommended.status,
				body: recommended.error
			})

			return jsonError("Failed to fetch games", 502)
		}

		return NextResponse.json(recommended.data)
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})