import "server-only"

import { requireEnv } from "../utils"

const OLLAMA_TIMEOUT_MS = 120_000

type OllamaChatResponse = {
	message?: {
		role: string
		content: string
	}

	error?: string
}

type OllamaJsonOptions = {
	model?: string
	timeoutMs?: number
}

export async function ollamaJson(prompt: string, schema: object, options: OllamaJsonOptions = {}): Promise<unknown>
{

	const model = options.model ?? requireEnv("OLLAMA_MODEL")
	const timeoutmS = options.timeoutMs ?? OLLAMA_TIMEOUT_MS
	
	const response = await fetch(`${requireEnv("OLLAMA_URL")}/api/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: model,
			messages: [{ role: "user", content: prompt }],
			format: schema,
			stream: false,
			think: false,
			options: { temperature: 0 },
		}),
		signal: AbortSignal.timeout(timeoutmS),
	})

	if (!response.ok)
		throw new Error(`Ollama request failed: HTTP ${response.status}`)

	const data = await response.json() as OllamaChatResponse

	if (!data.message?.content)
		throw new Error(`Ollama returned no content${data.error ? `: ${data.error}` : ""}`)

	return JSON.parse(data.message.content)
}