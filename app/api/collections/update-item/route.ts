import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { setGameStatus } from "@/query/collection"
import { WG_GameStatus } from "@/lib/generated/prisma/enums"

export const POST = withAuth(async (req, { session }) =>
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

		if (typeof body !== "object" || body === null)
			return jsonError("Invalid body", 400)

		if (!("gameId" in body))
			return jsonError("Missing gameId", 400)

		if (!("collectionType" in body))
			return jsonError("Missing collection type", 400)

		const gameId = Number(body.gameId)

		if (!Number.isInteger(gameId) || gameId <= 0)
			return jsonError("Invalid game id", 400)

		const collectionType = body.collectionType

		if (typeof collectionType !== "string" || !Object.values(WG_GameStatus).includes(collectionType as WG_GameStatus))
			return jsonError("Invalid collection type", 400)

		const status = collectionType as WG_GameStatus

		await setGameStatus(session.userId, gameId, status)
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})