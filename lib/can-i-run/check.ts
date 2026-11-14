import "server-only"

import { getHardwareScore, type HardwareKind } from "./hardware-scores"
import type { PcSpecs } from "@/query/pcSpecs"
import type { GameRequirements, HardwareModel, RequirementTier } from "../llm/extract-requirements"

const SCORE_TOLERANCE = 0.9

export type CheckStatus = "pass" | "fail" | "unknown"

export type ComponentCheck = {
	status: CheckStatus
	have: number | null
	need: number | null
	estimated: boolean
}

export type compScore = {
	status: CheckStatus
	cpu: ComponentCheck
	gpu: ComponentCheck
	ramGb: ComponentCheck
	vramGb: ComponentCheck
}

export type Verdict = "recommended" | "minimum" | "cannot-run" | "unknown"

export type OsWarning = {
	have: string
	need: string
}

export type CompatResult = {
	verdict: Verdict
	minimum: compScore | null
	recommended: compScore | null
	osWarning: OsWarning | null
}

const WINDOWS_VERSIONS: Record<string, number> = {
	xp: 5.1,
	vista: 6,
	"7": 7,
	"8": 8,
	"8.1": 8.1,
	"10": 10,
	"11": 11,
}

function compareNumbers(have: number | null, need: number | null): ComponentCheck
{
	if (have === null || need === null)
		return { status: "unknown", have, need, estimated: false }

	return { status: have >= need ? "pass" : "fail", have, need, estimated: false }
}

function lowestKnown(kind: HardwareKind, models: HardwareModel[]): { score: number, estimated: boolean } | null
{
	let lowest: { score: number, estimated: boolean } | null = null

	for (const item of models)
	{
		const score = getHardwareScore(kind, item.model)

		if (score !== null && (lowest === null || score < lowest.score))
			lowest = { score, estimated: item.estimated }
	}

	return lowest
}

function compareHardware(kind: HardwareKind, userModel: string, requireModels: HardwareModel[]): ComponentCheck
{
	const have = getHardwareScore(kind, userModel)
	const lowest = lowestKnown(kind, requireModels)
	const need = lowest?.score ?? null
	const estimated = lowest?.estimated ?? false

	if (have === null || need === null)
		return { status: "unknown", have, need, estimated }

	return { status: have >= need * SCORE_TOLERANCE ? "pass" : "fail", have, need, estimated }
}

function checkTier(specs: PcSpecs, tier: RequirementTier | null): compScore | null
{
	if (tier === null)
		return null

	const cpu = compareHardware("cpu", specs.cpu, tier.cpuModels)
	const gpu = compareHardware("gpu", specs.gpu, tier.gpuModels)
	const ramGb = compareNumbers(specs.ramGb, tier.ramGb)
	const vramGb = compareNumbers(specs.vramGb ?? null, tier.vramGb)

	const all = [cpu, gpu, ramGb, vramGb]
	const essential = tier.ramGb === null ? [cpu, gpu] : [cpu, gpu, ramGb]

	let status: CheckStatus = "unknown"

	if (all.some((check) => check.status === "fail"))
		status = "fail"
	else if (essential.every((check) => check.status === "pass"))
		status = "pass"

	return { status, cpu, gpu, ramGb, vramGb }
}

function windowsVersion(os: string): number | null
{
	if (!/\bwin/i.test(os))
		return null

	const versions = [...os.toLowerCase().matchAll(/\b(xp|vista|8\.1|11|10|8|7)\b/g)]
		.map((match) => WINDOWS_VERSIONS[match[1]])

	return versions.length > 0 ? Math.min(...versions) : null
}

function checkOs(specs: PcSpecs, requirements: GameRequirements): OsWarning | null
{
	const need = requirements.minimum?.os ?? requirements.recommended?.os ?? null

	if (need === null)
		return null

	const needVersion = windowsVersion(need)

	if (needVersion === null)
		return null

	const haveVersion = windowsVersion(specs.os)

	if (haveVersion !== null && haveVersion >= needVersion)
		return null

	return { have: specs.os, need }
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

	return { verdict, minimum, recommended, osWarning: checkOs(specs, requirements) }
}
