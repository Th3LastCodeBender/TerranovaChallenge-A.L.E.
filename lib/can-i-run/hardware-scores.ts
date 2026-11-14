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

function splitVariants(name: string): string[]
{
	const parts = name
					.split("/")
					.map(part => part.trim().split(/\s+/))
					.filter(words => words[0] !== "")

	let base = parts[0]
	const names = [base.join(" ")]

	for (const words of parts.slice(1))
	{
		base = [...base.slice(0, Math.max(0, base.length - words.length)), ...words]
		names.push(base.join(" "))
	}

	return names
}

function buildIndex(table: Record<string, number>): Map<string, number>
{
	const index = new Map<string, number>()
	const entries = Object.entries(table)

	for (const [name, score] of entries)
		if (!name.includes("/"))
			index.set(normalizeHardwareName(name), score)
	
	for (const [name, score] of entries)
		if (name.includes("/"))
			for (const variant of splitVariants(name))
			{
				const key = normalizeHardwareName(variant)

				if (/\d/.test(key) && !index.has(key))
					index.set(key, score)
			}
	
	return index
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
		if (name.startsWith(key) && !/^\d/.test(name.slice(key.length)) && (lowest === null || score < lowest))
			lowest = score

	return lowest
}

export function getHardwareScore(kind: HardwareKind, name: string): number | null
{
	const index = kind === "gpu" ? GPU_INDEX : CPU_INDEX
	const key = normalizeHardwareName(name)

	return lookup(index, ALIASES[key] ?? key)
}