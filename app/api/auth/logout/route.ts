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
			const rl_result = await rateLimit(ip, "/api/games/[title]", RATE_LIMIT_POLICIES.logout)

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
		}
		
		const token = req.cookies.get(SESSION_COOKIE_NAME)?.value

		if (token)
		{
			const session = await findValidSession(hashSessionToken(token))
			const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

			if (session)
				await deleteSession(token)
		}

		const res = NextResponse.json({success: true}, {status: 200})

		res.cookies.delete(SESSION_COOKIE_NAME)

		return res
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Intenal server error", 500)
	}
}