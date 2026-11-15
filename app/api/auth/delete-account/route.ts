import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { SESSION_COOKIE_NAME } from "@/query/sessions"
import { verifyPassword } from "@/lib/security/password"
import { deleteUser, findPasswordHashById } from "@/query/users"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

// Body: { password }. La password serve anche da loggati:
// con il solo cookie di sessione (es. rubato) l'account non si può cancellare.
export const DELETE = withAuth(async (req, { session }) =>
{
	try
	{
		try
		{
			// Per utente e non per IP: limita i tentativi di indovinare la password
			const rl_result = await rateLimit(`user:${session.userId}`, "/api/auth/delete-account", RATE_LIMIT_POLICIES.delete_account)

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
		catch(error)
		{
			console.error(error)
			return jsonError("Service temporarily unavailable", 503)
		}

		let body: unknown

		try
		{
			body = await req.json()
		}
		catch
		{
			return jsonError("Invalid JSON body", 400)
		}

		const password = typeof body === "object" && body !== null
			? (body as Record<string, unknown>).password
			: undefined

		if (typeof password !== "string" || password.length === 0 || password.length > 128)
			return jsonError("Invalid password", 400)

		const user = await findPasswordHashById(session.userId)

		if (!user)
			return jsonError("Unauthorized", 401)

		// 403 e non 401: l'utente è autenticato, è la password di conferma a essere sbagliata
		if (!await verifyPassword(password, user.passwordHash))
			return jsonError("Wrong password", 403)

		// Sessioni, preferiti, collezione, 2FA e challenge vanno via con onDelete: Cascade
		await deleteUser(session.userId)

		const res = NextResponse.json({success: true})

		res.cookies.delete(SESSION_COOKIE_NAME)

		return res
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})
