import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { GameList } from '../../components/game-list/game-list';

@Component({
  imports: [Navbar, GameList],
  selector: 'app-games-search',
  styleUrl: './games-search.scss',
  templateUrl: './games-search.html',
})
export class GamesSearch {}
