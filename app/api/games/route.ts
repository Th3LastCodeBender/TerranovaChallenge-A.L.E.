import { NextResponse } from "next/server"	
import { withAuth } from "@/lib/auth/authWrapper"
import { jsonError, requireEnv} from "@/lib/utils"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import { getTwitchAccessToken } from "@/lib/igdb-api/twitch-auth"

async function fetchIGDBGames(offset: number)
{
	return fetch("https://api.igdb.com/v4/games", {
		method: "POST",
		headers: {
			"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
			Authorization: `Bearer ${await getTwitchAccessToken()}`,
			"Content-Type": "text/plain"
		},
		body: `
			fields
				id,
				name,
				slug,
				summary,
				first_release_date,
				rating,
				rating_count,
				aggregated_rating,
				aggregated_rating_count,
				cover.image_id,
				genres.id,
				genres.name,
				platforms.id,
				platforms.name;
			limit 20;
			offset ${offset};
		`,
		cache: "no-store"
	})
}

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/games", RATE_LIMIT_POLICIES.games)

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

		const offsetParam = req.nextUrl.searchParams.get("offset")
		const offset = Number(offsetParam)

		if (offsetParam === null || !Number.isInteger(offset) || offset < 0)
			return jsonError("Invalid offset", 400)

		const res = await fetchIGDBGames(offset)

		if (!res.ok)
		{
			const errorBody = await res.text()

			console.error("IGDB ERROR:", {
				status: res.status,
				body: errorBody
			})

			return jsonError("Failed to fetch games", 502)
		}
		const games = await res.json()
		
		return NextResponse.json({results: games})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})