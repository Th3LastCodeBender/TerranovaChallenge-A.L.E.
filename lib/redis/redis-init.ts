import "server-only"

import Redis from "ioredis"
import { requireEnv } from "../utils"

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis_pool =
	globalForRedis.redis ??
	new Redis({
		host: requireEnv("REDIS_HOST"),
		port: Number(requireEnv("REDIS_PORT")),
		password: requireEnv("REDIS_PASSWORD"),
		maxRetriesPerRequest: 2
	})

if (process.env.NODE_ENV !== "production")
	globalForRedis.redis = redis_pool