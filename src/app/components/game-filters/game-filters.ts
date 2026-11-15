import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  FILTER_KEYS,
  GameFilters,
  GENRE_OPTIONS,
  PLATFORM_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  STAR_THRESHOLDS,
} from '../../models/game-filters.model';

// I filtri vivono nei query param dell'URL: game-list li legge da lì
// e ricarica i giochi ogni volta che cambiano.
@Component({
  selector: 'app-game-filters',
  styleUrl: './game-filters.scss',
  templateUrl: './game-filters.html',
})
export class GameFiltersBar {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly genres = GENRE_OPTIONS;
  readonly platforms = PLATFORM_OPTIONS;
  readonly ratings = RATING_OPTIONS;
  readonly sorts = SORT_OPTIONS;
  readonly maxYear = new Date().getFullYear();
  readonly stars = [1, 2, 3, 4, 5];

  readonly filtersOpen = signal(false);

  filters = toSignal(
    this.route.queryParamMap.pipe(
      map(p => {
        const f: GameFilters = {};
        for (const key of FILTER_KEYS)
          f[key] = p.get(key) ?? undefined;
        return f;
      })
    ),
    { initialValue: {} as GameFilters }
  );

  hasActiveFilters = computed(() =>
    FILTER_KEYS.some(key => !!this.filters()[key])
  );

  // stelle attive: la soglia più alta raggiunta dal rating nell'URL
  selectedStars = computed(() => {
    const rating = Number(this.filters().rating);
    if (!rating)
      return 0;
    return STAR_THRESHOLDS.filter(t => rating >= t).length;
  });

  // stelle evidenziate mentre passi sopra col mouse
  hoveredStars = signal(0);

  shownStars = computed(() => this.hoveredStars() || this.selectedStars());

  // ricliccare la stella già selezionata toglie il filtro
  setStars(n: number): void {
    const value = n === this.selectedStars() ? '' : String(STAR_THRESHOLDS[n - 1]);
    this.setFilter('rating', value);
  }

  setFilter(key: keyof GameFilters, value: string): void {
    const changes: Partial<Record<keyof GameFilters, string | null>> = { [key]: value || null };

    // quando cambi ordinamento, il verso più sensato: A→Z per nome, dal più alto per il resto
    if (key === 'sort')
      changes.order = value ? (value === 'name' ? 'asc' : 'desc') : null;

    this.navigate(changes);
  }

  setYear(input: HTMLInputElement): void {
    const year = Number(input.value);
    const valid = /^\d{4}$/.test(input.value) && year >= 1950 && year <= this.maxYear;

    if (input.value && !valid) {
      input.value = this.filters().year ?? '';
      return;
    }
    this.navigate({ year: input.value || null });
  }

  toggleOrder(): void {
    this.navigate({ order: this.filters().order === 'asc' ? 'desc' : 'asc' });
  }

  reset(): void {
    const cleared = Object.fromEntries(FILTER_KEYS.map(key => [key, null]));
    this.navigate(cleared);
  }

  // ogni cambio di filtro riparte dalla pagina 1
  private navigate(changes: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...changes, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
