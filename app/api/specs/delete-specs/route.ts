import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { clearPcSpecs } from "@/query/pcSpecs"
import { withAuth } from "@/lib/auth/authWrapper"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/specs/delete-specs", RATE_LIMIT_POLICIES.delete_specs)

		if (limited)
			return limited

		await clearPcSpecs(session.userId)
		return NextResponse.json({success: true})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})