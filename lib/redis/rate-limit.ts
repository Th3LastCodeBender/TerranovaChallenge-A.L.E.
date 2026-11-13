import "server-only"

import { redis_pool } from "./redis-init"

export const RATE_LIMIT_POLICIES =
{
	general: {limit: 100, windowSeconds: 60},
	search: {limit: 20, windowSeconds: 60},
	login: {limit: 10, windowSeconds: 60 * 15},
	signup: {limit: 5, windowSeconds: 60 * 60},
	logout: {limit: 20, windowSeconds: 60},
	otp_attempt: {limit: 5, windowSeconds: 60 * 15},
	add_item: {limit: 20, windowSeconds: 60},
	delete_item: {limit: 30, windowSeconds: 60},
	get_items: {limit: 10, windowSeconds: 60},
	get_slug: {limit: 30, windowSeconds: 60},
	enable_2fa: {limit: 5, windowSeconds: 60 * 10},
	disable_2fa: {limit: 5, windowSeconds: 60 * 5},
	games: { limit: 25, windowSeconds: 60},
	get_collections_count: {limit: 10, windowSeconds: 60},
	add_specs: {limit: 5, windowSeconds: 60},
	delete_specs: {limit: 5, windowSeconds: 60},
	get_specs: {limit: 10, windowSeconds: 60}
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