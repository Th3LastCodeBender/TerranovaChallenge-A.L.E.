import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"	
import { getPcSpecs } from "@/query/pcSpecs"
import { withAuth } from "@/lib/auth/authWrapper"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/specs/get-specs", RATE_LIMIT_POLICIES.get_specs)

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
		catch (error)
		{
			console.error(error)
			return jsonError("Service temporarily unavailable", 503)
		}

		const specs = await getPcSpecs(session.userId)

		return NextResponse.json({specs: specs})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})