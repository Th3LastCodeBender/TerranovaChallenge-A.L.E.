import "server-only"

import argon2 from "argon2"
import zxcvbn from "zxcvbn"
import crypto from "crypto"

export async function verifyPassword(password: string, hash: string): Promise<boolean>
{
	return argon2.verify(hash, password)
}

export async function hashPassword(password: string): Promise<string>
{
	return argon2.hash(password,
	{
		type: argon2.argon2id,
		memoryCost: 32768,
		timeCost: 3,
		parallelism: 4
	})
}

export async function isPasswordCompromised(password: string): Promise<boolean>
{
	const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase()
	const prefix = hash.slice(0, 5)
	const suffix = hash.slice(5)

	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), 3000)

	try
	{
		const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`,
		{
			headers:
			{
				"Add-Padding": "true",
				"User-Agent": "YourAppName"
			},
			cache: "no-store",
			signal: controller.signal
		})

		if (!response.ok)
		{
			console.error("HIBP API returned non-OK status:", response.status)
			return false
		}

		const data = await response.text()

		for (const line of data.split("\n"))
		{
			const [hashSuffix] = line.trim().split(":")
			if (hashSuffix === suffix)
				return true
		}

		return false
	}
	catch (error)
	{
		console.error("HIBP check failed:", error)
		return false
	}
	finally
	{
		clearTimeout(timeoutId)
	}
}

export function validatePassword(password: string)
{
	if (password.length < 12)
	{
		return {
			valid: false,
			message: "Password must be at least 12 characters long",
		}
	}

	if (password.length > 128)
	{
		return {
			valid: false,
			message: "Password is too long",
		}
	}

	const result = zxcvbn(password)

	if (result.score < 3)
	{
		return {
			valid: false,
			message: "Password is too weak",
		}
	}

	return { valid: true }
}