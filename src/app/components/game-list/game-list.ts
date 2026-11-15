import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { IgdbGame } from '../../models/game.model';
import { GameCard } from '../game-card/game-card';
import { GamesService } from '../../services/games/games-service';
import { GameFiltersBar } from '../game-filters/game-filters';
import { FILTER_KEYS, GameFilters } from '../../models/game-filters.model';
import { httpErrorMessage } from '../../utils/http-error-message';

@Component({
  imports: [GameCard, GameFiltersBar],
  selector: 'app-game-list',
  styleUrl: './game-list.scss',
  templateUrl: './game-list.html',
})
export class GameList {
  private gameService = inject(GamesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  games = signal<IgdbGame[]>([]);
  search = signal('');
  page = signal(1);
  hasMore = signal(false);
  loading = signal(false);
  // Messaggio da mostrare se il backend risponde con un errore (null = nessun errore)
  error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap.pipe(
      map(p => ({
        search: p.get('search')?.trim() ?? '',
        page: Math.max(1, Number(p.get('page')) || 1),
        filters: Object.fromEntries(
          FILTER_KEYS.map(key => [key, p.get(key) ?? undefined])
        ) as GameFilters,
      })),
      tap(({ search, page }) => {
        this.search.set(search);
        this.page.set(page);
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(({ search, page, filters }) =>
        // senza ricerca mostriamo tutti i giochi, paginati dal backend
        (search
          ? this.gameService.searchGames(search, page, filters)
          : this.gameService.getAllGames(page, filters)
        ).pipe(
          catchError(err => {
            console.error('Errore nel recupero dei games:', err);
            this.error.set(httpErrorMessage(err));
            return of({ results: [], hasMore: false });
          })
        )
      ),
      takeUntilDestroyed()
    ).subscribe(res => {
      this.games.set(res.results);
      this.hasMore.set(res.hasMore);
      this.loading.set(false);
    });
  }

  goToPage(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
}
