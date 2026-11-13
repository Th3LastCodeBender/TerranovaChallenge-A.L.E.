import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { listFavourites } from "@/query/favourites"
import { getGamesByIds, jsonError} from "@/lib/utils"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/favourites/get-favourites", RATE_LIMIT_POLICIES.get_items)

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

		const offsetParam = req.nextUrl.searchParams.get("offset")
		const offset = Number(offsetParam)

		if (offsetParam === null || !Number.isInteger(offset) || offset < 0)
			return jsonError("Invalid offset", 400)

		const limit = 20
		const favourites = await listFavourites(session.userId)
		const ids = favourites.slice(offset, offset + limit).map((fav: {gameId: number}) => fav.gameId)	
		const games = await getGamesByIds(ids)

		if (!games.ok)
		{
			const errorBody = await games.text()

			console.error("IGDB ERROR:", {
				status: games.status,
				body: errorBody
			})

			return jsonError("Failed to fetch games", 502)
		}

		return NextResponse.json({games: games, total: favourites.length})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})