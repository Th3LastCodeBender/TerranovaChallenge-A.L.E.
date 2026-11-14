import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { GENRE_OPTIONS } from '../../models/game-filters.model';

@Component({
  imports: [Navbar, RouterLink],
  selector: 'app-genres',
  styleUrl: './genres.scss',
  templateUrl: './genres.html',
})
export class Genres {
  // Stessa lista del filtro di /games, cosi le due pagine restano allineate
  readonly genres = GENRE_OPTIONS;
}
