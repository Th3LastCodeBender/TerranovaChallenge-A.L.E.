import { Component, inject, input, model, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritesService } from '../../services/favorites/favorites-service';
import { AuthService } from '../../services/auth/auth-service';

@Component({
	selector: 'app-favourite-button',
	styleUrl: './favourite-button.scss',
	templateUrl: './favourite-button.html',
})
export class FavouriteButton {
	private favoritesService = inject(FavoritesService);
	private auth = inject(AuthService);
	private router = inject(Router);

	gameId = input.required<number>();
	isFavourite = model(false);   // two-way: [(isFavourite)]
	variant = input<'full' | 'icon'>('full');   // 'icon' = solo quadrato con cuore (game-card)

	pending = signal(false);

	toggle(event?: Event): void {
		// Evita che il click arrivi alla game-card (che aprirebbe la pagina del gioco)
		event?.stopPropagation();
		event?.preventDefault();
		if (!this.auth.isLoggedIn()) {
			this.router.navigate(['/login']);
			return;
		}
		if (this.pending())
			return;

		const wasFavourite = this.isFavourite();
		this.isFavourite.set(!wasFavourite);   // aggiornamento ottimistico
		this.pending.set(true);

		const request = wasFavourite
			? this.favoritesService.removeFavourite(this.gameId())
			: this.favoritesService.addFavourite(this.gameId());

		request.subscribe({
			next: () => this.pending.set(false),
			error: err => {
				console.error('Errore aggiornamento preferiti:', err);
				this.isFavourite.set(wasFavourite);   // rollback
				this.pending.set(false);
			},
		});
	}
}
