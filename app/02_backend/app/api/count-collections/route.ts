import { jsonError} from "@/lib/utils"
import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { countCollection } from "@/query/collection"
import { countFavourites } from "@/query/favourites"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/count-collections", RATE_LIMIT_POLICIES.get_collections_count)

		if (limited)
			return limited

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

		return NextResponse.json(
			{
				favourites_length: favourites,
				to_play_length: toPlay,
				playing_length: playing,
				finished_length: finished,
				to_buy_length: toBuy
			}
		)
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})