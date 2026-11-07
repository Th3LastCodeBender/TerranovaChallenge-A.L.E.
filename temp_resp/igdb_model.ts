/* ============================================================
 *  IGDB API v4 — tipi delle risposte
 *  Ogni campo è opzionale: arriva solo se richiesto in `fields`
 *  e solo se ha un valore.
 * ============================================================ */

/* ---------- Immagini ---------- */

export interface IgdbImage {
	id: number;
	image_id: string;		// serve per costruire l'URL (vedi igdbImageUrl)
	width?: number;
	height?: number;
	alpha_channel?: boolean;
	animated?: boolean;
}

export type IgdbImageSize =
	| 'thumb'				// 90x90
	| 'cover_small'			// 90x128
	| 'cover_big'			// 264x374
	| 'screenshot_med'		// 569x320
	| 'screenshot_big'		// 889x500
	| 'screenshot_huge'		// 1280x720
	| 'logo_med'			// 284x160
	| '720p'
	| '1080p';

export function igdbImageUrl(imageId: string, size: IgdbImageSize = 'cover_big'): string
{
	return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export interface IgdbVideo {
	id: number;
	name?: string;
	video_id: string;		// ID YouTube → https://www.youtube.com/watch?v=<video_id>
}

/* ---------- Entità di classificazione ---------- */

// genres, themes, game_modes, player_perspectives, keywords hanno tutti questa forma
export interface IgdbNamedEntity {
	id: number;
	name: string;
	slug?: string;
	url?: string;
}

export type IgdbGenre = IgdbNamedEntity;
export type IgdbTheme = IgdbNamedEntity;
export type IgdbGameMode = IgdbNamedEntity;
export type IgdbPlayerPerspective = IgdbNamedEntity;
export type IgdbKeyword = IgdbNamedEntity;
export type IgdbFranchise = IgdbNamedEntity;
export type IgdbCollection = IgdbNamedEntity;

export interface IgdbPlatform {
	id: number;
	name: string;
	abbreviation?: string;		// "PC", "PS5", "NSW"
	slug?: string;
	platform_logo?: IgdbImage;
	platform_family?: number;
}

export interface IgdbGameType {
	id: number;
	type: string;			// "Main Game", "DLC", "Expansion", "Remake", ...
}

/* ---------- Aziende ---------- */

export interface IgdbCompany {
	id: number;
	name: string;
	slug?: string;
	logo?: IgdbImage;
}

export interface IgdbInvolvedCompany {
	id: number;
	company: IgdbCompany;
	developer: boolean;
	publisher: boolean;
	porting: boolean;
	supporting: boolean;
}

/* ---------- Uscite e siti ---------- */

export interface IgdbReleaseDate {
	id: number;
	date?: number;			// unix timestamp in SECONDI
	human?: string;			// "Feb 25, 2022" oppure "TBD"
	platform?: IgdbPlatform;
	y?: number;
	m?: number;
}

export interface IgdbWebsite {
	id: number;
	url: string;
	type?: number;			// riferimento a /website_types (Steam, official, ...)
	trusted?: boolean;
}

/* ---------- Gioco ---------- */

export interface IgdbGame {
	id: number;
	name?: string;
	slug?: string;
	url?: string;			// pagina del gioco su igdb.com

	summary?: string;
	storyline?: string;

	cover?: IgdbImage;
	artworks?: IgdbImage[];
	screenshots?: IgdbImage[];
	videos?: IgdbVideo[];

	first_release_date?: number;	// unix timestamp in SECONDI
	release_dates?: IgdbReleaseDate[];

	genres?: IgdbGenre[];
	themes?: IgdbTheme[];
	game_modes?: IgdbGameMode[];
	player_perspectives?: IgdbPlayerPerspective[];
	keywords?: IgdbKeyword[];
	platforms?: IgdbPlatform[];
	game_type?: IgdbGameType;

	franchises?: IgdbFranchise[];
	collections?: IgdbCollection[];
	involved_companies?: IgdbInvolvedCompany[];
	websites?: IgdbWebsite[];

	rating?: number;			// 0-100, utenti IGDB
	rating_count?: number;
	aggregated_rating?: number;		// 0-100, critica
	aggregated_rating_count?: number;
	total_rating?: number;			// media dei due
	total_rating_count?: number;
	hypes?: number;				// attesa prima dell'uscita

	similar_games?: IgdbGame[];		// giochi parziali, con i campi chiesti
	dlcs?: IgdbGame[];
	expansions?: IgdbGame[];
	parent_game?: IgdbGame;			// per DLC/espansioni: il gioco base
}

/* ---------- Popolarità ---------- */

export interface IgdbPopularityPrimitive {
	id: number;
	game_id: number;
	popularity_type: number;		// riferimento a /popularity_types
	value: number;
	calculated_at?: number;
}

/* ---------- Multiquery ---------- */

// Ogni elemento corrisponde a un blocco `query games "Nome" { ... };`
export interface IgdbMultiqueryResult<T = IgdbGame> {
	name: string;			// il nome che hai dato al blocco
	result: T[];
}


// ESEMPIO DI UTILIZZO DI UN COMPONENTE

const date = game.first_release_date
	? new Date(game.first_release_date * 1000)
	: null;

const coverUrl = game.cover
	? igdbImageUrl(game.cover.image_id, 'cover_big')
	: 'assets/no-cover.png';

const developer = game.involved_companies
	?.find(c => c.developer)?.company.name;
