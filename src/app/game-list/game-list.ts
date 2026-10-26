import { Component } from '@angular/core';
import { Game } from '../models/game.model';
import { GameCard } from '../game-card/game-card';
import { GAMES_MOCKUP } from '../mocks/game.mock';

@Component({
  imports: [GameCard],
  selector: 'app-game-list',
  styleUrl: './game-list.scss',
  templateUrl: './game-list.html',
})
export class GameList {
  games: Game[] = GAMES_MOCKUP;
}
