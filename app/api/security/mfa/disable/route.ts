import { jsonError } from "@/lib/utils"
import { disableMfa } from "@/query/mfa"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

export const POST = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/security/mfa/disable", RATE_LIMIT_POLICIES.disable_2fa)

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

		await disableMfa(session.userId)
		return NextResponse.json({ success: true })
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})