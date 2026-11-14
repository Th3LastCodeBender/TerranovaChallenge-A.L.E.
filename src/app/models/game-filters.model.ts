// Filtri accettati da /api/games e /api/games/search/:title.
// I valori devono restare allineati con lib/igdb-api/filters.ts del backend.

export interface GameFilters {
    genre?: string;
    platform?: string;
    year?: string;
    rating?: string;
    aggregate_rating?: string;
    sort?: string;
    order?: string;
}

export const FILTER_KEYS: (keyof GameFilters)[] = ['genre', 'platform', 'year', 'rating', 'aggregate_rating', 'sort', 'order'];

export interface FilterOption {
    value: string;
    label: string;
}

export const GENRE_OPTIONS: FilterOption[] = [
    { value: 'adventure', label: 'Avventura' },
    { value: 'arcade', label: 'Arcade' },
    { value: 'card-and-board-game', label: 'Carte e giochi da tavolo' },
    { value: 'fighting', label: 'Picchiaduro' },
    { value: 'indie', label: 'Indie' },
    { value: 'moba', label: 'MOBA' },
    { value: 'music', label: 'Musicale' },
    { value: 'platform', label: 'Platform' },
    { value: 'point-and-click', label: 'Punta e clicca' },
    { value: 'puzzle', label: 'Puzzle' },
    { value: 'racing', label: 'Corse' },
    { value: 'real-time-strategy', label: 'Strategia in tempo reale' },
    { value: 'role-playing-rpg', label: 'GDR' },
    { value: 'shooter', label: 'Sparatutto' },
    { value: 'simulator', label: 'Simulazione' },
    { value: 'sport', label: 'Sport' },
    { value: 'strategy', label: 'Strategia' },
    { value: 'tactical', label: 'Tattico' },
    { value: 'turn-based-strategy', label: 'Strategia a turni' },
    { value: 'visual-novel', label: 'Visual novel' },
];

// ID piattaforma IGDB
export const PLATFORM_OPTIONS: FilterOption[] = [
    { value: '6', label: 'PC' },
    { value: '167', label: 'PlayStation 5' },
    { value: '48', label: 'PlayStation 4' },
    { value: '169', label: 'Xbox Series X|S' },
    { value: '49', label: 'Xbox One' },
    { value: '508', label: 'Nintendo Switch 2' },
    { value: '130', label: 'Nintendo Switch' },
    { value: '39', label: 'iOS' },
    { value: '34', label: 'Android' },
];

// Voto giocatori in stelle: la stella n corrisponde a rating >= STAR_THRESHOLDS[n - 1].
// 5 stelle = 90 e non 100, perché quasi nessun gioco arriva a 100.
export const STAR_THRESHOLDS = [20, 40, 60, 80, 90];

export const RATING_OPTIONS: FilterOption[] = [
    { value: '90', label: '90+' },
    { value: '80', label: '80+' },
    { value: '70', label: '70+' },
    { value: '60', label: '60+' },
    { value: '50', label: '50+' },
];

export const SORT_OPTIONS: FilterOption[] = [
    { value: 'popularity', label: 'Popolarità' },
    { value: 'rating', label: 'Voto utenti' },
    { value: 'aggregated_rating', label: 'Voto critica' },
    { value: 'date', label: 'Data di uscita' },
    { value: 'name', label: 'Nome' },
];
