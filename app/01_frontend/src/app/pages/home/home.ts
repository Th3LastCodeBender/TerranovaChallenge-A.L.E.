import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { Navbar } from '../../components/navbar/navbar';
import { GameCarousel } from '../../components/game-carousel/game-carousel';
import { GamesService, HomeGamesResponse } from '../../services/games/games-service';
import { AuthService } from '../../services/auth/auth-service';
import { IgdbGame } from '../../models/game.model';

interface HomeSection {
  key: string;
  title: string;
  icon: string;
  games: IgdbGame[];
}

const SECTION_META: Record<string, { title: string; icon: string }> = {
  suggested:      { title: 'Consigliati per te', icon: 'bi-stars' },
  trending_games: { title: 'Di tendenza',        icon: 'bi-fire' },
  most_played:    { title: 'Più giocati',        icon: 'bi-controller' },
  most_recent:    { title: 'Ultime uscite',      icon: 'bi-calendar-event' },
};

@Component({
  imports: [Navbar, GameCarousel],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private gamesService = inject(GamesService);
  private authService = inject(AuthService);

  sections = signal<HomeSection[]>([]);
  loading = signal(true);
  error = signal(false);

  constructor() {
    const home$ = this.gamesService.getHomeGames().pipe(
      catchError(err => {
        console.error('Errore nel recupero dei giochi della home:', err);
        this.error.set(true);
        return of({} as HomeGamesResponse);
      })
    );

    const suggested$ = this.authService.isLoggedIn()
      ? this.gamesService.getSuggestedGames().pipe(
          catchError(err => {
            console.error('Errore nel recupero dei giochi consigliati:', err);
            return of([] as IgdbGame[]);
          })
        )
      : of([] as IgdbGame[]);

    forkJoin([home$, suggested$]).pipe(
      takeUntilDestroyed()
    ).subscribe(([home, suggested]) => {
      const res: HomeGamesResponse = { suggested, ...home };
      this.sections.set(
        Object.entries(res)
          .filter(([, games]) => Array.isArray(games) && games.length > 0)
          .map(([key, games]) => ({
            key,
            games,
            title: SECTION_META[key]?.title ?? key.replace(/_/g, ' '),
            icon: SECTION_META[key]?.icon ?? 'bi-collection',
          }))
      );
      this.loading.set(false);
    });
  }
}
