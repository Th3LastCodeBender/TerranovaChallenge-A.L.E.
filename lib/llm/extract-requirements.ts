import "server-only"

import { ollamaJson } from "./ollama"
import type { SteamRequirementsText } from "../steam/requirements"

export type RequirementTier = {
	os: string | null
	cpuModels: string[]
	cpuGhz: number | null
	cpuCores: number | null
	gpuModels: string[]
	vramGb: number | null
	ramGb: number | null
	directx: number | null
}

export type GameRequirements = {
	minimum: RequirementTier | null
	recommended: RequirementTier | null
}

const NULLABLE_STRING = { type: ["string", "null"] }
const NULLABLE_NUMBER = { type: ["number", "null"] }
const STRING_LIST = { type: "array", items: { type: "string" } }

const TIER_SCHEMA = {
	type: ["object", "null"],
	additionalProperties: false,
	required: ["os", "cpuModels", "cpuGhz", "cpuCores", "gpuModels", "vramGb", "ramGb", "directx"],
	properties: {
		os: NULLABLE_STRING,
		cpuModels: STRING_LIST,
		cpuGhz: NULLABLE_NUMBER,
		cpuCores: { type: ["integer", "null"] },
		gpuModels: STRING_LIST,
		vramGb: NULLABLE_NUMBER,
		ramGb: NULLABLE_NUMBER,
		directx: NULLABLE_NUMBER,
	},
}

const REQUIREMENTS_SCHEMA = {
	type: "object",
	additionalProperties: false,
	required: ["minimum", "recommended"],
	properties: {
		minimum: TIER_SCHEMA,
		recommended: TIER_SCHEMA,
	},
}

function buildPrompt(reqs: SteamRequirementsText): string
{
	return [
		"Extract the PC system requirements below into JSON.",
		"Rules:",
		"- Use null when a value is not stated. Never guess.",
		"- cpuModels / gpuModels: ONLY specific product model names, each alternative as a separate item (split on \"or\", \"/\", \",\"). Remove memory sizes from names (\"GTX 1060 6GB\" -> \"GTX 1060\").",
		"  Generic descriptions are NOT models and must not appear in these lists: \"2 Ghz\", \"Dual Core 2.4 GHz\", \"P4\", \"1GB VRAM\", \"256 mb video memory\", \"shader model 3.0\". Put their numbers in cpuGhz / cpuCores / vramGb instead. An empty list is correct when no model is named.",
		"- cpuGhz: clock speed in GHz if stated anywhere in the processor text (\"2 Ghz\" -> 2).",
		"- Convert all sizes to GB (256 MB = 0.25). vramGb is the video memory; take it from the GPU text if stated (e.g. \"GTX 1060 6GB\" -> 6, use the lowest if several).",
		"- cpuCores: number of cores if stated (\"Dual Core\" = 2, \"Quad Core\" = 4).",
		"- directx: major version number only (9.0c -> 9).",
		"- If a section is missing or empty, set it to null.",
		"",
		"MINIMUM:",
		reqs.minimum ?? "(empty)",
		"",
		"RECOMMENDED:",
		reqs.recommended ?? "(empty)",
	].join("\n")
}

function isRecord(value: unknown): value is Record<string, unknown>
{
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function cleanString(value: unknown): string | null
{
	if (typeof value !== "string")
		return null

	const trimmed = value.trim()

	return trimmed.length > 0 ? trimmed : null
}

function cleanStringList(value: unknown): string[]
{
	if (!Array.isArray(value))
		return []

	return value
		.map(cleanString)
		.filter((item): item is string => item !== null)
}

function positiveUpTo(value: unknown, max: number): number | null
{
	if (typeof value !== "number" || !Number.isFinite(value))
		return null

	return value > 0 && value <= max ? value : null
}

function sanitizeTier(value: unknown): RequirementTier | null
{
	if (!isRecord(value))
		return null

	const cores = positiveUpTo(value.cpuCores, 256)

	return {
		os: cleanString(value.os),
		cpuModels: cleanStringList(value.cpuModels),
		cpuGhz: positiveUpTo(value.cpuGhz, 10),
		cpuCores: cores !== null && Number.isInteger(cores) ? cores : null,
		gpuModels: cleanStringList(value.gpuModels),
		vramGb: positiveUpTo(value.vramGb, 128),
		ramGb: positiveUpTo(value.ramGb, 1024),
		directx: positiveUpTo(value.directx, 13),
	}
}

export async function extractRequirements(reqs: SteamRequirementsText): Promise<GameRequirements>
{
	const raw = await ollamaJson(buildPrompt(reqs), REQUIREMENTS_SCHEMA)

	if (!isRecord(raw))
		throw new Error("LLM returned a non-object for game requirements")

	return {
		minimum: reqs.minimum ? sanitizeTier(raw.minimum) : null,
		recommended: reqs.recommended ? sanitizeTier(raw.recommended) : null,
	}
}