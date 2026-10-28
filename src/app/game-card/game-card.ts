import { Component, Input, Pipe } from '@angular/core';
import { Game } from '../models/game.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-game-card',
  imports: [DatePipe],
  styleUrl: './game-card.scss',
  templateUrl: './game-card.html',
})
export class GameCard {
  @Input({ required: true })
  game!: Game;
  
}
