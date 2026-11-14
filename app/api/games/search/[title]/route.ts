import { jsonError, requireEnv } from "@/lib/utils"
import { NextRequest, NextResponse } from "next/server"
import { getTwitchAccessToken } from "@/lib/igdb-api/twitch-auth"
import { rateLimit, RATE_LIMIT_POLICIES } from "@/lib/redis/rate-limit"
import { Filters, buildConditions, buildSort, getFiltersFromRequest, validateFilters } from "@/lib/igdb-api/filters"

function buildIGDBQuery(title: string, filters: Filters): string
{
	const safeTitle = title.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"')
	const conditions = buildConditions(filters)

	conditions.push(`name ~ *"${safeTitle}"*`)

	return `
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
		limit 20;
		offset ${filters.offset};
	`
}

async function fetchIGDBGames(query: string, token: string)
{
	return fetch("https://api.igdb.com/v4/games", {
		method: "POST",
		headers: {
			"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
			Authorization: `Bearer ${token}`,
			"Content-Type": "text/plain"
		},
		body: query,
		cache: "no-store"
	})
}

export async function GET(req: NextRequest, context: {params: Promise<{ title: string }>})
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/games/search/[title]", RATE_LIMIT_POLICIES.search)

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

		const {title} = await context.params

		if (!title?.trim())
			return jsonError("Missing game title", 400)

		const filters = getFiltersFromRequest(req, {sort: "name", order: "asc"})
		const validationError = validateFilters(filters)

		if (validationError)
			return jsonError(validationError, 400)

		const token = await getTwitchAccessToken()
		const query = buildIGDBQuery(title, filters)
		const res = await fetchIGDBGames(query, token)

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

		return NextResponse.json({
			results: games,
			count: games.length,
			offset: filters.offset,
			limit: 20,
			hasMore: games.length === 20
		})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
}