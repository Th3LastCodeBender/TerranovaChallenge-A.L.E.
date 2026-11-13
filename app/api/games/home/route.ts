import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { getTwitchAccessToken } from "@/lib/igdb-api/twitch-auth"
import { getGamesByIds, jsonError, requireEnv } from "@/lib/utils"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

async function igdbRequest(endpoint: string, query: string)
{
	const response = await fetch(`https://api.igdb.com/v4/${endpoint}`,
		{
			method: "POST",
			headers: {
				"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
			Authorization: `Bearer ${await getTwitchAccessToken()}`,
				"Content-Type": "text/plain",
			},
			body: query,
			cache: "no-store"
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
		popularity: await response.json()
	}
}

async function getIgdbMostTrendingGames()
{
	const fetched_popularity = await igdbRequest(
		"popularity_primitives",
		`
			fields game_id, value, popularity_type
			where popularity_type = 1
			sort value desc
			limit 10
		`
	)

	if (!fetched_popularity.ok)
		return null

	if (!fetched_popularity.popularity.length)
		return []

	const gameIds = fetched_popularity.popularity.map((item: any) => item.game_id)
	const fetched_games = await getGamesByIds(gameIds)

	if (!fetched_games.ok)
		return null

	const gamesMap = new Map(fetched_games.games.map((game: any) => [game.id, game]))

	const trending = fetched_popularity.popularity.map((item: any, index: number) =>
		{
			const game: any = gamesMap.get(item.game_id)

			if (!game)
				return null

			return {
				...game,
				trending_rank: index + 1,
				popularity: item.value,
			}
		}
	).filter(Boolean)

	return trending
}

async function getIgdbMostPlayedGames()
{
	const fetched_popularity = await igdbRequest(
		"popularity_primitives",
		`
			fields game_id, value, popularity_type
			where popularity_type = 1
			sort value desc
			limit 10
		`
	)

	if (!fetched_popularity.ok)
		return null

	if (!fetched_popularity.popularity.length)
		return []

	const gameIds = fetched_popularity.popularity.map((item: any) => item.game_id)
	const fetched_games = await getGamesByIds(gameIds)

	if (!fetched_games.ok)
		return null

	const gamesMap = new Map(fetched_games.games.map((game: any) => [game.id, game]))

	const most_played = fetched_popularity.popularity.map((item: any, index: number) =>
	{
		const game: any = gamesMap.get(item.game_id)

		if (!game)
			return null

		return {
			...game,
			played_rank: index + 1,
			popularity: item.value,
		}
	}).filter(Boolean)

	return most_played
}

async function getIgdbMostRecentGames()
{
	const fetched_games = await igdbRequest(
		"games",
		`
			fields
				id,
				name,
				slug,
				summary,
				first_release_date,
				rating,
				rating_count,
				aggregated_rating,
				aggregated_rating_count,
				cover.image_id,
				genres.id,
				genres.name,
				platforms.id,
				platforms.name;
			where first_release_date != null
			sort first_release_date desc
			limit 10;
		`
	)

	if (!fetched_games.ok)
		return null

	return fetched_games.popularity
}

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/games/home", RATE_LIMIT_POLICIES.home_fetch)

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

		const trending = await getIgdbMostTrendingGames()
		if (!trending)
			return jsonError("Service temporarily unavailable", 503)

		const most_played = getIgdbMostPlayedGames()
		if (!most_played)
			return jsonError("Service temporarily unavailable", 503)

		const most_recent = getIgdbMostRecentGames()
		if (!most_recent)
			return jsonError("Service temporarily unavailable", 503)

		return NextResponse.json({trending_games: trending, most_played: most_played, most_recent: most_recent})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})