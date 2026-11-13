import { jsonError} from "@/lib/utils"
import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { listFavourites } from "@/query/favourites"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import { listCollection } from "@/query/collection"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/count-collections", RATE_LIMIT_POLICIES.get_collections_count)

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
		const to_play = await listCollection(session.userId, "TO_PLAY")
		const playing = await listCollection(session.userId, "PLAYING")
		const finished = await listCollection(session.userId, "FINISHED")
		const to_buy = await listCollection(session.userId, "TO_BUY")

		return NextResponse.json(
			{
				favourites_length: favourites.length,
				to_play_length: to_play.length,
				playing_length: playing.length,
				finished_length: finished.length,
				to_buy_length: to_buy.length
			}
		)
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})