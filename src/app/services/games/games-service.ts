
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { IgdbGame } from '../../models/game.model';

interface GamesServiceSearchResponse {
	results: IgdbGame[];
	count: number;
}

@Injectable({
	providedIn: 'root'
})
export class GamesService {
	private http = inject(HttpClient);
	private baseUrl = '/api/games';

	getGameByName(name: string): Observable<IgdbGame[]> {
		return this.http
			.get<GamesServiceSearchResponse>(`${this.baseUrl}/${encodeURIComponent(name)}`)
			.pipe(map(res => res.results));
	}
}
