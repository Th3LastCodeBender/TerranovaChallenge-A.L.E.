import { findUserByEmail } from "@/query/users"
import { NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/security/password"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import { getOS, getBrowser, isValidEmail, jsonError} from "@/lib/utils"
import { createSession, generateSessionToken, hashSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_DURATION_SECONDS, findValidSession, setLoginCookie } from "@/query/sessions"

const DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$ZHVtbXlzYWx0MTIzNDU2Nzg$Qm9ndXNIYXNoRm9yVGVzdGluZw"

interface LoginData
{
	email: string
	password: string
}

function validateLoginBody(body: unknown): | {valid: true; data: LoginData} | {valid: false; message: string}
{
	if (typeof body !== "object" || body === null || Array.isArray(body))
		return {valid: false, message: "Invalid credentials"}

	const {email, password} = body as Record<string, unknown>

	if (typeof email !== "string" || typeof password !== "string")
		return {valid: false, message: "Invalid credentials"}

	const normalizedEmail = email.trim().toLowerCase()

	if (!normalizedEmail || !isValidEmail(normalizedEmail))
		return {valid: false, message: "Invalid credentials"}

	return {
		valid: true,
		data: {
			email: normalizedEmail,
			password
		}
	}
}

async function login(body: unknown)
{
	const validation = validateLoginBody(body)

	if (!validation.valid)
		return {
			success: false as const,
			message: validation.message,
			status: 401
		}

	const {email, password} = validation.data
	const user = await findUserByEmail(email)
	const hashToCheck = user?.passwordHash ?? DUMMY_HASH
	const passwordValid = await verifyPassword(password, hashToCheck)

	if (!user || !passwordValid)
		return {
			success: false as const,
			message: "Invalid credentials",
			status: 401
		}

	return {
		success: true as const,
		user
	}
}

export async function POST(req: NextRequest)
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/games/[title]", RATE_LIMIT_POLICIES.login)

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
		}

		const token = req.cookies.get(SESSION_COOKIE_NAME)?.value

		if (token && await findValidSession(hashSessionToken(token)))
				return jsonError("Already logged in", 409)

		let body: unknown

		try
		{
			body = await req.json()
		}
		catch (error)
		{
			console.error(error)
			return jsonError("Invalid JSON body", 400)
		}

		const login_result = await login(body)

		if (!login_result.success)
			return jsonError(login_result.message, login_result.status)

		const res = NextResponse.json({success: true})

		const client =
		{
			os: getOS(req.headers.get("user-agent") || ""),
			browser: getBrowser(req.headers.get("user-agent") || "", req.headers.get("sec-ch-ua") || ""),
			platform: req.headers.get("sec-ch-ua-platform") || "",
			mobile: req.headers.get("sec-ch-ua-mobile") || ""
		}

		try
		{
			const token = generateSessionToken()
			setLoginCookie(res, token)
			await createSession(
				{
					userId: login_result.user.id,
					tokenHash: hashSessionToken(token),
					ip,
					device: client,
					expiresAt: new Date(Date.now() + SESSION_COOKIE_DURATION_SECONDS * 1000)
				}
			)
		}
		catch (error)
		{
			console.error("ADD SESSION ERROR (login):", error)
		}

		return res
	}
	catch (error) {
		console.error(error)
		return jsonError("Server Error", 500)
	}
}