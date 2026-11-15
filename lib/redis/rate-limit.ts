import "server-only"

import { redis_pool } from "./redis-init"
import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { getClientIp } from "@/lib/security/client-ip"

export const RATE_LIMIT_POLICIES =
{
	general: {limit: 100, windowSeconds: 60},
	search: {limit: 20, windowSeconds: 60},
	login: {limit: 10, windowSeconds: 60 * 15},
	signup: {limit: 5, windowSeconds: 60 * 60},
	logout: {limit: 20, windowSeconds: 60},
	otp_attempt: {limit: 5, windowSeconds: 60 * 15},
	add_item: {limit: 50, windowSeconds: 60},
	delete_item: {limit: 50, windowSeconds: 60},
	get_items: {limit: 30, windowSeconds: 60},
	get_slug: {limit: 30, windowSeconds: 60},
	enable_2fa: {limit: 5, windowSeconds: 60 * 10},
	disable_2fa: {limit: 5, windowSeconds: 60 * 5},
	games: { limit: 25, windowSeconds: 60},
	get_collections_count: {limit: 10, windowSeconds: 60},
	add_specs: {limit: 5, windowSeconds: 60},
	delete_specs: {limit: 5, windowSeconds: 60},
	get_specs: {limit: 10, windowSeconds: 60},
	home_fetch: {limit: 10, windowSeconds: 60},
	suggest: {limit: 5, windowSeconds: 60},
	can_i_run: {limit: 10, windowSeconds: 60},
	delete_account: {limit: 5, windowSeconds: 60 * 15}
}

interface RateLimitOptions {
	limit: number
	windowSeconds: number
}

export async function rateLimit(identifier: string, endpoint: string, options: RateLimitOptions)
{
	const {limit, windowSeconds} = options

	const key = `rate-limit:${endpoint}:${identifier}`

	const script = `
		local current = redis.call("INCR", KEYS[1])

		if current == 1 then
			redis.call("EXPIRE", KEYS[1], ARGV[1])
		end

		local ttl = redis.call("TTL", KEYS[1])

		return { current, ttl }
	`

	const result = (await redis_pool.eval(script, 1, key, windowSeconds)) as [number, number]
	const [current, ttl] = result

	return {
		success: current <= limit,
		limit,
		remaining: Math.max(0, limit - current),
		retryAfter: Math.max(0, ttl)
	}
}

// Il blocco che ogni route faceva a mano. Restituisce la risposta da mandare se la richiesta
// va fermata (429 troppe richieste, 503 Redis non raggiungibile), oppure null se si può proseguire:
//
//   const limited = await checkRateLimit(req, "/api/...", RATE_LIMIT_POLICIES.xxx)
//   if (limited)
//       return limited
//
// identifier di default è l'IP; le route che contano per utente passano `user:${session.userId}`.
export async function checkRateLimit(req: Request, endpoint: string, options: RateLimitOptions, identifier: string = getClientIp(req)): Promise<NextResponse | null>
{
	try
	{
		const result = await rateLimit(identifier, endpoint, options)

		if (result.success)
			return null

		return NextResponse.json(
			{error: "Too many requests. Please try again later."},
			{
				status: 429,
				headers: {
					"Retry-After": String(result.retryAfter),
					"X-RateLimit-Limit": String(result.limit),
					"X-RateLimit-Remaining": "0"
				}
			}
		)
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Service temporarily unavailable", 503)
	}
}