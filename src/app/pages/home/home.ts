import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Navbar } from '../../components/navbar/navbar';
import { GameCarousel } from '../../components/game-carousel/game-carousel';
import { GamesService, HomeGamesResponse } from '../../services/games/games-service';
import { IgdbGame } from '../../models/game.model';

interface HomeSection {
  key: string;
  title: string;
  icon: string;
  games: IgdbGame[];
}

// Titolo e icona delle categorie note; le altre usano la chiave come titolo
const SECTION_META: Record<string, { title: string; icon: string }> = {
  trending_games: { title: 'Di tendenza',   icon: 'bi-fire' },
  most_played:    { title: 'Più giocati',   icon: 'bi-controller' },
  most_recent:    { title: 'Ultime uscite', icon: 'bi-calendar-event' },
};

@Component({
  imports: [Navbar, GameCarousel],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {
  private gamesService = inject(GamesService);

  sections = signal<HomeSection[]>([]);
  loading = signal(true);
  error = signal(false);

  constructor() {
    this.gamesService.getHomeGames().pipe(
      catchError(err => {
        console.error('Errore nel recupero dei giochi della home:', err);
        this.error.set(true);
        return of({} as HomeGamesResponse);
      }),
      takeUntilDestroyed()
    ).subscribe(res => {
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
