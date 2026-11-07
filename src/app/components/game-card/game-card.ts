import { Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { IgdbGame } from '../../models/game.model';
import { igdbImageUrl } from '../../models/image.model';
import { PlatformFamily, platformFamily } from '../../models/platform.model';

@Component({
  selector: 'app-game-card',
  imports: [DatePipe, DecimalPipe],
  styleUrl: './game-card.scss',
  templateUrl: './game-card.html',
})
export class GameCard {
  game = input.required<IgdbGame>();

  imageUrl = computed(() => {
    const g = this.game();
    const wide = g.screenshots?.[0] ?? g.artworks?.[0];
    if (wide) return igdbImageUrl(wide.image_id, 'screenshot_big');
    if (g.cover) return igdbImageUrl(g.cover.image_id, 'cover_big');
    return null;
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
}
