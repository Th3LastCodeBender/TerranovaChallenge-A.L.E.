export type IgdbNamed = {
	id: number
	name: string
}

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

export type IgdbPopularity = {
	id: number
	game_id: number
	value: number
	popularity_type: number
}
