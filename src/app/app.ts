import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { GameCard } from './game-card/game-card';

@Component({
  imports: [RouterOutlet, Navbar, GameCard],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('challenge');
  darkMode = true;
}
