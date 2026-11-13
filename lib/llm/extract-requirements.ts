import "server-only"

import { ollamaJson } from "./ollama"
import { getHardwareScore, normalizeHardwareName, type HardwareKind } from "../compat/hardware-scores"
import type { SteamRequirementsText } from "../steam/requirements"

export type HardwareModel = {
	original: string
	model: string
	estimated: boolean
}

export type RequirementTier = {
	os: string | null
	cpuModels: HardwareModel[]
	cpuGhz: number | null
	cpuCores: number | null
	gpuModels: HardwareModel[]
	vramGb: number | null
	ramGb: number | null
	directx: number | null
}

export type GameRequirements = {
	minimum: RequirementTier | null
	recommended: RequirementTier | null
}

const GENERIC_MODELS: Record<HardwareKind, Record<string, string>> = {
	cpu: {
		"Pentium, Single Core, or only a clock speed": "Pentium 4",
		"Dual Core or Core 2 Duo below 2.4 GHz": "Core 2 Duo E4400",
		"Dual Core or Core 2 Duo at 2.4 GHz or more, or with no clock speed": "Core 2 Duo E6600",
		"Quad Core below 3.0 GHz, or with no clock speed": "Core 2 Quad Q6600",
		"Quad Core at 3.0 GHz or more": "Core i5-2400",
		"Intel Core i3": "Core i3-4130",
		"Intel Core i5": "Core i5-4590",
		"Intel Core i7": "Core i7-4770",
	},
	gpu: {
		"Intel HD Graphics with no model number, or integrated graphics": "Intel HD Graphics 4000",
		"64 MB or less": "GeForce FX 5200",
		"128 MB": "GeForce 6600",
		"256 MB": "GeForce 7600 GT",
		"512 MB": "GeForce 9600 GT",
		"1 GB": "GeForce GT 640",
		"2 GB": "GeForce GTX 750 Ti",
	},
}

const GENERIC_KEYS: Record<HardwareKind, Set<string>> = {
	cpu: new Set(Object.values(GENERIC_MODELS.cpu).map(normalizeHardwareName)),
	gpu: new Set(Object.values(GENERIC_MODELS.gpu).map(normalizeHardwareName)),
}

const NULLABLE_STRING = { type: ["string", "null"] }
const NULLABLE_NUMBER = { type: ["number", "null"] }

const HARDWARE_LIST = {
	type: "array",
	items: {
		type: "object",
		additionalProperties: false,
		required: ["original", "model"],
		properties: {
			original: { type: "string" },
			model: { type: "string" },
		},
	},
}

const TIER_SCHEMA = {
	type: ["object", "null"],
	additionalProperties: false,
	required: ["os", "cpuModels", "cpuGhz", "cpuCores", "gpuModels", "vramGb", "ramGb", "directx"],
	properties: {
		os: NULLABLE_STRING,
		cpuModels: HARDWARE_LIST,
		cpuGhz: NULLABLE_NUMBER,
		cpuCores: { type: ["integer", "null"] },
		gpuModels: HARDWARE_LIST,
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

function genericRules(kind: HardwareKind): string
{
	return Object.entries(GENERIC_MODELS[kind])
		.map(([description, model]) => `"${description}" -> "${model}"`)
		.join(", ")
}

function buildPrompt(reqs: SteamRequirementsText): string
{
	return [
		"Extract the PC system requirements below into JSON.",
		"Rules:",
		"- Use null when a value is not stated. Never guess.",
		"- cpuModels / gpuModels: one item per alternative (split on \"or\", \"/\", \",\").",
		"  original = the text exactly as written. model = the precise product name, with typos fixed and memory sizes removed (\"GFORCE GTX 1660 6GB\" -> \"GeForce GTX 1660\", \"i3550\" -> \"Core i3-550\").",
		"- If the text names only a family or a description, not a precise model, use as model the matching one from this list. Never use it to replace a precise model that is written (\"i3-2100\" stays \"Core i3-2100\"):",
		`  CPU: ${genericRules("cpu")}.`,
		`  GPU (when only the video memory is given, use the closest size not above it, e.g. 768 MB -> 512 MB; if it is more than 2 GB, leave it out): ${genericRules("gpu")}.`,
		"  If nothing in the list matches (\"DirectX 11 card\", \"shader model 3.0\", \"4 GB video card\"), leave it out.",
		"- Integrated graphics (\"Intel HD Graphics 630\", \"Radeon Vega 8\") are GPUs: put them in gpuModels, never in cpuModels.",
		"- cpuGhz: clock speed in GHz if stated anywhere in the processor text (\"2 Ghz\" -> 2).",
		"- cpuCores: number of cores if stated (\"Dual Core\" = 2, \"Quad Core\" = 4).",
		"- Convert all sizes to GB (256 MB = 0.25).",
		"- vramGb: only if the video memory is written in the text (\"GTX 1060 6GB\" -> 6, use the lowest if several). Never deduce it from a GPU model name.",
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

function hasSameNumbers(original: string, model: string): boolean
{
	const numbers = model.match(/\d+/g) ?? []

	return numbers.every((number) => original.includes(number))
}

function hasModelNumber(original: string): boolean
{
	const withoutSizes = original.replace(/\d+(\.\d+)?\s*(mhz|ghz|mb|gb)\b/gi, "")

	return /\d{3,}/.test(withoutSizes)
}

function modelFromOriginal(kind: HardwareKind, original: string): string | null
{
	const head = original.split(/\s+(?:or|-)\s+|,|\(/i)[0].trim()

	return hasModelNumber(head) && getHardwareScore(kind, head) !== null ? head : null
}

function coreCountModel(cores: number | null, ghz: number | null): string | null
{
	if (cores === 2)
		return ghz !== null && ghz < 2.4 ? "Core 2 Duo E4400" : "Core 2 Duo E6600"

	if (cores === 4)
		return ghz !== null && ghz >= 3 ? "Core i5-2400" : "Core 2 Quad Q6600"

	return null
}

const CORE_COUNT_KEYS = new Set(
	["Core 2 Duo E4400", "Core 2 Duo E6600", "Core 2 Quad Q6600", "Core i5-2400"].map(normalizeHardwareName)
)

function fixCoreCountModels(items: HardwareModel[], cores: number | null, ghz: number | null): HardwareModel[]
{
	const model = coreCountModel(cores, ghz)

	if (model === null)
		return items

	return items.map((item) =>
		item.estimated && CORE_COUNT_KEYS.has(normalizeHardwareName(item.model)) ? { ...item, model } : item
	)
}

const GENERIC_VRAM_MB: [number, string][] = [
	[64, "64 MB or less"], [128, "128 MB"], [256, "256 MB"], [512, "512 MB"], [1024, "1 GB"], [2048, "2 GB"],
]

function genericFromOriginal(kind: HardwareKind, original: string): string | null
{
	const text = original.toLowerCase()
	
	if (kind === "cpu")
	{
		const tier = text.match(/\bi([357])\b/)

		if (tier !== null)
			return GENERIC_MODELS.cpu[`Intel Core i${tier[1]}`]
		
		if (/^\s*\d+(\.\d+)?\s*ghz\b/.test(text))
			return GENERIC_MODELS.cpu["Pentium, Single Core, or only a clock speed"]

		return null
	}

	const size = text.match(/(\d+(?:\.\d+)?)\s*(mb|gb)\b/)

	if (size === null)
		return null

	const mb = Number(size[1]) * (size[2] === "gb" ? 1024 : 1)
	const match = GENERIC_VRAM_MB.find(([limit]) => mb <= limit)

	return match ? GENERIC_MODELS.gpu[match[1]] : null
}

function sanitizeHardware(kind: HardwareKind, value: unknown): HardwareModel[]
{
	if (!Array.isArray(value))
		return []

	const items: HardwareModel[] = []

	for (const item of value)
	{
		if (!isRecord(item))
			continue

		const original = cleanString(item.original)
		const model = cleanString(item.model)

		if (original === null || model === null)
			continue

		const known = getHardwareScore(kind, model) !== null

		if (known && hasSameNumbers(original, model))
			items.push({ original, model, estimated: false })
		else if (!hasModelNumber(original))
		{
			const generic = known && GENERIC_KEYS[kind].has(normalizeHardwareName(model))
							? model
							: genericFromOriginal(kind, original)

			if (generic !== null)
				items.push({ original, model: generic, estimated: true })
		}
		else
		{
			const fromOriginal = modelFromOriginal(kind, original)

			if (fromOriginal !== null)
				items.push({ original, model: fromOriginal, estimated: false })
		}
	}

	return items
}

function writtenVram(text: string, vramGb: number | null): number | null
{
	if (vramGb === null)
		return null

	const sizes = text
		.split("\n")
		.filter((line) => /graphics|video|vram|gpu/i.test(line))
		.flatMap((line) => [...line.matchAll(/(\d+(?:\.\d+)?)\s*(gb|mb)\b/gi)])
		.map((match) => match[2].toLowerCase() === "mb" ? Number(match[1]) / 1024 : Number(match[1]))

	return sizes.some((size) => Math.abs(size - vramGb) < 0.01) ? vramGb : null
}

function positiveUpTo(value: unknown, max: number): number | null
{
	if (typeof value !== "number" || !Number.isFinite(value))
		return null

	return value > 0 && value <= max ? value : null
}

function sanitizeTier(value: unknown, text: string): RequirementTier | null
{
	if (!isRecord(value))
		return null

	const rawCores = positiveUpTo(value.cpuCores, 256)
	const cores = rawCores !== null && Number.isInteger(rawCores) ? rawCores : null
	const ghz = positiveUpTo(value.cpuGhz, 10)

	return {
		os: cleanString(value.os),
		cpuModels: fixCoreCountModels(sanitizeHardware("cpu", value.cpuModels), cores, ghz),
		cpuGhz: ghz,
		cpuCores: cores,
		gpuModels: sanitizeHardware("gpu", value.gpuModels),
		vramGb: writtenVram(text, positiveUpTo(value.vramGb, 128)),
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
		minimum: reqs.minimum ? sanitizeTier(raw.minimum, reqs.minimum) : null,
		recommended: reqs.recommended ? sanitizeTier(raw.recommended, reqs.recommended) : null,
	}
}