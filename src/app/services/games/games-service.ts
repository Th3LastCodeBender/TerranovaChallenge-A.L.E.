
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { IgdbGame } from '../../models/game.model';
import { GameFilters } from '../../models/game-filters.model';
import { CollectionStatus } from '../collections/collections-service';

interface GameDetailsResponse {
    game: IgdbGame;
    userData: {
        isFavourite: boolean;
        collectionStatus: CollectionStatus | null;
    };
}

// Solo i filtri valorizzati finiscono nella query string
function buildParams(page: number, filters: GameFilters): Record<string, string | number> {
	const params: Record<string, string | number> = { offset: (page - 1) * 20 };
	for (const [key, value] of Object.entries(filters))
		if (value)
			params[key] = value;
	return params;
}

interface GamesServiceSearchResponse {
	results: IgdbGame[];
	count: number;
	offset: number;
	limit: number;
	hasMore: boolean;
}

// Una lista di giochi per ogni categoria restituita da /api/games/home
export type HomeGamesResponse = Record<string, IgdbGame[]>;

// /api/games/suggested per ora restituisce genres e platforms come string[]:
// li convertiamo in oggetti { id, name } come si aspetta la card.
// Quando il backend restituirà IgdbGame completi, questa conversione non avrà effetto.
function toNamed<T>(items: unknown): T[] | undefined {
	if (!Array.isArray(items))
		return undefined;
	return items.map((item, i) =>
		typeof item === 'string' ? { id: i, name: item } : item
	) as T[];
}

function toIgdbGame(game: any): IgdbGame {
	return {
		...game,
		genres: toNamed(game.genres),
		platforms: toNamed(game.platforms),
	};
}

@Injectable({
	providedIn: 'root'
})
export class GamesService {
	private http = inject(HttpClient);
	private gamesBaseUrl = '/api/games/search';
	private gameDetailsUrl = '/api/games';
	private allGamesUrl = '/api/games';
	private homeGamesUrl = '/api/games/home';
	private suggestedGamesUrl = '/api/games/suggested';

	getHomeGames(): Observable<HomeGamesResponse> {
		return this.http.get<HomeGamesResponse>(this.homeGamesUrl);
	}

	getSuggestedGames(): Observable<IgdbGame[]> {
		return this.http
			.get<any[]>(this.suggestedGamesUrl)
			.pipe(map(games => games.map(toIgdbGame)));
	}

	getGameByName(name: string): Observable<IgdbGame[]> {
		return this.http
			.get<GamesServiceSearchResponse>(`${this.gamesBaseUrl}/${encodeURIComponent(name)}`)
			.pipe(map(res => res.results));
	}

	searchGames(name: string, page = 1, filters: GameFilters = {}): Observable<GamesServiceSearchResponse> {
		return this.http.get<GamesServiceSearchResponse>(
			`${this.gamesBaseUrl}/${encodeURIComponent(name)}`,
			{ params: buildParams(page, filters) }
		);
	}

	// Tutti i giochi, 20 per pagina (stessa paginazione della ricerca)
	getAllGames(page = 1, filters: GameFilters = {}): Observable<GamesServiceSearchResponse> {
		return this.http.get<GamesServiceSearchResponse>(
			this.allGamesUrl,
			{ params: buildParams(page, filters) }
		);
	}

	getGameBySlug(slug: string): Observable<GameDetailsResponse> {
        return this.http.get<GameDetailsResponse>(
            `${this.gameDetailsUrl}/${encodeURIComponent(slug)}`
        );
    }
}
