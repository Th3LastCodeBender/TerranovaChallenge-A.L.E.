import "server-only"

import { redis_pool } from "./redis-init"

export const RATE_LIMIT_POLICIES = {
	general: { limit: 100, windowSeconds: 60 },
	search: { limit: 20, windowSeconds: 60 }
}

interface RateLimitOptions {
	limit: number
	windowSeconds: number
}

export async function rateLimit(identifier: string, endpoint: string, options: RateLimitOptions)
{
	const { limit, windowSeconds } = options

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