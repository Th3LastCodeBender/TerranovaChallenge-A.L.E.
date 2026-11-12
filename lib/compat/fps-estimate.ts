import "server-only"

import type { CompatResult, ComponentCheck, compScore } from "./check"

export type QualityPreset = "low" | "medium" | "high" | "ultra"

export type Resolution = "1080p" | "1440p" | "4k"

export type FpsBand = "<30" | "30-45" | "45-60" | "60-90" | "90-144" | "144+"

export type estimateCell = {
	preset: QualityPreset
	resolution: Resolution
	fps: number
	band: FpsBand
	limitedBy: "gpu" | "cpu"
}

export type FpsSummary = {
	preset: QualityPreset
	resolution: Resolution
	fps: number
	band: FpsBand
}

export type FpsEstimate = {
	basedOn: "recommended" | "minimum"
	cells: estimateCell[]
	summary: FpsSummary | null
}

type Anchor = {
	fps: number
	preset: QualityPreset
}

//Queste sono ipotesi che ho scelto io:
//Con hardware recommended si fanno 60fps in high
//Con hardware minimo si fanno 30fps in low
//Tutto questo a 1080p
const BASE_ESTIMATES: Record<FpsEstimate["basedOn"], Anchor> = {
	recommended: { fps: 60, preset: "high" },
	minimum: { fps: 30, preset: "low" },
}

const Q_PRESETS: QualityPreset[] = [ "low", "medium", "high", "ultra" ]

const RESOLUTIONS: Resolution[] = [ "1080p", "1440p", "4k" ]

const QPRESET_PERF_SCALING: Record<QualityPreset, number> = {
	low: 1.6,
	medium: 1.3,
	high: 1.0,
	ultra: 0.75,
}

const RESOLUTION_PERF_SCALING: Record<Resolution, number> = {
	"1080p": 1.0,
	"1440p": 0.7,
	"4k": 0.45,
}

const CPU_HEADROOM = 1.5

const RAM_PENALTY = 0.75

const MAX_FPS = 240

const SUMMARY_TARGETS = [60, 30]

function scoreRatio(check: ComponentCheck): number | null
{
	if (check.have === null || check.need === null || check.need <= 0)
		return null

	return check.have / check.need
}

function toBand(fps: number): FpsBand
{
	if (fps < 30) return "<30"
	if (fps < 45) return "30-45"
	if (fps < 60) return "45-60"
	if (fps < 90) return "60-90"
	if (fps < 144) return "90-144"

	return "144+"
}

function computeEstimateCells(score: compScore, baseEstimate: Anchor): estimateCell[] | null
{
	const gpuRatio = scoreRatio(score.gpu)

	if (gpuRatio === null)
		return null

	const cpuRatio = scoreRatio(score.cpu)
	const highFps = baseEstimate.fps / QPRESET_PERF_SCALING[baseEstimate.preset] * gpuRatio
	const cpuCap = cpuRatio === null ? Infinity : baseEstimate.fps * CPU_HEADROOM * cpuRatio
	const ramFactor = score.ramGb.status === "fail" ? RAM_PENALTY : 1

	return RESOLUTIONS.flatMap((resolution) => 
		Q_PRESETS.map((preset): estimateCell => 
		{
			const gpuFps = highFps * QPRESET_PERF_SCALING[preset] * RESOLUTION_PERF_SCALING[resolution]
			const fps = Math.round(Math.min(gpuFps, cpuCap, MAX_FPS) * ramFactor)

			return { preset, resolution, fps, band: toBand(fps), limitedBy: cpuCap < gpuFps ? "cpu" : "gpu" }
		}))
}

function summarize(cells: estimateCell[], resolution: Resolution): FpsSummary | null
{
	const row = cells.filter((cell) => cell.resolution === resolution)

	for (const target of SUMMARY_TARGETS)
	{
		const best = row.filter((cell) => cell.fps >= target).at(-1)

		if (best !== undefined)
			return { preset: best.preset, resolution, fps: best.fps, band: best.band }
	}

	return null
}

export function estimatePerf(compact: CompatResult, resolution: Resolution = "1080p"): FpsEstimate | null
{
	const tiers = [
		{ tier: compact.recommended, basedOn: "recommended"},
		{ tier: compact.minimum, basedOn: "minimum" },
	] as const

	for (const {tier, basedOn } of tiers)
	{
		if (tier === null)
			continue

		const cells = computeEstimateCells(tier, BASE_ESTIMATES[basedOn])

		if (cells !== null)
			return { basedOn, cells, summary: summarize(cells, resolution)}
	}

	return null
}