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

  selectedStars = computed(() => {
    const rating = Number(this.filters().rating);
    if (!rating)
      return 0;
    return STAR_THRESHOLDS.filter(t => rating >= t).length;
  });

  hoveredStars = signal(0);

  shownStars = computed(() => this.hoveredStars() || this.selectedStars());

  setStars(n: number): void {
    const value = n === this.selectedStars() ? '' : String(STAR_THRESHOLDS[n - 1]);
    this.setFilter('rating', value);
  }

  setFilter(key: keyof GameFilters, value: string): void {
    const changes: Partial<Record<keyof GameFilters, string | null>> = { [key]: value || null };

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

  private navigate(changes: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...changes, page: null },
      queryParamsHandling: 'merge',
    });
  }
}
