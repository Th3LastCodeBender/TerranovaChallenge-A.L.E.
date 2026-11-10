import "server-only"

import { getHardwareScore, type HardwareKind } from "./hardware-scores"
import type { PcSpecs } from "@/query/pcSpecs"
import type { GameRequirements, RequirementTier } from "../llm/extract-requirements"

const SCORE_TOLERANCE = 0.9

export type CheckStatus = "pass" | "fail" | "unknown"

export type ComponentCheck = {
	status: CheckStatus
	have: number | null
	need: number | null
}

export type TierCheck = {
	status: CheckStatus
	cpu: ComponentCheck
	gpu: ComponentCheck
	ramGb: ComponentCheck
	vramGb: ComponentCheck
}

export type Verdict = "recommended" | "minimum" | "cannot-run" | "unknown"

export type CompatResult = {
	verdict: Verdict
	minimum: TierCheck | null
	recommended: TierCheck | null
}

function compareNumbers(have: number | null, need: number | null): ComponentCheck
{
	if (have === null || need === null)
		return { status: "unknown", have, need }

	return { status: have >= need ? "pass" : "fail", have, need }
}

function lowestKnownScore(kind: HardwareKind, models: string[]): number | null
{
	const scores = models
					.map((model) => getHardwareScore(kind, model))
					.filter((score): score is number => score !== null)
	
	return scores.length > 0 ? Math.min(...scores): null
}

function compareHardware(kind: HardwareKind, userModel: string, requireModels: string[]): ComponentCheck
{
	const have = getHardwareScore(kind, userModel)
	const need = lowestKnownScore(kind, requireModels)

	if (have === null || need === null)
		return { status: "unknown", have, need }

	return { status: have >= need * SCORE_TOLERANCE ? "pass" : "fail", have, need }
}

function checkTier(specs: PcSpecs, tier: RequirementTier | null): TierCheck | null
{
	if (tier === null)
		return null

	const cpu = compareHardware("cpu", specs.cpu, tier.cpuModels)
	const gpu = compareHardware("gpu", specs.gpu, tier.gpuModels)
	const ramGb = compareNumbers(specs.ramGb, tier.ramGb)
	const vramGb = compareNumbers(specs.vramGb ?? null, tier.vramGb)

	const all = [cpu, gpu, ramGb, vramGb]
	const essential = [cpu, gpu, ramGb]

	let status: CheckStatus = "unknown"

	if (all.some((check) => check.status === "fail"))
		status = "fail"
	else if (essential.every((check) => check.status === "pass"))
		status = "pass"

	return { status, cpu, gpu, ramGb, vramGb }
}

export function checkCompatibility(specs: PcSpecs, requirements: GameRequirements): CompatResult
{
	const minimum = checkTier(specs, requirements.minimum)
	const recommended = checkTier(specs, requirements.recommended)

	let verdict: Verdict = "unknown"

	if (recommended?.status === "pass")
		verdict = "recommended"
	else if (minimum?.status === "pass")
		verdict = "minimum"
	else if (minimum?.status === "fail")
		verdict = "cannot-run"

	return { verdict, minimum, recommended }
}