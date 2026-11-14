import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, tap } from 'rxjs';
import { IgdbGame } from '../../models/game.model';

export interface CollectionResponse {
	games: IgdbGame[];
	total: number;
}

export const COLLECTIONS = {
	'finished':   { title: 'Finished',   status: 'FINISHED' },
	'playing':    { title: 'Playing',    status: 'PLAYING' },
	'to-play':    { title: 'To play',    status: 'TO_PLAY' },
	'to-buy':     { title: 'Wishlist',   status: 'TO_BUY' },
	'favourites': { title: 'Favourites', status: null },
} as const;

export type CollectionSlug = keyof typeof COLLECTIONS;

// Stati validi per /api/collections/* (enum WG_GameStatus del backend)
export type CollectionStatus = NonNullable<(typeof COLLECTIONS)[CollectionSlug]['status']>;

export function isCollectionSlug(value: string | null): value is CollectionSlug {
	return value !== null && value in COLLECTIONS;
}

@Injectable({ providedIn: 'root' })
export class CollectionsService {
	private http = inject(HttpClient);

	// Stato di ogni gioco in collezione (gameId -> status), condiviso tra game-card e game-details
	private statuses = signal<ReadonlyMap<number, CollectionStatus>>(new Map());
	private statusesLoadedFor: number | null = null;   // userId per cui sono stati caricati
	private statusesLoading = false;

	statusOf(gameId: number): CollectionStatus | null {
		return this.statuses().get(gameId) ?? null;
	}

	// Carica gli stati una sola volta per utente; chiamate ripetute sono no-op
	loadStatuses(userId: number): void {
		if (this.statusesLoading || this.statusesLoadedFor === userId)
			return;
		this.statusesLoading = true;
		this.http.get<{ statuses: Record<string, CollectionStatus> }>('/api/collections/get-statuses')
			.pipe(finalize(() => this.statusesLoading = false))
			.subscribe({
				next: res => {
					this.statuses.set(new Map(
						Object.entries(res.statuses).map(([id, s]) => [Number(id), s])
					));
					this.statusesLoadedFor = userId;
				},
				error: err => console.error('Errore caricamento stati collection:', err),
			});
	}

	private setLocalStatus(gameId: number, status: CollectionStatus | null): void {
		this.statuses.update(prev => {
			const next = new Map(prev);
			if (status === null)
				next.delete(gameId);
			else
				next.set(gameId, status);
			return next;
		});
	}

	getCollection(slug: CollectionSlug, page = 1): Observable<CollectionResponse> {
		const offset = (page - 1) * 20;
		const { status } = COLLECTIONS[slug];

		if (status === null)
			return this.http.get<CollectionResponse>('/api/favourites/get-favourites', {
				params: { offset }
			});

		return this.http.get<CollectionResponse>('/api/collections/get-items', {
			params: { collection_type: status, offset }
		});
	}

	// Upsert: un gioco ha un solo stato, quindi questo sposta anche da una collection all'altra
	setStatus(gameId: number, collectionType: CollectionStatus): Observable<unknown> {
		return this.http.post('/api/collections/update-item', { gameId, collectionType })
			.pipe(tap(() => this.setLocalStatus(gameId, collectionType)));
	}

	removeFromCollection(gameId: number): Observable<unknown> {
		return this.http.delete('/api/collections/delete-item', { body: { gameId } })
			.pipe(tap(() => this.setLocalStatus(gameId, null)));
	}
}
