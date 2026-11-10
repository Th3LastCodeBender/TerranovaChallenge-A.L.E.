import "server-only"

import scores from "./hardware-scores.json"

const GPU_SCORES: Record<string, number> = scores.gpu
const CPU_SCORES: Record<string, number> = scores.cpu

const NOISE_WORDS = /\b(nvidia|geforce|amd|radeon|intel|core|processor|graphics|gpu|cpu|series|ati)\b/g

const ALIASES: Record<string, string> = {
	p4: "pentium4",
	amd64x2: "athlon64x2",
	athlonx2: "athlon64x2",
}

const MIN_FAMILY_LENGTH = 4

export function normalizeHardwareName(name: string): string
{
	return name
			.toLowerCase()
			.replace(/\(r\)|\(tm\)|®|™/g, "")
			.replace(/@.*$/, "")
			.replace(/\d+(\.\d+)?\s*(gb|mb|ghz)\b/g, "")
			.replace(/core2/g, "core 2")
			.replace(/\b[a-z0-9]+-core\b/g, "")
			.replace(NOISE_WORDS, "")
			.replace(/[^a-z0-9]/g, "")
}

function buildIndex(table: Record<string, number>): Map<string, number>
{
	return new Map(
		Object.entries(table).map(([name, score]) => [normalizeHardwareName(name), score])
	)
}

const GPU_INDEX = buildIndex(GPU_SCORES)
const CPU_INDEX = buildIndex(CPU_SCORES)

export type HardwareKind = "cpu" | "gpu"

function lookup(index: Map<string, number>, key: string): number | null
{
	const exact = index.get(key)

	if (exact !== undefined)
		return exact

	if (key.length < MIN_FAMILY_LENGTH)
		return null

	let lowest: number | null = null

	for (const [name, score] of index)
		if (name.startsWith(key) && (lowest === null || score < lowest))
			lowest = score

	return lowest
}

export function getHardwareScore(kind: HardwareKind, name: string): number | null
{
	const index = kind === "gpu" ? GPU_INDEX : CPU_INDEX
	const key = normalizeHardwareName(name)

	return lookup(index, ALIASES[key] ?? key)
}