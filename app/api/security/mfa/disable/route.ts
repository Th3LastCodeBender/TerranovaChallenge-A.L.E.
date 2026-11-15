import { jsonError } from "@/lib/utils"
import { disableMfa } from "@/query/mfa"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/security/mfa/disable", RATE_LIMIT_POLICIES.disable_2fa)

		if (limited)
			return limited

		await disableMfa(session.userId)
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})