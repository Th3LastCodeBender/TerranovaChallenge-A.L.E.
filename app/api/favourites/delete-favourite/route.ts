import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { removeFavourite } from "@/query/favourites"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/favourites/delete-favourite", RATE_LIMIT_POLICIES.delete_item)

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

		let body: unknown

		try
		{
			body = await req.json()
		}
		catch (error)
		{
			console.error(error)
			return jsonError("Invalid JSON body", 400)
		}

		if (typeof body !== "object" || body === null || !("gameId" in body))
			return jsonError("Missing gameId", 400)

		const gameId = Number(body.gameId)

		if (!Number.isInteger(gameId) || gameId <= 0)
			return jsonError("Invalid game id", 400)

		await removeFavourite(session.userId, gameId)
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})