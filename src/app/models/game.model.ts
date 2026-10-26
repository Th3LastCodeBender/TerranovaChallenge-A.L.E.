
import { GamePlatform, ParentPlatform } from "./platform.model";
import { Genre } from "./genre.model";
import { GameStore } from "./store.model";
import { Tag } from "./tag.model";

export interface Game {
	id: number;
	slug: string;
	name: string;

	released: string | null;
	tba: boolean;

	background_image: string | null;

	rating: number;
	rating_top: number;
	ratings: Rating[];

	ratings_count: number;
	reviews_count: number;

	metacritic: number | null;
	playtime: number;

	platforms: GamePlatform[];
	parent_platforms: ParentPlatform[];

	genres: Genre[];
	stores: GameStore[];
	tags: Tag[];

	esrb_rating: EsrbRating | null;

	short_screenshots: Screenshot[];
}

interface Rating {
	id: number;
	title: string;
	count: number;
	percent: number;
}

export interface EsrbRating {
	id: number;
	name: string;
	slug: string;
}

export interface Screenshot {
	id: number;
	image: string;
}