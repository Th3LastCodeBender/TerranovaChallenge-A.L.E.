
export interface GamePlatform {
	platform: Platform;
	released_at: string | null;
	requirements_en: Requirements | null;
	requirements_ru: Requirements | null;
}

export interface Platform {
	id: number;
	name: string;
	slug: string;

	image: string | null;

	year_start: number | null;
	year_end: number | null;

	games_count: number;
	image_background: string | null;
}

export interface Requirements {
	minimum?: string;
	recommended?: string;
}

export interface ParentPlatform {
	platform: {
		id: number;
		name: string;
		slug: string;
	};
}