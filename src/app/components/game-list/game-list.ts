import { Component, inject, OnInit, signal } from '@angular/core';
import { IgdbGame } from '../../models/game.model';
import { GameCard } from '../game-card/game-card';
import { Games } from '../../services/games/games';

@Component({
  imports: [GameCard],
  selector: 'app-game-list',
  styleUrl: './game-list.scss',
  templateUrl: './game-list.html',
})
export class GameList implements OnInit {
  private gameService = inject(Games);

  games = signal<IgdbGame[]>([]);

  ngOnInit(): void {
    this.gameService.getGameByName('Minecraft').subscribe({
      next: (games) => {
        console.log('RISPOSTA BACKEND:', games);

        this.games.set(games);

        console.log('this.games:', this.games());
      },
      error: (error) => {
        console.error('Errore nel recupero dei games:', error);
      }
    });
  }
}
