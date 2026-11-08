import { jsonError } from "@/lib/utils"
import { NextRequest, NextResponse } from "next/server"
import { deleteSession, findValidSession, hashSessionToken, SESSION_COOKIE_NAME } from "@/query/sessions"


export async function POST(req: NextRequest)
{
	try
	{
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