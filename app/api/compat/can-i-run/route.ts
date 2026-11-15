import { jsonError, parseGameId } from "@/lib/utils"
import { NextResponse } from "next/server"
import { getPcSpecs } from "@/query/pcSpecs"
import { canIRun } from "@/lib/can-i-run/can-i-run"
import { withAuth } from "@/lib/auth/authWrapper"
import { getSteamAppId } from "@/lib/igdb-api/steam-app"
import type { Resolution } from "@/lib/can-i-run/fps-estimate"
import { RATE_LIMIT_POLICIES, checkRateLimit } from "@/lib/redis/rate-limit"

const RESOLUTIONS: Resolution[] = ["1080p", "1440p", "4k"]

function isResolution(value: string): value is Resolution
{
	return (RESOLUTIONS as string[]).includes(value)
}

export const GET = withAuth(async (request, { session }) => 
{
	try
	{
		const limited = await checkRateLimit(request, "/api/compat/can-i-run", RATE_LIMIT_POLICIES.can_i_run, `user:${session.userId}`)

		if (limited)
			return limited

		const params = request.nextUrl.searchParams
		const gameId = parseGameId(params.get("gameId"))

		if (gameId === null)
			return jsonError("Invalid gameId", 400)

		const resolution = params.get("resolution") ?? "1080p"

		if (!isResolution(resolution))
			return jsonError("Invalid resolution", 400)

		const specs = await getPcSpecs(session.userId)

		if (specs === null)
			return jsonError("No PC specs saved", 400)

		const steamAppId = await getSteamAppId(gameId)

		if (steamAppId === null)
			return jsonError("Game not available on Steam", 404)

		const result = await canIRun(steamAppId, specs, resolution)

		if (result.found === false)
			return jsonError("No system requirements found for this game", 404)

		return NextResponse.json({
			steamAppId,
			requirements: result.requirements,
			compat: result.compat,
			fps: result.fps,
		})
	}
	catch(error)
	{
		console.error(error)
		return jsonError("Internal server error", 500)
	}
})