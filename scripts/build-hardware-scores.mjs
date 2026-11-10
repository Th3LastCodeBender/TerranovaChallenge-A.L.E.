import { readFileSync, writeFileSync } from "node:fs"

function parseChart(path)
{
	const lines = readFileSync(path, "utf8").split("\n").map((line) => line.trim())
	const scores = {}

	for (let i = 1; i + 1 < lines.length; i++)
	{
		if (!/^\(\d+%\)$/.test(lines[i]))
			continue

		const name = lines[i - 1]
		const score = Number(lines[i + 1].replace(/,/g, ""))

		if (name && Number.isFinite(score) && !(name in scores))
			scores[name] = score
	}

	return scores
}

const output = {
	gpu: parseChart("data/hardware/GPU-Desktop.md"),
	cpu: parseChart("data/hardware/CPU-Desktop-Laptop.md"),
}

writeFileSync("lib/compat/hardware-scores.json", JSON.stringify(output, null, "\t"))

console.log(`GPU: ${Object.keys(output.gpu).length}, CPU: ${Object.keys(output.cpu).length}`)