import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { listCollection } from "@/query/collection"
import { jsonError } from "@/lib/utils"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

// Restituisce lo stato di ogni gioco nella collezione dell'utente (senza chiamare IGDB),
// usato dal frontend per mostrare lo stato nelle game-card: { statuses: { [gameId]: status } }
export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/collections/get-statuses", RATE_LIMIT_POLICIES.get_items)

		if (limited)
			return limited

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
