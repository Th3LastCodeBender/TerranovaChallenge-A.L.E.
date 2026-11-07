
import { IgdbGame } from '../models/game.model';

export const GAMES_MOCKUP: IgdbGame[] = [
  {
    id: 1,
    slug: 'cyber-city-2077',
    name: 'Cyber City 2077',
    first_release_date: 1607558400, // 2020-12-10
    rating: 88.4,                   // ex 4.42 / 5
    rating_count: 5200,
    aggregated_rating: 86,          // ex metacritic
    platforms: [
      { id: 6, name: 'PC (Microsoft Windows)', abbreviation: 'PC', slug: 'win' },
      { id: 167, name: 'PlayStation 5', abbreviation: 'PS5', slug: 'ps5' },
    ],
    genres: [
      { id: 12, name: 'Role-playing (RPG)', slug: 'role-playing-rpg' },
      { id: 31, name: 'Adventure', slug: 'adventure' },
    ],
    themes: [{ id: 38, name: 'Open world', slug: 'open-world' }],
    game_modes: [{ id: 1, name: 'Single player', slug: 'single-player' }],
  },
  {
    id: 2,
    slug: 'pixel-knight',
    name: 'Pixel Knight',
    first_release_date: 1712880000, // 2024-04-12
    rating: 75.6,                   // ex 3.78 / 5
    platforms: [
      { id: 6, name: 'PC (Microsoft Windows)', abbreviation: 'PC', slug: 'win' },
    ],
    genres: [{ id: 32, name: 'Indie', slug: 'indie' }],
  },
  {
    id: 3,
    slug: 'galactic-racing',
    name: 'Galactic Racing',
    first_release_date: 1755734400, // 2025-08-21
    rating: 97,                     // ex 4.85 / 5
    aggregated_rating: 94,          // ex metacritic
    platforms: [
      { id: 167, name: 'PlayStation 5', abbreviation: 'PS5', slug: 'ps5' },
      { id: 169, name: 'Xbox Series X|S', abbreviation: 'Series X|S', slug: 'series-x-s' },
    ],
    genres: [{ id: 10, name: 'Racing', slug: 'racing' }],
    game_modes: [{ id: 2, name: 'Multiplayer', slug: 'multiplayer' }],
  },
  {
    id: 4,
    slug: 'project-neon',
    name: 'Project Neon: The Last Horizon',
    // nessuna first_release_date + release "TBD" = ex tba: true
    release_dates: [{ id: 1, human: 'TBD' }],
    platforms: [],
    genres: [{ id: 31, name: 'Adventure', slug: 'adventure' }],
    themes: [{ id: 18, name: 'Science fiction', slug: 'science-fiction' }],
  },
];