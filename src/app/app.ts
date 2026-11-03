import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { GameCard } from './components/game-card/game-card';
import { GameList } from './components/game-list/game-list';

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
