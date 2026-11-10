import { jsonError } from "@/lib/utils"
import { NextRequest, NextResponse } from "next/server"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import { deleteSession, findValidSession, hashSessionToken, SESSION_COOKIE_NAME } from "@/query/sessions"


export async function POST(req: NextRequest)
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/auth/logout", RATE_LIMIT_POLICIES.logout)

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
		
		const token = req.cookies.get(SESSION_COOKIE_NAME)?.value

		if (token)
		{
			const hashedToken = hashSessionToken(token)
			const session = await findValidSession(hashedToken)
			const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

			if (session)
				await deleteSession(hashedToken)
		}

		const res = NextResponse.json({success: true}, {status: 200})

		res.cookies.delete(SESSION_COOKIE_NAME)

		return res
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
}
