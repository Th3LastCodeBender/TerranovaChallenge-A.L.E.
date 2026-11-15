import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { findMfaByUserId } from "@/query/mfa"
import { findUserById } from "@/query/users"
import { withAuth } from "@/lib/auth/authWrapper"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

export const GET = withAuth(async (req, { session }) =>
{
	try
	{
		const limited = await checkRateLimit(req, "/api/auth/me", RATE_LIMIT_POLICIES.general, `user:${session.userId}`)

		if (limited)
			return limited

		const [user, mfa] = await Promise.all([
			findUserById(session.userId),
			findMfaByUserId(session.userId)
		])

		if (!user)
			return jsonError("Unauthorized", 401)

		return NextResponse.json({...user, mfa: mfa !== null})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})
