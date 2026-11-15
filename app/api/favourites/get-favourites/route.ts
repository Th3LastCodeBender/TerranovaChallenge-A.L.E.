import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { countFavourites, listFavourites } from "@/query/favourites"
import { getGamesByIds, jsonError} from "@/lib/utils"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/favourites/get-favourites", RATE_LIMIT_POLICIES.get_items)

		if (limited)
			return limited

		const offsetParam = req.nextUrl.searchParams.get("offset")
		const offset = Number(offsetParam)

		if (offsetParam === null || !Number.isInteger(offset) || offset < 0)
			return jsonError("Invalid offset", 400)

		const limit = 20
		const [favourites, total] = await Promise.all([
			listFavourites(session.userId, { limit, offset }),
			countFavourites(session.userId)
		])
		const ids = favourites.map((fav) => fav.gameId)	
		const fetched_games = await getGamesByIds(ids)

		if (!fetched_games.ok)
		{
			console.error("IGDB ERROR:", {
				status: fetched_games.status,
				body: fetched_games.error
			})

			return jsonError("Failed to fetch games", 502)
		}

		return NextResponse.json({games: fetched_games.games, total})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})