
import { Game } from '../models/game.model';

export const MOCK_GAMES: Game[] = [
  {
    id: 1,
    slug: 'cyber-city-2077',
    name: 'Cyber City 2077',

    released: '2020-12-10',
    tba: false,

    background_image: 'https://placehold.co/800x450/17152c/ffffff?text=Cyber+City+2077',

    rating: 4.42,
    rating_top: 5,

    ratings: [
      {
        id: 5,
        title: 'exceptional',
        count: 3200,
        percent: 61.5
      },
      {
        id: 4,
        title: 'recommended',
        count: 1500,
        percent: 28.8
      }
    ],

    ratings_count: 5200,
    reviews_count: 5300,

    metacritic: 86,
    playtime: 64,

    platforms: [
      {
        platform: {
          id: 4,
          name: 'PC',
          slug: 'pc',
          image: null,
          year_start: null,
          year_end: null,
          games_count: 100000,
          image_background: null
        },
        released_at: '2020-12-10',
        requirements_en: {
          minimum: 'Intel Core i5, 8 GB RAM, GTX 1060',
          recommended: 'Intel Core i7, 16 GB RAM, RTX 3060'
        },
        requirements_ru: null
      },

      {
        platform: {
          id: 187,
          name: 'PlayStation 5',
          slug: 'playstation5',
          image: null,
          year_start: 2020,
          year_end: null,
          games_count: 1500,
          image_background: null
        },
        released_at: '2021-02-15',
        requirements_en: null,
        requirements_ru: null
      }
    ],

    parent_platforms: [
      {
        platform: {
          id: 1,
          name: 'PC',
          slug: 'pc'
        }
      },
      {
        platform: {
          id: 2,
          name: 'PlayStation',
          slug: 'playstation'
        }
      }
    ],

    genres: [
      {
        id: 1,
        name: 'Action',
        slug: 'action',
        games_count: 50000,
        image_background: null
      },
      {
        id: 2,
        name: 'RPG',
        slug: 'rpg',
        games_count: 30000,
        image_background: null
      }
    ],

    stores: [
      {
        id: 1,
        store: {
          id: 1,
          name: 'Steam',
          slug: 'steam',
          domain: 'store.steampowered.com',
          games_count: 100000,
          image_background: null
        }
      }
    ],

    tags: [
      {
        id: 1,
        name: 'Open World',
        slug: 'open-world',
        language: 'eng',
        games_count: 10000,
        image_background: null
      },
      {
        id: 2,
        name: 'Singleplayer',
        slug: 'singleplayer',
        language: 'eng',
        games_count: 20000,
        image_background: null
      }
    ],

    esrb_rating: {
      id: 4,
      name: 'Mature',
      slug: 'mature'
    },

    short_screenshots: [
      {
        id: 1,
        image: 'https://placehold.co/800x450/17152c/ffffff?text=Screenshot+1'
      },
      {
        id: 2,
        image: 'https://placehold.co/800x450/30194d/ffffff?text=Screenshot+2'
      }
    ]
  },

  // --------------------------------------------------

  {
    id: 2,
    slug: 'pixel-knight',
    name: 'Pixel Knight',

    released: '2024-04-12',
    tba: false,

    background_image: null,

    rating: 3.78,
    rating_top: 5,

    ratings: [
      {
        id: 4,
        title: 'recommended',
        count: 540,
        percent: 54
      },
      {
        id: 3,
        title: 'meh',
        count: 460,
        percent: 46
      }
    ],

    ratings_count: 1000,
    reviews_count: 1040,

    metacritic: null,
    playtime: 12,

    platforms: [
      {
        platform: {
          id: 4,
          name: 'PC',
          slug: 'pc',
          image: null,
          year_start: null,
          year_end: null,
          games_count: 100000,
          image_background: null
        },
        released_at: '2024-04-12',
        requirements_en: null,
        requirements_ru: null
      }
    ],

    parent_platforms: [
      {
        platform: {
          id: 1,
          name: 'PC',
          slug: 'pc'
        }
      }
    ],

    genres: [
      {
        id: 3,
        name: 'Indie',
        slug: 'indie',
        games_count: 20000,
        image_background: null
      }
    ],

    stores: [],

    tags: [],

    esrb_rating: null,

    short_screenshots: []
  },

  // --------------------------------------------------

  {
    id: 3,
    slug: 'galactic-racing',
    name: 'Galactic Racing',

    released: '2025-08-21',
    tba: false,

    background_image: 'https://placehold.co/800x450/0b2447/00ffff?text=Galactic+Racing',

    rating: 4.85,
    rating_top: 5,

    ratings: [
      {
        id: 5,
        title: 'exceptional',
        count: 850,
        percent: 85
      },
      {
        id: 4,
        title: 'recommended',
        count: 150,
        percent: 15
      }
    ],

    ratings_count: 1000,
    reviews_count: 1020,

    metacritic: 94,
    playtime: 32,

    platforms: [
      {
        platform: {
          id: 187,
          name: 'PlayStation 5',
          slug: 'playstation5',
          image: null,
          year_start: 2020,
          year_end: null,
          games_count: 1500,
          image_background: null
        },
        released_at: '2025-08-21',
        requirements_en: null,
        requirements_ru: null
      },

      {
        platform: {
          id: 186,
          name: 'Xbox Series S/X',
          slug: 'xbox-series-x',
          image: null,
          year_start: 2020,
          year_end: null,
          games_count: 1300,
          image_background: null
        },
        released_at: '2025-08-21',
        requirements_en: null,
        requirements_ru: null
      }
    ],

    parent_platforms: [
      {
        platform: {
          id: 2,
          name: 'PlayStation',
          slug: 'playstation'
        }
      },
      {
        platform: {
          id: 3,
          name: 'Xbox',
          slug: 'xbox'
        }
      }
    ],

    genres: [
      {
        id: 4,
        name: 'Racing',
        slug: 'racing',
        games_count: 8000,
        image_background: null
      }
    ],

    stores: [
      {
        id: 2,
        store: {
          id: 3,
          name: 'PlayStation Store',
          slug: 'playstation-store',
          domain: 'store.playstation.com',
          games_count: 8000,
          image_background: null
        }
      }
    ],

    tags: [
      {
        id: 3,
        name: 'Multiplayer',
        slug: 'multiplayer',
        language: 'eng',
        games_count: 40000,
        image_background: null
      }
    ],

    esrb_rating: {
      id: 2,
      name: 'Everyone',
      slug: 'everyone'
    },

    short_screenshots: [
      {
        id: 3,
        image: 'https://placehold.co/800x450/0b2447/00ffff?text=Race'
      }
    ]
  },

  // --------------------------------------------------

  {
    id: 4,
    slug: 'project-neon',
    name: 'Project Neon: The Last Horizon',

    released: null,
    tba: true,

    background_image: 'https://placehold.co/800x450/13001f/ff3cac?text=Project+Neon',

    rating: 0,
    rating_top: 5,

    ratings: [],

    ratings_count: 0,
    reviews_count: 0,

    metacritic: null,
    playtime: 0,

    platforms: [],

    parent_platforms: [],

    genres: [
      {
        id: 5,
        name: 'Adventure',
        slug: 'adventure',
        games_count: 25000,
        image_background: null
      }
    ],

    stores: [],

    tags: [
      {
        id: 4,
        name: 'Sci-fi',
        slug: 'sci-fi',
        language: 'eng',
        games_count: 5000,
        image_background: null
      }
    ],

    esrb_rating: null,

    short_screenshots: []
  }
];