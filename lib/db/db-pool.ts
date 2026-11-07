import "server-only"

import { PrismaPg }						from "@prisma/adapter-pg"
import { PrismaClient } 				from "@/lib/generated/prisma/client"
import { requireEnv, optionalEnvInt }	from "@/lib/utils"
import { Pool }							from "pg"


type GlobalWithDb = typeof globalThis &
{
	dbPool?: Pool
}

const globalForDb = globalThis as GlobalWithDb
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient }

export const pool =
	globalForDb.dbPool ??
	new Pool({
		user: requireEnv("DB_USER"),
		host: requireEnv("DB_HOST"),
		database: requireEnv("DB_NAME"),
		password: requireEnv("DB_PASSWORD"),
		port: Number(requireEnv("DB_PORT")),
		max: optionalEnvInt("DB_MAX_CONNECTIONS", 10),
		connectionTimeoutMillis: optionalEnvInt("DB_CONN_TIMEOUT", 5_000),
		idleTimeoutMillis: optionalEnvInt("DB_IDLE_TIMEOUT", 30_000),
		query_timeout: optionalEnvInt("DB_QUERY_TIMEOUT", 15_000),
		statement_timeout: optionalEnvInt("DB_STATEMENT_TIMEOUT", 15_000) 
	})

pool.on("error", (err: Error) =>
{
	console.error("Unexpected error on idle PostgreSQL client", err)
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) })

if (requireEnv("NODE_ENV") !== "production")
{
	globalForDb.dbPool = pool
	globalForPrisma.prisma = prisma
}