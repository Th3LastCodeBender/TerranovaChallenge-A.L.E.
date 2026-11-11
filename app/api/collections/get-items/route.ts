import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { listCollection } from "@/query/collection"
import { getGamesByIds, jsonError } from "@/lib/utils"
import { WG_GameStatus } from "@/lib/generated/prisma/enums"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/collections/get-items", RATE_LIMIT_POLICIES.get_items)

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

		if (!Number.isInteger(offset) || offset < 0)
			return jsonError("Invalid offset", 400)

		const collectionType = req.nextUrl.searchParams.get("collection_type")

		if (!Object.values(WG_GameStatus).includes(collectionType as WG_GameStatus))
			return jsonError("Invalid collection type", 400)

		const status = collectionType as WG_GameStatus
		const limit = 20
		const entries = await listCollection(session.userId, status)
		const ids = entries.slice(offset, offset + limit).map((fav: {gameId: number}) => fav.gameId)	
		const games = await getGamesByIds(ids)

		return NextResponse.json({games: games, total: entries.length})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})