import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, Observable } from 'rxjs';
import { IgdbGame } from '../../models/game.model';

interface FavouritesResponse {
	games: IgdbGame[];
	total: number;
}

@Injectable({
	providedIn: 'root'
})
export class FavoritesService {
	private http = inject(HttpClient);
	private baseUrl = '/api/favourites';
	count = signal(0);

	getFavourites(page = 1): Observable<FavouritesResponse> {
		return this.http.get<FavouritesResponse>(`${this.baseUrl}/get-favourites`, {
			params: { offset: (page - 1) * 20 }
		}).pipe(tap(res => this.count.set(res.total)));
	}

	addFavourite(gameId: number): Observable<unknown> {
		return this.http.post(`${this.baseUrl}/add-favourite`, { gameId })
		.pipe(tap(() => this.count.update(c => c + 1)));
	}

	removeFavourite(gameId: number): Observable<unknown> {
		return this.http.delete(`${this.baseUrl}/delete-favourite`, { body: { gameId } })
		.pipe(tap(() => this.count.update(c => Math.max(0, c - 1))));
	}
}
