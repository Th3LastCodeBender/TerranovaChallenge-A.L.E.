import "server-only"

import { requireEnv } from "../utils"
import { redis_pool } from "../redis/redis-init"
import { getTwitchAccessToken } from "./twitch-auth"

const STEAM_SOURCE_ID = 1
const CACHE_VERSION = "v1"
const FOUND_TTL_SECONDS = 60 * 60 * 24 * 30
const NOT_FOUND_TTL_SECONDS = 60 * 60 * 24 * 7

type ExternalGame = {
	uid?: string
}

type CachedAppId =
	| { cached: false }
	| { cached: true, appId: number | null }

function cacheKey(igdbId: number): string
{
	return `steam-appid:${CACHE_VERSION}:igdb:${igdbId}`
}

async function fetchSteamAppId(igdbId: number): Promise<number | null> 
{
	const token = await getTwitchAccessToken()

	const resp = await fetch("https://api.igdb.com/v4/external_games", {
		method: "POST",
		headers: {
			"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
			Authorization: `Bearer ${token}`,
			"Content-Type": "text/plain"
		},
		body: `fields uid; where game = ${igdbId} & external_game_source = ${STEAM_SOURCE_ID}; sort id asc; limit 10;`,
		cache: "no-store"
	})

	if (!resp.ok)
		throw new Error(`IGDB external_games failed: ${resp.status}`)

	const rows = await resp.json() as ExternalGame[]

	for (const row of rows)
	{
		const appId = Number(row.uid)

		if (Number.isInteger(appId) && appId > 0)
			return appId
	}

	return null
}

async function getCachedAppId(igdbId: number): Promise<CachedAppId>
{
	const raw = await redis_pool.get(cacheKey(igdbId))

	if (raw === null)
		return { cached: false }

	const appId = JSON.parse(raw) as number | null
	return { cached: true, appId }
}

async function setCachedAppId(igdbId: number, appId: number | null): Promise<void>
{
	const ttl = appId !== null ? FOUND_TTL_SECONDS : NOT_FOUND_TTL_SECONDS

	await redis_pool.set(cacheKey(igdbId), JSON.stringify(appId), "EX", ttl)
}

export async function getSteamAppId(igdbId: number): Promise<number | null>
{
	try
	{
		const cached = await getCachedAppId(igdbId)

		if (cached.cached)
			return cached.appId

	}
	catch (error)
	{
		console.error("Steam appid cache read failed:", error)
	}

	const appId = await fetchSteamAppId(igdbId)

	try
	{
		await setCachedAppId(igdbId, appId)
	}
	catch (error)
	{
		console.error("Steam appid cache write failed", error)
	}

	return appId
}
