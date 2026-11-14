import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, Observable, finalize } from 'rxjs';
import { IgdbGame } from '../../models/game.model';

interface FavouritesResponse {
	games: IgdbGame[];
	total: number;
}

export interface CollectionCounts {
	favourites_length: number;
	to_play_length: number;
	playing_length: number;
	finished_length: number;
	to_buy_length: number;
}

@Injectable({
	providedIn: 'root'
})
export class FavoritesService {
	private http = inject(HttpClient);
	private baseUrl = '/api/favourites';
	count = signal(0);

	// Id dei giochi preferiti dell'utente, condivisi tra game-card e game-details
	private ids = signal<ReadonlySet<number>>(new Set());
	private idsLoadedFor: number | null = null;   // userId per cui sono stati caricati
	private idsLoading = false;

	isFavourite(gameId: number): boolean {
		return this.ids().has(gameId);
	}

	// Carica gli id una sola volta per utente; chiamate ripetute sono no-op
	loadIds(userId: number): void {
		if (this.idsLoading || this.idsLoadedFor === userId)
			return;
		this.idsLoading = true;
		this.http.get<{ ids: number[] }>(`${this.baseUrl}/get-ids`)
			.pipe(finalize(() => this.idsLoading = false))
			.subscribe({
				next: res => {
					this.ids.set(new Set(res.ids));
					this.idsLoadedFor = userId;
				},
				error: err => console.error('Errore caricamento id preferiti:', err),
			});
	}

	private setId(gameId: number, present: boolean): void {
		this.ids.update(prev => {
			const next = new Set(prev);
			if (present)
				next.add(gameId);
			else
				next.delete(gameId);
			return next;
		});
	}

	getFavourites(page = 1): Observable<FavouritesResponse> {
		return this.http.get<FavouritesResponse>(`${this.baseUrl}/get-favourites`, {
			params: { offset: (page - 1) * 20 }
		}).pipe(tap(res => this.count.set(res.total)));
	}

	addFavourite(gameId: number): Observable<unknown> {
		return this.http.post(`${this.baseUrl}/add-favourite`, { gameId })
		.pipe(tap(() => {
			this.count.update(c => c + 1);
			this.setId(gameId, true);
		}));
	}

	removeFavourite(gameId: number): Observable<unknown> {
		return this.http.delete(`${this.baseUrl}/delete-favourite`, { body: { gameId } })
		.pipe(tap(() => {
			this.count.update(c => Math.max(0, c - 1));
			this.setId(gameId, false);
		}));
	}

	getCounts(): Observable<CollectionCounts> {
		return this.http.get<CollectionCounts>(`/api/count-collections`);
	}
}
