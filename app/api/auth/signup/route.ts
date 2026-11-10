import { NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail } from "@/query/users"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"
import { getOS, getBrowser, isString, isValidEmail, jsonError  } from "@/lib/utils"
import { validatePassword, isPasswordCompromised, hashPassword } from "@/lib/security/password"
import { createSession, findValidSession, generateSessionToken, hashSessionToken, SESSION_COOKIE_DURATION_SECONDS, SESSION_COOKIE_NAME, setLoginCookie } from "@/query/sessions"

interface SignupData {
	name: string
	surname: string
	email: string
	username: string
	password: string
}

function isUniqueConstraintViolation(err: unknown): boolean
{
	return typeof err === "object" && err !== null && "code" in err && (err as {code: string}).code === "23505"
}

function validateSignupBody(body: unknown): | {valid: true; data: SignupData} | {valid: false; message: string}
{
	if (typeof body !== "object" || body === null || Array.isArray(body))
		return {valid: false, message: "Invalid request body"}

	const {
		name: rawName,
		surname: rawSurname,
		email: rawEmail,
		username: rawUsername,
		password
	} = body as Record<string, unknown>

	if (
		!isString(rawName) ||
		!isString(rawSurname) ||
		!isString(rawEmail) ||
		!isString(rawUsername) ||
		!isString(password)
	)
	{
		return {valid: false, message: "Missing required fields"}
	}

	const name = rawName.trim()
	const surname = rawSurname.trim()
	const email = rawEmail.trim().toLowerCase()
	const username = rawUsername.trim()

	if (!name || name.length > 100 || !surname || surname.length > 100)
		return {valid: false, message: "Invalid name or surname"}

	if (username.length < 5 || username.length > 100)
		return {valid: false, message: "Invalid username"}

	if (!isValidEmail(email))
		return {valid: false, message: "Invalid email"}

	return {
		valid: true,
		data: {name, surname, email, username, password}
	}
}

export async function signup(body: unknown)
{
	const validation = validateSignupBody(body)

	if (!validation.valid)
		return {success: false as const, message: validation.message, status: 400}

	const {name, surname, email, username, password} = validation.data

	if (await findUserByEmail(email))
		return {success: false as const, message: "Unable to create account with these details", status: 409}

	const passwordValidation = validatePassword(password)

	if (!passwordValidation.valid)
		return {success: false as const, message: passwordValidation.message ?? "", status: 400}

	if (await isPasswordCompromised(password))
		return {
			success: false as const,
			message: "This password has been compromised in a data breach. Please choose another password",
			status: 400
		}

	try
	{
		const user = await createUser({
			email,
			username,
			firstName: name,
			lastName: surname,
			passwordHash: await hashPassword(password)
		})

		return {success: true as const, user}
	}
	catch (error)
	{
		if (isUniqueConstraintViolation(error))
			return {
				success: false as const,
				message: "Unable to create account with these details",
				status: 409
			}

		throw error
	}
}

export async function POST(req: NextRequest)
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/auth/signup", RATE_LIMIT_POLICIES.signup)

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

		const signup_result = await signup(body)

		if (!signup_result.success)
			return jsonError(signup_result.message, signup_result.status)

		const res = NextResponse.json({user: signup_result.user})

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
					userId: signup_result.user.id,
					tokenHash: hashSessionToken(token),
					ip,
					device: client,
					expiresAt: new Date(Date.now() + SESSION_COOKIE_DURATION_SECONDS * 1000)
				}
			)
		}
		catch (error)
		{
			console.error("ADD SESSION ERROR (signup):", error)
		}

		return res
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Server Error", 500)
	}
}
