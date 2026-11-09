import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { jsonError, requireEnv } from "@/lib/utils"
import { listFavourites } from "@/query/favourites"
import { getTwitchAccessToken } from "@/lib/igdb-api/twitch-auth"

async function getGamesByIds(ids: number[])
{
    if (ids.length === 0)
        return []

	const token = await getTwitchAccessToken()

	const response = await fetch(
		"https://api.igdb.com/v4/games",
		{
			method: "POST",
			headers: {
				"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
				Authorization: `Bearer ${token}`,
				"Content-Type": "text/plain"
			},
			body: `
				where id = (${ids.join(",")});
				fields	name,
						cover.url,
						summary,
						first_release_date,
						rating,
						genres.name,
						platforms.name;
				limit 50;
			`
		}
	)

	if (!response.ok)
		throw new Error("Failed to fetch games from IGDB")

	return response.json()
}

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const offset = req.nextUrl.searchParams.get("offset")
		if (!Number.isInteger(offset) || offset <= 0)
			return jsonError("Invalid offset", 400)

		const limit = 20
        const favourites = listFavourites(session.userId)
        const ids = favourites.slice(offset, offset + limit).map((fav: {gameId: number}) => fav.gameId)	
		const games = await getGamesByIds(ids)

		return NextResponse.json(games)
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Server error", 500)
	}
})