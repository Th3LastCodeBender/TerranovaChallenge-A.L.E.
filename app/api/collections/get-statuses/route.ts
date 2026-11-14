import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { listCollection } from "@/query/collection"
import { jsonError } from "@/lib/utils"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

// Restituisce lo stato di ogni gioco nella collezione dell'utente (senza chiamare IGDB),
// usato dal frontend per mostrare lo stato nelle game-card: { statuses: { [gameId]: status } }
export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/collections/get-statuses", RATE_LIMIT_POLICIES.get_items)

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

		const entries = await listCollection(session.userId)
		const statuses = Object.fromEntries(entries.map(e => [e.gameId, e.status]))

		return NextResponse.json({ statuses })
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})
