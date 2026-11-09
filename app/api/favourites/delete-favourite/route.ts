import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { removeFavourite } from "@/query/favourites"

export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
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

		const favourites = removeFavourite(session.userId, Number(gameId))
		return NextResponse.json(favourites)
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Server error", 500)
	}
})