import { isFavourite } from "@/query/favourites"
import { getGameStatus } from "@/query/collection"
import { checkAuth } from "@/lib/auth/authWrapper"
import { jsonError, requireEnv } from "@/lib/utils"
import { NextRequest, NextResponse } from "next/server"
import { getTwitchAccessToken } from "@/lib/igdb-api/twitch-auth"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

async function fetchGameFromIGDB(slug: string)
{
	const token = await getTwitchAccessToken()

	const query = `
		fields
			id,
			name,
			slug,
			summary,
			storyline,
			first_release_date,
			rating,
			rating_count,
			aggregated_rating,
			aggregated_rating_count,
			cover.image_id,
			genres.id,
			genres.name,
			platforms.id,
			platforms.name,
			involved_companies.company.name,
			involved_companies.developer,
			involved_companies.publisher,
			screenshots.image_id,
			videos.video_id,
			websites.url;
		where slug = "${slug}";
		limit 1;
	`

	const res = await fetch("https://api.igdb.com/v4/games", {
		method: "POST",
		headers: {
			"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
			Authorization: `Bearer ${token}`,
			"Content-Type": "text/plain"
		},
		body: query,
		cache: "no-store"
	})

	if (!res.ok)
	{
		console.error("IGDB ERROR:", await res.text())
		throw new Error("Failed to fetch game")
	}

	const games = await res.json()
	const game = games[0] ?? null

	if (!game)
		return null

	return {
		...game,
		screenshots: (game.screenshots ?? []).map(
			(screenshot: {image_id: string}) => ({
				image_id: screenshot.image_id,
				url: `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${screenshot.image_id}.jpg`
			})
		)
	}
}

async function getUserGameData(req: NextRequest, gameId: number)
{
	const auth = await checkAuth(req)

	if (!auth.ok)
	{
		return {
			isFavourite: false,
			collectionStatus: null
		}
	}

	const [favourite, collection] = await Promise.all([
		isFavourite(auth.session.userId, gameId),
		getGameStatus(auth.session.userId, gameId)
	])

	return {
		isFavourite: favourite,
		collectionStatus: collection?.status ?? null
	}
}

export async function GET(req: NextRequest, context: {params: Promise<{slug: string}>})
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/games/[slug]", RATE_LIMIT_POLICIES.get_slug)

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
		
		const {slug} = await context.params

		if (!slug || !/^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(slug))
			return jsonError("Invalid game slug", 400)

		let game
		try
		{
			game = await fetchGameFromIGDB(slug)
		}
		catch(error)
		{
			console.error(error)
			return jsonError("Failed to fetch game", 503)
		}

		if (!game)
			return jsonError("Game not found", 404)

		let userData
		try
		{
			userData = await getUserGameData(req, game.id)
		}
		catch(error)
		{
			console.error(error)
			return jsonError("Failed to fetch user game data", 500)
		}

		return NextResponse.json({
			game,
			userData
		})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
}
