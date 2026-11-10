import "server-only"

import { redis_pool } from "./redis-init"
import type { GameRequirements} from "../llm/extract-requirements"

const CACHE_VERSION = "v1"
const FOUND_TTL_SECONDS = 60 * 60 * 24 * 30
const NOT_FOUND_TTL_SECONDS = 60 * 60 * 24 * 7

export type CachedRequirements =
	| { cached: false }
	| { cached: true, requirements: GameRequirements | null }

function cacheKey(steamAppId: number): string
{
	return `requirements:${CACHE_VERSION}:steam:${steamAppId}`
}

export async function getCachedRequirements(steamAppId: number): Promise<CachedRequirements>
{
	const raw = await redis_pool.get(cacheKey(steamAppId))

	if (raw === null)
		return { cached: false }

	try
	{
		const requirements = JSON.parse(raw) as GameRequirements | null
		return { cached: true, requirements }
	}
	catch
	{
		return { cached: false }
	}
}

export async function setCachedRequirements(steamAppId: number, requirements: GameRequirements | null): Promise<void>
{
	const ttl = requirements ? FOUND_TTL_SECONDS : NOT_FOUND_TTL_SECONDS

	await redis_pool.set(cacheKey(steamAppId), JSON.stringify(requirements), "EX", ttl)
}