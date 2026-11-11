import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getOS, getBrowser, jsonError } from "@/lib/utils"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import { createSession, generateSessionToken, hashSessionToken, SESSION_COOKIE_DURATION_SECONDS, setLoginCookie } from "@/query/sessions"

export async function POST(req: Request)
{
	try
	{
		const cookieStore = await cookies()
		const pending2FA = cookieStore.get(MFA_COOKIE_NAME)

		if (!pending2FA)
			return NextResponse.json({error: "Expired"}, {status: 401})		

		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/auth/login", RATE_LIMIT_POLICIES.otp_attempt)

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

		const rawOtp = (body as Record<string, unknown>).otp
		const otp = typeof rawOtp === "string" ? rawOtp.trim() : ""

		/* 
		VERIFICA OTP CHALLENGE PLACEHOLDER DA MODIFICARE
		const verification = await verifyOtpChallenge(pending2FA.value, otp)

		if (verification.valid === false)
		{
			const status = verification.reason === "too_many_attempts" ? 429 : 401

			return jsonError("Invalid verification code", status) 
		}
		*/

		const res = NextResponse.json({success: true})

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
					userId: 0, //ID DI PLACEHOLDER DA MODIFICARE
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