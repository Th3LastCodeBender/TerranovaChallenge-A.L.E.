import { Component } from '@angular/core';
import { GameList } from '../../components/game-list/game-list';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  imports: [GameList, Navbar],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home {}
