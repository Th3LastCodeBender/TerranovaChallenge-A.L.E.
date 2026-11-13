import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { clearPcSpecs } from "@/query/pcSpecs"
import { withAuth } from "@/lib/auth/authWrapper"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/specs/delete-specs", RATE_LIMIT_POLICIES.delete_specs)

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

		await clearPcSpecs(session.userId)
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})