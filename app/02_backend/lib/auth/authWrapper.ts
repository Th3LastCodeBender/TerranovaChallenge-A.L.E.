import "server-only"

import { NextRequest, NextResponse } from "next/server"
import { findValidSession, hashSessionToken, SESSION_COOKIE_NAME } from "@/query/sessions";

type AuthedHandler = (req: NextRequest, ctx: {session: {userId: number}}) => Promise<NextResponse>
type AuthResult =
	| {ok: true; session: {userId: number}}
	| {ok: false, response: NextResponse}

export async function checkAuth(req: NextRequest): Promise<AuthResult>
{
	const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
	const response = NextResponse.json({error: "Unauthorized"}, {status: 401})

	if (!token)
	{
		return {
			ok: false,
			response: response
		}
	}

	const session = await findValidSession(hashSessionToken(token))

	if (!session)
	{
		return {
			ok: false,
			response: response
		}
	}

	return { ok: true, session }
}

export function withAuth(handler: AuthedHandler)
{
	return async (req: NextRequest) =>
	{
		const auth = await checkAuth(req)
		if (auth.ok === false)
			return auth.response

		try
		{
			return await handler(req, { session: auth.session })
		}
		catch (error)
		{
			console.error(error)
			return NextResponse.json({error: "Internal server error"}, {status: 500})
		}
	}
}