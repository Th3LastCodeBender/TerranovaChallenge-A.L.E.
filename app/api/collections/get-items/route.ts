import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { listCollection } from "@/query/collection"
import { getGamesByIds, jsonError } from "@/lib/utils"
import { WG_GameStatus } from "@/lib/generated/prisma/enums"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const offsetParam = req.nextUrl.searchParams.get("offset")
		const offset = Number(offsetParam)

		if (offsetParam === null || !Number.isInteger(offset) || offset < 0)
			return jsonError("Invalid offset", 400)

		const collectionType = req.nextUrl.searchParams.get("collection_type")

		if (!Object.values(WG_GameStatus).includes(collectionType as WG_GameStatus))
			return jsonError("Invalid collection type", 400)

		const status = collectionType as WG_GameStatus
		const limit = 20
		const entries = await listCollection(session.userId, status)
		const ids = entries.slice(offset, offset + limit).map((fav: {gameId: number}) => fav.gameId)	
		const fetched_games = await getGamesByIds(ids)

		if (!fetched_games.ok)
		{
			console.error("IGDB ERROR:", {
				status: fetched_games.status,
				body: fetched_games.error
			})

			return jsonError("Failed to fetch games", 502)
		}

		return NextResponse.json({games: fetched_games.games, total: entries.length})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})