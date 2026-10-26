import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { GameCard } from './game-card/game-card';
import { GameList } from './game-list/game-list';

@Component({
  imports: [RouterOutlet, Navbar, GameCard, GameList],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('challenge');
  darkMode = true;
}
