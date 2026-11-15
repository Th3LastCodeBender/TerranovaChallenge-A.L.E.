// Oggetto annidato di IGDB espanso con .name (genres.name, themes.name...)
export type IgdbNamed = {
	id: number
	name: string
}

// Un gioco come lo restituisce /v4/games.
// Quasi tutti i campi sono opzionali: IGDB non manda quelli vuoti
// e ogni query chiede campi diversi.
export type IgdbGame = {
	id: number
	name: string
	slug?: string
	summary?: string
	first_release_date?: number
	rating?: number
	rating_count?: number
	total_rating?: number
	aggregated_rating?: number
	aggregated_rating_count?: number
	cover?: { id: number, image_id: string }
	genres?: IgdbNamed[]
	themes?: IgdbNamed[]
	keywords?: IgdbNamed[]
	game_modes?: IgdbNamed[]
	platforms?: (IgdbNamed & { abbreviation?: string })[]
	involved_companies?: { id: number, company?: IgdbNamed }[]
}

// Una riga di /v4/popularity_primitives
export type IgdbPopularity = {
	id: number
	game_id: number
	value: number
	popularity_type: number
}
