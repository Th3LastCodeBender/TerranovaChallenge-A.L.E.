import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

export function isCollectionSlug(value: string | null): value is CollectionSlug {
	return value !== null && value in COLLECTIONS;
}

@Injectable({ providedIn: 'root' })
export class CollectionsService {
	private http = inject(HttpClient);

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
}
