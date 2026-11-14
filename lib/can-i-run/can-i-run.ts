import "server-only"

import { getCachedRequirements, setCachedRequirements } 	from "../redis/requirements-cache"
import { getSteamRequirements } 							from "../steam/requirements"
import { extractRequirements, type GameRequirements } 		from "../llm/extract-requirements"
import { checkCompatibility, type CompatResult } 			from "./check"
import { estimatePerf, type FpsEstimate, type Resolution }	from "./fps-estimate"
import type { PcSpecs } 									from "@/query/pcSpecs"

export type CanIRunResult =	
	| { found: false } 
	| { found: true, requirements: GameRequirements, compat: CompatResult, fps: FpsEstimate | null }

export async function getGameRequirements(steamAppId: number): Promise<GameRequirements | null>
{
	try
	{
		const cached = await getCachedRequirements(steamAppId)

		if (cached.cached)
			return cached.requirements
	}
	catch (error)
	{
		console.error("Requirements cache read failed:", error)
	}

	const text = await getSteamRequirements(steamAppId)
	const requirements = text ? await extractRequirements(text) : null

	try
	{
		await setCachedRequirements(steamAppId, requirements)
	}
	catch (error)
	{
		console.error("Requirements cache write failed:", error)
	}

	return requirements
}

export async function canIRun(steamAppId: number, specs: PcSpecs, resolution: Resolution = "1080p"): Promise<CanIRunResult>
{
	const requirements = await getGameRequirements(steamAppId)

	if (requirements === null)
		return {found: false }

	const compat = checkCompatibility(specs, requirements)

	return { found: true, requirements, compat, fps: estimatePerf(compat, resolution) }
}