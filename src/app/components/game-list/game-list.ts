import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { IgdbGame } from '../../models/game.model';
import { GameCard } from '../game-card/game-card';
import { GamesService } from '../../services/games/games-service';

@Component({
  imports: [GameCard],
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

  constructor() {
    this.route.queryParamMap.pipe(
      map(p => ({
        search: p.get('search')?.trim() ?? '',
        page: Math.max(1, Number(p.get('page')) || 1),
      })),
      tap(({ search, page }) => {
        this.search.set(search);
        this.page.set(page);
        this.loading.set(true);
      }),
      switchMap(({ search, page }) =>
        !search
          ? of({ results: [], hasMore: false })
          : this.gameService.searchGames(search, page).pipe(
              catchError(err => {
                console.error('Errore nel recupero dei games:', err);
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
