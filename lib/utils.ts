import { NextResponse } from "next/server"

export function requireEnv(name: string): string
{
	const value = process.env[name]

	if (!value)
		throw new Error(`Missing required environment variable: ${name}`)

	return value
}
 
export function optionalEnvInt(name: string, fallback: number): number
{
	const raw = process.env[name]

	if (!raw)
		return fallback

	const parsed = Number.parseInt(raw, 10)

	if (Number.isNaN(parsed) || parsed <= 0)
		throw new Error(`Invalid value for ${name}: expected a positive integer, got "${raw}"`)

	return parsed
}

export function jsonError(message: string, status: number)
{
	return NextResponse.json({ error: message }, { status })
}
