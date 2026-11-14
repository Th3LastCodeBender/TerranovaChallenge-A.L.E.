
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { IgdbGame } from '../../models/game.model';
import { CollectionStatus } from '../collections/collections-service';

interface GameDetailsResponse {
    game: IgdbGame;
    userData: {
        isFavourite: boolean;
        collectionStatus: CollectionStatus | null;
    };
}

interface GamesServiceSearchResponse {
	results: IgdbGame[];
	count: number;
	offset: number;
	limit: number;
	hasMore: boolean;
}

@Injectable({
	providedIn: 'root'
})
export class GamesService {
	private http = inject(HttpClient);
	private gamesBaseUrl = '/api/games/search';
	private gameDetailsUrl = '/api/games';

	getGameByName(name: string): Observable<IgdbGame[]> {
		return this.http
			.get<GamesServiceSearchResponse>(`${this.gamesBaseUrl}/${encodeURIComponent(name)}`)
			.pipe(map(res => res.results));
	}

	searchGames(name: string, page = 1): Observable<GamesServiceSearchResponse> {
		return this.http.get<GamesServiceSearchResponse>(
			`${this.gamesBaseUrl}/${encodeURIComponent(name)}`,
			{ params: { offset: (page - 1) * 20 } }
		);
	}

	getGameBySlug(slug: string): Observable<GameDetailsResponse> {
        return this.http.get<GameDetailsResponse>(
            `${this.gameDetailsUrl}/${encodeURIComponent(slug)}`
        );
    }
}
