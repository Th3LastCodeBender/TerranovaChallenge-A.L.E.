import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getOS, getBrowser, jsonError } from "@/lib/utils"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import { addFailedAttempt, consumeChallenge, findValidChallenge, hashCmp, hashOTP, MFA_COOKIE_NAME, MFA_MAX_ATTEMPTS } from "@/query/mfa"
import { createSession, generateSessionToken, hashSessionToken, SESSION_COOKIE_DURATION_SECONDS, setLoginCookie } from "@/query/sessions"
import { findUserById } from "@/query/users"

export async function POST(req: Request)
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/security/mfa", RATE_LIMIT_POLICIES.otp_attempt)

			if (!rl_result.success)
			{
				return NextResponse.json(
				{error: "Too many requests. Please try again later."},
				{
					status: 429,
					headers: {
						"Retry-After": String(rl_result.retryAfter),
						"X-RateLimit-Limit": String(rl_result.limit),
						"X-RateLimit-Remaining": "0"
					}
				}
				)
			}			
		}
		catch(error)
		{
			console.error(error)
			return jsonError("Service temporarily unavailable", 503)
		}

		const cookieStore = await cookies()
		const pending2FA = cookieStore.get(MFA_COOKIE_NAME)

		if (!pending2FA)
			return jsonError("Expired or absent 2fa cookie", 401)

		const challenge = await findValidChallenge(hashSessionToken(pending2FA.value), MFA_MAX_ATTEMPTS)

		if (!challenge)
			return jsonError("Expired or absent 2fa cookie", 401)	

		let body: unknown

		try
		{
			body = await req.json()
		}
		catch (error)
		{
			console.error(error)
			return jsonError("Invalid JSON body", 400)
		}

		if (!body || typeof body !== "object" || Array.isArray(body))
			return jsonError("Invalid request body", 400)

		const rawOtp = (body as Record<string, unknown>).otp
		if (typeof rawOtp !== "string" || !/^\d{6}$/.test(rawOtp.trim()))
			return jsonError("Invalid code", 400)

		const otp = rawOtp.trim()
		const hashedOtp = hashOTP(otp)

		if (!hashCmp(hashedOtp, challenge.codeHash))
		{
			if (!await addFailedAttempt(challenge.id, MFA_MAX_ATTEMPTS))
				return jsonError("Invalid or expired challenge", 401)
			return jsonError("Invalid code", 401)
		}
		else
		{
			if (!await consumeChallenge(challenge.id, challenge.userId, MFA_MAX_ATTEMPTS))
				return jsonError("Invalid or expired challenge", 401)
		}

		const user = await findUserById(challenge.userId)
		if (!user)
    		return jsonError("User not found", 404)

		const res = NextResponse.json(user)

		res.cookies.delete(MFA_COOKIE_NAME)

		try
		{
			const userAgent = req.headers.get("user-agent") ?? ""
			const client =
			{
				os: getOS(userAgent),
				browser: getBrowser(userAgent, req.headers.get("sec-ch-ua") || ""),
				platform: req.headers.get("sec-ch-ua-platform") || "",
				mobile: req.headers.get("sec-ch-ua-mobile") || ""
			}
			const token = generateSessionToken()

			await createSession(
				{
					userId: challenge.userId,
					tokenHash: hashSessionToken(token),
					ip,
					device: client,
					expiresAt: new Date(Date.now() + SESSION_COOKIE_DURATION_SECONDS * 1000)
				}
			)
			setLoginCookie(res, token)
		}
		catch (error)
		{
			console.error("ADD SESSION ERROR (login):", error)
			return jsonError("Unable to create session", 500)
		}

		return res
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
}