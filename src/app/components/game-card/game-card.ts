
import { Component, computed, inject, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { IgdbGame } from '../../models/game.model';
import { igdbImageUrl } from '../../models/image.model';
import { PlatformFamily, platformFamily } from '../../models/platform.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-card',
  imports: [DatePipe, DecimalPipe],
  styleUrl: './game-card.scss',
  templateUrl: './game-card.html',
})
export class GameCard {
  game = input.required<IgdbGame>();
  private router = inject(Router);

  imageUrl = computed(() => {
    const cover = this.game().cover;
    return cover ? igdbImageUrl(cover.image_id, 'cover_big') : null;
  });

  galleryUrls = computed(() => {
    const g = this.game();
    return [...(g.screenshots ?? []), ...(g.artworks ?? [])]
      .map(img => igdbImageUrl(img.image_id, 'screenshot_big'));
  });

  rating = computed(() => (this.game().total_rating ?? this.game().rating ?? 0) / 20);

  criticScore = computed(() => this.game().aggregated_rating ?? null);

  releaseDate = computed(() => {
    const t = this.game().first_release_date;
    return t ? new Date(t * 1000) : null;
  });

  isAnnounced = computed(() =>
    !this.releaseDate() &&
    !!this.game().release_dates?.some(r => r.human?.toUpperCase() === 'TBD')
  );

  platformFamilies = computed(() => {
    const families = new Set<PlatformFamily>();
    for (const p of this.game().platforms ?? []) {
      const f = platformFamily(p);
      if (f) families.add(f);
    }
    return [...families];
  });

  openGame(): void {
    this.router.navigate(['/games', this.game().slug]);
  }

  onCardKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openGame();
    }
  }

}
