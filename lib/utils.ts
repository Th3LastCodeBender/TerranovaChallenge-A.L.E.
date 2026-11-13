import "server-only"

import { NextResponse } from "next/server"
import { getTwitchAccessToken } from "./igdb-api/twitch-auth"

export type Browser =
	| "Chrome"
	| "Edge"
	| "Firefox"
	| "Safari"
	| "Opera"
	| "Brave"
	| "Vivaldi"
	| "Samsung Internet"
	| "Yandex"
	| "Electron"
	| "WebView"
	| "curl"
	| "Unknown"

export type DeviceOS =
	| "Android"
	| "iOS"
	| "Windows"
	| "MacOS"
	| "Linux"
	| "ChromeOS"
	| "Curl"
	| "Unknown"

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

export function getOS(userAgent: string): DeviceOS
{
	if (!userAgent)
		return "Unknown"

	const ua = userAgent.toLowerCase()

	if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod"))
	{
		return "iOS"
	}

	if (ua.includes("android"))
		return "Android"

	if (ua.includes("cros"))
	{
		return "ChromeOS"
	}

	if (ua.includes("windows"))
		return "Windows"

	if (ua.includes("macintosh") || ua.includes("mac os x"))
	{
		return "MacOS"
	}

	if (ua.includes("linux"))
		return "Linux"

	if (ua.includes("curl"))
		return "Curl"

	return "Unknown"
}

export function getBrowser(userAgent: string, secChUa: string): Browser
{
	const ua = userAgent.toLowerCase()
	const ch = secChUa.toLowerCase()

	if (ua.includes("curl/"))
		return "curl"

	if (ua.includes("edg/") || ch.includes('"microsoft edge"'))
		return "Edge"

	if (ua.includes("opr/") || ua.includes("opera") || ch.includes('"opera"'))
		return "Opera"

	if (ua.includes("brave") || ch.includes('"brave"'))
		return "Brave"

	if (ua.includes("vivaldi") || ch.includes('"vivaldi"'))
		return "Vivaldi"

	if (ua.includes("samsungbrowser/"))
		return "Samsung Internet"

	if (ua.includes("yabrowser/"))
		return "Yandex"

	if (ua.includes("electron/"))
		return "Electron"

	if (ua.includes("firefox/"))
		return "Firefox"

	if (
		ua.includes("safari/") &&
		!ua.includes("chrome/") &&
		!ua.includes("crios/") &&
		!ua.includes("android")
	)
		return "Safari"

	if (ua.includes("chrome/") || ua.includes("crios/") ||ch.includes('"google chrome"'))
		return "Chrome"

	if (ch.includes('"chromium"'))
		return "Chrome"

	return "Unknown"
}

export function isValidEmail(email: string)
{
	if (email.length > 254)
		return false
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isString(value: unknown): value is string
{
	return typeof value === "string" && value.trim().length > 0
}

export async function getGamesByIds(ids: number[])
{
	if (ids.length === 0)
		return []

	const token = await getTwitchAccessToken()

	const response = await fetch(
		"https://api.igdb.com/v4/games",
		{
			method: "POST",
			headers: {
				"Client-ID": requireEnv("TWITCH_CLIENT_ID"),
				Authorization: `Bearer ${token}`,
				"Content-Type": "text/plain"
			},
			body: `
				where id = (${ids.join(",")});
				fields
					id,
					name,
					slug,
					summary,
					first_release_date,
					rating,
					rating_count,
					aggregated_rating,
					aggregated_rating_count,
					cover.image_id,
					genres.id,
					genres.name,
					platforms.id,
					platforms.name;
				limit 50;
			`
		}
	)

	if (!response.ok)
		return response

	return response.json()
}