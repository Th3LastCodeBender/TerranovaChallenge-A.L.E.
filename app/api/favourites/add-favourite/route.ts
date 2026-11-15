import { jsonError, parseGameId } from "@/lib/utils"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { addFavourite } from "@/query/favourites"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const POST = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/favourites/add-favourite", RATE_LIMIT_POLICIES.add_item)

		if (limited)
			return limited
	
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

		const gameId = parseGameId(body.gameId)

		if (gameId === null)
			return jsonError("Invalid game id", 400)

		await addFavourite(session.userId, gameId)
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})