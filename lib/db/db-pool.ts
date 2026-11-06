import "server-only"

import { Pool } from "pg"
import { requireEnv, optionalEnvInt } from "@/lib/utils"

const globalForDb = globalThis as GlobalWithDb

type GlobalWithDb = typeof globalThis &
{
	dbPool?: Pool
}

export const pool =
	globalForDb.dbPool ??
	new Pool({
		user: requireEnv("DB_USER"),
		host: requireEnv("DB_HOST"),
		database: requireEnv("DB_NAME"),
		password: requireEnv("DB_PASSWORD"),
		port: Number(requireEnv("DB_PORT")),
		max: optionalEnvInt("DB_MAX_CONNECTIONS", 10),
		connectionTimeout: optionalEnvInt("DB_CONN_TIMEOUT", 5_000),
		idleTimeout: optionalEnvInt("DB_IDLE_TIMEOUT", 30_000),
		query_timeout: optionalEnvInt("DB_QUERY_TIMEOUT", 15_000),
		statement_timeout: optionalEnvInt("DB_STATEMENT_TIMEOUT", 15_000) 
	})

pool.on("error", (err: Error) =>
{
	console.error("Unexpected error on idle PostgreSQL client", err)
})

if (requireEnv("NODE_ENV") !== "production")
	globalForDb.dbPool = pool