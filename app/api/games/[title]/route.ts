import { jsonError, requireEnv } from "@/lib/utils"
import { NextRequest, NextResponse } from "next/server"
import { getTwitchAccessToken } from "@/lib/igdb-api/twitch-auth"
import { rateLimit, RATE_LIMIT_POLICIES } from "@/lib/redis/rate-limit"

type Filters = {
	genre: string | null
	platform: string | null
	year: string | null
	rating: string | null
	aggregate_rating: string | null
	sort: string
	order: string
	offset: number
}

function validateFilters(filters: Filters): string | null
{
	const { genre, platform, year, rating, sort, order, aggregate_rating } = filters

	if (genre && !/^\d+$/.test(genre))
		return "Invalid genre"

	if (platform && !/^\d+$/.test(platform))
		return "Invalid platform"

	if (year && (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > new Date().getFullYear()))
		return "Invalid year"

	if (rating && (!/^\d+(\.\d+)?$/.test(rating) || Number(rating) < 0 || Number(rating) > 100))
		return "Invalid rating"

	if (!["name", "date", "rating", "aggregated_rating"].includes(sort))
		return "Invalid sort parameter"

	if (!["asc", "desc"].includes(order))
		return "Invalid order parameter"

	if (!Number.isInteger(filters.offset) || filters.offset < 0 || filters.offset > 9999)
		return "Invalid offset"

	if (aggregate_rating && (!/^\d+(\.\d+)?$/.test(aggregate_rating) || Number(aggregate_rating) < 0 || Number(aggregate_rating) > 100))
		return "Invalid aggregate rating"

	return null
}

function buildConditions(filters: Filters): string[]
{
	const conditions = ["version_parent = null"]

	const { genre, platform, year, rating, aggregate_rating } = filters

	if (genre)
		conditions.push(`${Number(genre)} = genres`)

	if (platform)
		conditions.push(`${Number(platform)} = platforms`)

	if (year)
	{
		const start = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000)
		const end = Math.floor(new Date(`${Number(year) + 1}-01-01T00:00:00Z`).getTime() / 1000)

		conditions.push(`first_release_date >= ${start} & first_release_date < ${end}`)
	}

	if (rating)
		conditions.push(`rating >= ${Number(rating)}`)

	if (aggregate_rating)
		conditions.push(`aggregated_rating >= ${Number(aggregate_rating)}`)

	return conditions
}

function buildIGDBQuery(title: string, filters: Filters): string
{
	const sortFields: Record<string, string> = {
		name: "name",
		date: "first_release_date",
		rating: "rating",
		aggregated_rating: "aggregated_rating"
	}

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
		sort ${sortFields[filters.sort]} ${filters.order};
		limit 20;
		offset ${filters.offset};
	`
}

function getFiltersFromRequest(request: NextRequest): Filters
{
	const params = request.nextUrl.searchParams

	return {
		genre: params.get("genre"),
		platform: params.get("platform"),
		year: params.get("year"),
		rating: params.get("rating"),
		aggregate_rating: params.get("aggregate_rating"),
		sort: params.get("sort") ?? "name",
		order: params.get("order") ?? "asc",
		offset: Number(params.get("offset") ?? 0)
	}
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

export async function GET(req: NextRequest, context: { params: Promise<{ title: string }> })
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/games/[title]", RATE_LIMIT_POLICIES.search)

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
		}

		const {title} = await context.params

		if (!title?.trim())
			return jsonError("Missing game title", 400)

		const filters = getFiltersFromRequest(req)
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