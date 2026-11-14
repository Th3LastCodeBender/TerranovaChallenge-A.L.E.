import { readFileSync, readdirSync, existsSync } from "node:fs"
import path from "node:path"

import { getGameRequirements } from "@/lib/can-i-run/can-i-run"
import { checkCompatibility } from "@/lib/can-i-run/check"
import { estimatePerf, type QualityPreset } from "@/lib/can-i-run/fps-estimate"
import { redis_pool } from "@/lib/redis/redis-init"
import type { PcSpecs } from "@/query/pcSpecs"

//Il PC su cui sono state fatte le catture
const MY_SPECS: PcSpecs = {
	cpu: "AMD Ryzen 7 7435HS",
	gpu: "NVIDIA GeForce RTX 4060 Laptop GPU",
	ramGb: 16,
	vramGb: 8,
	os: "Windows 11",
}

const CAPTURES_DIR = "lib/game_sessions_stats/Captures"

//GameName scritto da CapFrameX -> id Steam
const STEAM_IDS: Record<string, number> = {
	"Assetto Corsa Competizione": 805550,
	"Breathedge": 738520,
	"Century-Win64-Shipping": 918570,
	"Lonely Mountains - Snow Riders": 2545360,
	"Rainbow Six Siege": 359550,
	"Sons of The Forest": 1326470,
	"Subnautica 2": 1962700,
	"Tyr": 2445260,
	"World of Tanks": 1407200,
	"assettocorsarally": 3917090,
	"art of rally": 550320,
}

//Se la GPU poteva andare almeno il 15% piu veloce degli fps reali, il limite era la CPU
const GPU_SLACK = 1.15

type Measured = {
	game: string
	preset: QualityPreset
	fps: number
	cpuFps: number
	gpuFps: number
	limitedBy: "cpu" | "gpu"
}

function toPreset(comment: string): QualityPreset | null
{
	const text = comment.toLowerCase()

	if (text.includes("capped"))
		return null

	if (text.startsWith("max") || text.startsWith("ultra")) return "ultra"
	if (text.startsWith("high")) return "high"
	if (text.startsWith("medium")) return "medium"
	if (text.startsWith("low")) return "low"

	return null
}

function mean(values: number[]): number
{
	return values.reduce((sum, value) => sum + value, 0) / values.length
}

function geoMean(values: number[]): number
{
	return Math.exp(mean(values.map(Math.log)))
}

function readCapture(jsonPath: string): Measured | null
{
	const csvPath = jsonPath + ".csv"

	if (!existsSync(csvPath))
		return null

	const info = JSON.parse(readFileSync(jsonPath, "utf8").replace(/^﻿/, "")).Info
	const preset = toPreset(info.Comment ?? "")

	if (preset === null)
		return null

	const lines = readFileSync(csvPath, "utf8").split("\n").filter((line) => line.trim() !== "" && !line.startsWith("//"))
	const header = lines[0].split(",")
	const col = (name: string) => header.indexOf(name)
	const [frameCol, cpuCol, gpuCol] = [col("MsBetweenPresents"), col("MsCPUBusy"), col("MsGPUBusy")]

	const frame: number[] = []
	const cpu: number[] = []
	const gpu: number[] = []

	for (const line of lines.slice(1))
	{
		const cells = line.split(",")
		const values = [Number(cells[frameCol]), Number(cells[cpuCol]), Number(cells[gpuCol])]

		if (values.every(Number.isFinite))
		{
			frame.push(values[0])
			cpu.push(values[1])
			gpu.push(values[2])
		}
	}

	const fps = 1000 / mean(frame)
	const gpuFps = 1000 / mean(gpu)

	return {
		game: info.GameName,
		preset,
		fps,
		cpuFps: 1000 / mean(cpu),
		gpuFps,
		limitedBy: gpuFps > fps * GPU_SLACK ? "cpu" : "gpu",
	}
}

function pct(predicted: number, measured: number): string
{
	const diff = Math.round((predicted / measured - 1) * 100)
	return (diff > 0 ? "+" : "") + diff + "%"
}

async function main()
{
	const captures = readdirSync(CAPTURES_DIR)
		.filter((file) => file.endsWith(".json"))
		.map((file) => readCapture(path.join(CAPTURES_DIR, file)))
		.filter((capture): capture is Measured => capture !== null)

	const gpuErrors: number[] = []
	const cpuErrors: number[] = []
	const rows = []

	for (const capture of captures)
	{
		const steamAppId = STEAM_IDS[capture.game]

		if (steamAppId === undefined)
		{
			console.warn(`Manca l'id Steam per "${capture.game}"`)
			continue
		}

		const requirements = await getGameRequirements(steamAppId)

		if (requirements === null)
		{
			console.warn(`Requisiti non trovati per "${capture.game}"`)
			continue
		}

		const estimate = estimatePerf(checkCompatibility(MY_SPECS, requirements), "1080p")
		const cell = estimate?.cells.find((c) => c.preset === capture.preset && c.resolution === "1080p")

		if (estimate === null || cell === undefined)
		{
			console.warn(`Stima impossibile per "${capture.game}" (cpu o gpu sconosciute)`)
			continue
		}

		//La gpu-cap misurata vale sempre, la cpu-cap solo quando il limite era davvero la CPU
		gpuErrors.push(capture.gpuFps / cell.gpuFps)

		if (capture.limitedBy === "cpu" && cell.cpuFps !== null)
			cpuErrors.push(capture.cpuFps / cell.cpuFps)

		rows.push({
			gioco: capture.game.slice(0, 22),
			preset: capture.preset,
			base: estimate.basedOn,
			fps: `${cell.fps} / ${Math.round(capture.fps)}`,
			err: pct(cell.fps, capture.fps),
			gpu: `${cell.gpuFps} / ${Math.round(capture.gpuFps)}`,
			cpu: `${cell.cpuFps ?? "-"} / ${Math.round(capture.cpuFps)}`,
			limite: `${cell.limitedBy} / ${capture.limitedBy}`,
		})
	}

	console.log("\nOgni colonna: stimato / misurato")
	console.table(rows)

	const fpsErrors = rows.map((row) => Math.abs(parseInt(row.err)))
	const limitHits = rows.filter((row) => row.limite.split(" / ")[0] === row.limite.split(" / ")[1]).length

	console.log(`Errore medio fps: ${Math.round(mean(fpsErrors))}%`)
	console.log(`Collo di bottiglia giusto: ${limitHits}/${rows.length}`)

	if (gpuErrors.length > 0)
		console.log(`GPU: la realta e ${geoMean(gpuErrors).toFixed(2)}x la stima (${gpuErrors.length} catture)`)

	if (cpuErrors.length > 0)
		console.log(`CPU: la realta e ${geoMean(cpuErrors).toFixed(2)}x la stima (${cpuErrors.length} catture)`)
}

main()
	.catch((error) => console.error(error))
	.finally(() => redis_pool.quit())
