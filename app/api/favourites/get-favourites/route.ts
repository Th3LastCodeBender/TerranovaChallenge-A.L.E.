import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { listFavourites } from "@/query/favourites"
import { getGamesByIds, jsonError} from "@/lib/utils"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const offsetParam = req.nextUrl.searchParams.get("offset")
		const offset = Number(offsetParam)

		if (offsetParam === null || !Number.isInteger(offset) || offset < 0)
			return jsonError("Invalid offset", 400)

		const limit = 20
		const favourites = await listFavourites(session.userId)
		const ids = favourites.slice(offset, offset + limit).map((fav: {gameId: number}) => fav.gameId)	
		const games = await getGamesByIds(ids)

		return NextResponse.json({games: games, total: favourites.length})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})