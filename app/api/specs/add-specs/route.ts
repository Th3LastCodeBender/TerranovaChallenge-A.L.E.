import { jsonError } from "@/lib/utils"
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/authWrapper"
import { PcSpecs, setPcSpecs } from "@/query/pcSpecs"
import { getHardwareScore } from "@/lib/compat/hardware-scores"
import { RATE_LIMIT_POLICIES, rateLimit } from "@/lib/redis/rate-limit"

const MAX_NAME_LENGTH = 100

type ParseResult =	| {ok: true; specs: PcSpecs} | {ok: false; error: string}

function isName(value: unknown): value is string
{
	return typeof value === "string" && value.trim() !== "" && value.length <= MAX_NAME_LENGTH
}

function isGb(value: unknown, max: number): value is number
{
	return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= max
}

function parsePcSpecs(body: unknown): ParseResult
{
	if (typeof body !== "object" || body === null)
		return {ok: false, error: "Body must be a JSON object"}

	const bContent = body as Record<string, unknown>

	if (!isName(bContent.cpu))
		return {ok: false, error: "Invalid cpu"}
	if (!isName(bContent.gpu))
		return {ok: false, error: "Invalid gpu"}
	if (!isName(bContent.os))
		return {ok: false, error: "Invalid os"}
	if (!isGb(bContent.ramGb, 1024))
		return {ok: false, error: "Invalid ramGb"}
	if (bContent.vramGb !== undefined && !isGb(bContent.vramGb, 128))
		return {ok: false, error: "Invalid vramGb"}

	const specs: PcSpecs = {
		cpu: bContent.cpu.trim(),
		gpu: bContent.gpu.trim(),
		ramGb: bContent.ramGb,
		os: bContent.os.trim(),
	}
	if (bContent.vramGb !== undefined)
		specs.vramGb = bContent.vramGb

	return {ok: true, specs}
}

export const POST = withAuth(async (req, { session }) =>
{
	try
	{
		const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

		try
		{
			const rl_result = await rateLimit(ip, "/api/specs/add-specs", RATE_LIMIT_POLICIES.add_specs)

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
		catch (error)
		{
			console.error(error)
			return jsonError("Service temporarily unavailable", 503)
		}

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

		const parsed = parsePcSpecs(body)
		if (parsed.ok === false)
			return jsonError(parsed.error, 400)

		const saved = await setPcSpecs(session.userId, parsed.specs)

		return NextResponse.json({
			specs: saved.pcSpecs,
			recognized: {
				cpu: getHardwareScore("cpu", parsed.specs.cpu) !== null,
				gpu: getHardwareScore("gpu", parsed.specs.gpu) !== null,
			},
		})
	}
	catch (error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})
