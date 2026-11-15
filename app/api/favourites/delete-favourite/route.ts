import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { removeFavourite } from "@/query/favourites"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/favourites/delete-favourite", RATE_LIMIT_POLICIES.delete_item)

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