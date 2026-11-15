import { jsonError } from "@/lib/utils"
import { enableMfa } from "@/query/mfa"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const POST = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/security/mfa/enable", RATE_LIMIT_POLICIES.enable_2fa)

		if (limited)
			return limited

		await enableMfa(session.userId)
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})