import { Component, Input } from '@angular/core';
import { Game } from '../models/game.model';

@Component({
  selector: 'app-game-card',
  styleUrl: './game-card.scss',
  templateUrl: './game-card.html',
})
export class GameCard {
  @Input({ required: true })
  game!: Game;

  
}
