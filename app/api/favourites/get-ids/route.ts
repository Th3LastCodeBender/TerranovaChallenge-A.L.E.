import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { listFavourites } from "@/query/favourites"
import { jsonError } from "@/lib/utils"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

// Restituisce solo gli id dei giochi preferiti dell'utente (senza chiamare IGDB),
// usato dal frontend per mostrare lo stato del cuore nelle game-card
export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/favourites/get-ids", RATE_LIMIT_POLICIES.get_items)

		if (limited)
			return limited

		const favourites = await listFavourites(session.userId)
		const ids = favourites.map((fav: {gameId: number}) => fav.gameId)

		return NextResponse.json({ids})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})
