import { NextRequest } from "next/server"

export const IGDB_GENRES: Record<string, number> = {
	"point-and-click": 2,
	"fighting": 4,
	"shooter": 5,
	"music": 7,
	"platform": 8,
	"puzzle": 9,
	"racing": 10,
	"real-time-strategy": 11,
	"role-playing-rpg": 12,
	"simulator": 13,
	"sport": 14,
	"strategy": 15,
	"turn-based-strategy": 16,
	"tactical": 24,
	"adventure": 31,
	"indie": 32,
	"arcade": 33,
	"visual-novel": 34,
	"card-and-board-game": 35,
	"moba": 36
}

const SORT_FIELDS: Record<string, string> = {
	name: "name",
	date: "first_release_date",
	rating: "rating",
	aggregated_rating: "aggregated_rating",
	popularity: "rating_count"
}

export type Filters = {
	genre: string | null
	platform: string | null
	year: string | null
	rating: string | null
	aggregate_rating: string | null
	sort: string
	order: string
	offset: number
}

export function getFiltersFromRequest(request: NextRequest, defaults: {sort: string, order: string}): Filters
{
	const params = request.nextUrl.searchParams

	return {
		genre: params.get("genre"),
		platform: params.get("platform"),
		year: params.get("year"),
		rating: params.get("rating"),
		aggregate_rating: params.get("aggregate_rating"),
		sort: params.get("sort") ?? defaults.sort,
		order: params.get("order") ?? defaults.order,
		offset: Number(params.get("offset") ?? 0)
	}
}

export function validateFilters(filters: Filters): string | null
{
	const {genre, platform, year, rating, sort, order, aggregate_rating} = filters

	if (genre && !Object.hasOwn(IGDB_GENRES, genre))
		return "Invalid genre"

	if (platform && !/^\d+$/.test(platform))
		return "Invalid platform"

	if (year && (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > new Date().getFullYear()))
		return "Invalid year"

	if (rating && (!/^\d+(\.\d+)?$/.test(rating) || Number(rating) < 0 || Number(rating) > 100))
		return "Invalid rating"

	if (!Object.hasOwn(SORT_FIELDS, sort))
		return "Invalid sort parameter"

	if (!["asc", "desc"].includes(order))
		return "Invalid order parameter"

	if (!Number.isInteger(filters.offset) || filters.offset < 0 || filters.offset > 9999)
		return "Invalid offset"

	if (aggregate_rating && (!/^\d+(\.\d+)?$/.test(aggregate_rating) || Number(aggregate_rating) < 0 || Number(aggregate_rating) > 100))
		return "Invalid aggregate rating"

	return null
}

export function buildConditions(filters: Filters): string[]
{
	const conditions = ["version_parent = null"]

	const {genre, platform, year, rating, aggregate_rating, sort} = filters

	if (genre)
		conditions.push(`genres = (${IGDB_GENRES[genre]})`)

	if (platform)
		conditions.push(`platforms = (${Number(platform)})`)

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

	if (sort !== "name")
		conditions.push(`${SORT_FIELDS[sort]} != null`)

	return conditions
}

export function buildSort(filters: Filters): string
{
	return `sort ${SORT_FIELDS[filters.sort]} ${filters.order};`
}
