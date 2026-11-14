import { jsonError} from "@/lib/utils"
import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { countCollection } from "@/query/collection"
import { countFavourites } from "@/query/favourites"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

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

		const [
			favourites,
			toPlay,
			playing,
			finished,
			toBuy
		] = await Promise.all([
			countFavourites(session.userId),
			countCollection(session.userId, "TO_PLAY"),
			countCollection(session.userId, "PLAYING"),
			countCollection(session.userId, "FINISHED"),
			countCollection(session.userId, "TO_BUY")
		])

		return NextResponse.json({
			favourites_length: favourites.length,
			to_play_length: toPlay.length,
			playing_length: playing.length,
			finished_length: finished.length,
			to_buy_length: toBuy.length
		})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})