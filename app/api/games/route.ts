import { jsonError, requireEnv} from "@/lib/utils"
import { NextRequest,NextResponse } from "next/server"	
import { getTwitchAccessToken } from "@/lib/igdb-api/twitch-auth"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import { Filters, buildConditions, buildSort, getFiltersFromRequest, validateFilters } from "@/lib/igdb-api/filters"

const PAGE_SIZE = 20

async function fetchIGDBGames(filters: Filters)
{
	// rating_count > 0 esclude i giochi quasi sconosciuti dal catalogo
	const conditions = [...buildConditions(filters), "rating_count > 0"]

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
			where ${conditions.join(" & ")};
			${buildSort(filters)}
			limit ${PAGE_SIZE};
			offset ${filters.offset};
		`,
		cache: "no-store"
	})
}

export async function GET(req: NextRequest)
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

		const filters = getFiltersFromRequest(req, {sort: "popularity", order: "desc"})
		const validationError = validateFilters(filters)

		if (validationError)
			return jsonError(validationError, 400)

		const res = await fetchIGDBGames(filters)

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
		
		// stessa forma di /api/games/search, cosi il frontend usa un solo tipo
		return NextResponse.json({
			results: games,
			count: games.length,
			offset: filters.offset,
			limit: PAGE_SIZE,
			hasMore: games.length === PAGE_SIZE
		})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
}