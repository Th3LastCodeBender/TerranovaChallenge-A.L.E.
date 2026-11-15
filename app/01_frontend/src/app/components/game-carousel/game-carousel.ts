import { Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { IgdbGame } from '../../models/game.model';
import { GameCard } from '../game-card/game-card';

@Component({
  selector: 'app-game-carousel',
  imports: [GameCard],
  styleUrl: './game-carousel.scss',
  templateUrl: './game-carousel.html',
})
export class GameCarousel {
	title = input.required<string>();
	icon = input<string>('bi-controller');
	games = input<IgdbGame[]>([]);

	private track = viewChild<ElementRef<HTMLElement>>('track');

	canScrollLeft = signal(false);
	canScrollRight = signal(true);

	scroll(direction: 1 | -1): void {
		const el = this.track()?.nativeElement;
		if (!el) return;
		el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
	}

	updateArrows(): void {
		const el = this.track()?.nativeElement;
		if (!el) return;
		this.canScrollLeft.set(el.scrollLeft > 4);
		this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
	}
}
