import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"	
import { getPcSpecs } from "@/query/pcSpecs"
import { withAuth } from "@/lib/auth/authWrapper"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/specs/get-specs", RATE_LIMIT_POLICIES.get_specs)

		if (limited)
			return limited

		const specs = await getPcSpecs(session.userId)

		return NextResponse.json({specs: specs})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})