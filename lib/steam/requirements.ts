import "server-only"

const STEAM_APPDETAILS_URL = "https://store.steampowered.com/api/appdetails"

type SteamRequirementsHtml = {
	minimum?: string
	recommended?: string
}

type SteamAppDetailsResponse = Record<string, {
	success: boolean
	data?: {
		name: string
		pc_requirements: SteamRequirementsHtml | [] //steam ti adoro
	}
}>

export type SteamRequirementsText = {
	name: string
	steamAppId: number
	minimum: string | null
	recommended: string | null
}

const HTML_ENTITIES: Record<string, string> = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": "\"",
	"&#39;": "'",
	"&nbsp;": " ",
}

function htmlToText(html: string | undefined): string | null
{
	if (!html)
		return null

	const text = html
		.replace(/<br\s*\/?>|<\/li>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity])
		.replace(/^(Minimum|Recommended):\s*/i, "")
		.replace(/\n\s*\n+/g, "\n")
		.trim()

	return text.length > 0 ? text : null
}

export async function getSteamRequirements(appId:number): Promise<SteamRequirementsText | null>
{
	const url = `${STEAM_APPDETAILS_URL}?appids=${appId}&filters=basic&l=english`
	const response = await fetch(url)

	if (!response.ok)
		throw new Error(`Steam appdetails failed: HTTP ${response.status}`)

	const body = await response.json() as SteamAppDetailsResponse
	const entry = body[String(appId)]

	if (!entry?.success || !entry.data)
		return null

	const reqs = entry.data.pc_requirements

	if (Array.isArray(reqs))
		return null

	const minimum = htmlToText(reqs.minimum)
	const recommended = htmlToText(reqs.recommended)

	if (!minimum && !recommended)
		return null

	return {name: entry.data.name, steamAppId:appId, minimum, recommended}
}