import { jsonError } from "@/lib/utils"
import { NextRequest, NextResponse } from "next/server"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"
import { deleteSession, hashSessionToken, SESSION_COOKIE_NAME } from "@/query/sessions"


export async function POST(req: NextRequest)
{
	try
	{
		const limited = await checkRateLimit(req, "/api/auth/logout", RATE_LIMIT_POLICIES.logout)

		if (limited)
			return limited
		
		const token = req.cookies.get(SESSION_COOKIE_NAME)?.value

		if (token)
			await deleteSession(hashSessionToken(token))

		const res = NextResponse.json({success: true})

		res.cookies.delete(SESSION_COOKIE_NAME)

		return res
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
}
