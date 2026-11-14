import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { listFavourites } from "@/query/favourites"
import { jsonError } from "@/lib/utils"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

// Restituisce solo gli id dei giochi preferiti dell'utente (senza chiamare IGDB),
// usato dal frontend per mostrare lo stato del cuore nelle game-card
export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/favourites/get-ids", RATE_LIMIT_POLICIES.get_items)

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

		const favourites = await listFavourites(session.userId)
		const ids = favourites.map((fav: {gameId: number}) => fav.gameId)

		return NextResponse.json({ ids })
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})
