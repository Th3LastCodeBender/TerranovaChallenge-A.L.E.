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
	limitedBy: "gpu" | "cpu" | "cap"
	gpuFps: number
	cpuFps: number | null
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
	preset: QualityPreset
	gpuFps: number
	cpuFps: number
}

//Quanti fps fanno GPU e CPU richieste, al preset indicato, a 1080p
//recommended: tarato con scripts/calibrate-fps.ts su 11 giochi (2026-11-14)
//minimum: ipotesi, non tarabile senza catture da un PC sotto i consigliati
const BASE_ESTIMATES: Record<FpsEstimate["basedOn"], Anchor> = {
	recommended: { preset: "high", gpuFps: 100, cpuFps: 100 },
	minimum: { preset: "low", gpuFps: 60, cpuFps: 60 },
}

const Q_PRESETS: QualityPreset[] = [ "low", "medium", "high", "ultra" ]

const RESOLUTIONS: Resolution[] = [ "1080p", "1440p", "4k" ]

const CPU_PRESET_SCALING: Record<QualityPreset, number> = {
	low: 1.25,
	medium: 1.07,
	high: 1.0,
	ultra: 0.9,
}

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

function limitedBy(gpuFps: number, cpuCap: number): estimateCell["limitedBy"]
{
	if (MAX_FPS < Math.min(gpuFps, cpuCap))
		return "cap"

	return cpuCap < gpuFps ? "cpu" : "gpu"
}

function computeEstimateCells(score: compScore, baseEstimate: Anchor, ramBelowMinimum: boolean): estimateCell[] | null
{
	const gpuRatio = scoreRatio(score.gpu)

	if (gpuRatio === null)
		return null

	const cpuRatio = scoreRatio(score.cpu)
	const gpuHighFps = baseEstimate.gpuFps / QPRESET_PERF_SCALING[baseEstimate.preset] * gpuRatio
	const cpuHighFps = cpuRatio === null ? Infinity : baseEstimate.cpuFps / CPU_PRESET_SCALING[baseEstimate.preset] * cpuRatio
	const ramFactor = ramBelowMinimum ? RAM_PENALTY : 1

	return RESOLUTIONS.flatMap((resolution) => 
		Q_PRESETS.map((preset): estimateCell => 
		{
			const gpuFps = gpuHighFps * QPRESET_PERF_SCALING[preset] * RESOLUTION_PERF_SCALING[resolution]
			const presetCpuCap = cpuHighFps * CPU_PRESET_SCALING[preset]

			const fps = Math.round(Math.min(gpuFps, presetCpuCap, MAX_FPS) * ramFactor)

			return {
				preset,
				resolution,
				fps,
				band: toBand(fps),
				limitedBy: limitedBy(gpuFps, presetCpuCap),
				gpuFps: Math.round(gpuFps),
				cpuFps: Number.isFinite(presetCpuCap) ? Math.round(presetCpuCap) : null,
			}
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

	const ramBelowMinimum = compact.minimum?.ramGb.status === "fail"

	for (const {tier, basedOn } of tiers)
	{
		if (tier === null)
			continue

		const cells = computeEstimateCells(tier, BASE_ESTIMATES[basedOn], ramBelowMinimum)

		if (cells !== null)
			return { basedOn, cells, summary: summarize(cells, resolution)}
	}

	return null
}