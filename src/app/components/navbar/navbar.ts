import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
	Subject,
	debounceTime,
	distinctUntilChanged,
	switchMap,
	of,
	catchError
} from 'rxjs';

import { AuthService } from '../../services/auth/auth-service';
import { ThemeService } from '../../services/theme/theme-service';
import { GamesService } from '../../services/games/games-service';
import { IgdbGame } from '../../models/game.model';
import { igdbImageUrl } from '../../models/image.model';

@Component({
	imports: [RouterLink],
	selector: 'app-navbar',
	styleUrl: './navbar.scss',
	templateUrl: './navbar.html',
})
export class Navbar {
	visibile = signal(false);

	themeService = inject(ThemeService);
	authService = inject(AuthService);
	router = inject(Router);

	private gamesService = inject(GamesService);
	private destroyRef = inject(DestroyRef);

	private searchSubject = new Subject<string>();

	searchResults = signal<IgdbGame[]>([]);
	isSearching = signal(false);
	searchQuery = signal('');
	isSearchOpen = signal(false);

	constructor() {
		this.searchSubject
			.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(query => {
					if (query.length < 2) {
						this.searchResults.set([]);
						this.isSearchOpen.set(false);
						this.isSearching.set(false);
						return of([]);
					}
					this.isSearching.set(true);
					this.isSearchOpen.set(true);
					return this.gamesService
						.getGameByName(query)
						.pipe(
							catchError(error => {
								console.error( 'Errore durante la ricerca dei giochi:',	error );
								this.isSearching.set(false);
								return of([]);
							})
						);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(games => {
				this.searchResults.set(games.slice(0, 20));
				this.isSearching.set(false);
			});
	}

	onSearch(event: Event): void {
		const input = event.target as HTMLInputElement;
		const query = input.value.trim();

		this.searchQuery.set(query);
		this.searchSubject.next(query);
	}

	selectGame(game: IgdbGame): void {
		console.log('Gioco selezionato:', game);

		this.searchResults.set([]);
		this.isSearchOpen.set(false);
	}

	getGameImage(game: IgdbGame): string | null {
		return game.cover
			? igdbImageUrl(game.cover.image_id, 'cover_small')
			: null;
	}

	changeTheme(): void {
		this.themeService.changeTheme();
	}

	logout(): void {
		this.authService.logout();
		this.changeVisibility();
	}

	protected changeVisibility(): void {
		this.visibile.update(v => !v);
	}

	viewAllResults(): void {
		const query = this.searchQuery();
		if (!query)
			return;
		this.isSearchOpen.set(false);
		this.router.navigate(['/games'], {
			queryParams: { search: query }
		});
	}

}