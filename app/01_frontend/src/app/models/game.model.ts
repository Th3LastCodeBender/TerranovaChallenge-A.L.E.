import { IgdbImage, IgdbVideo } from './image.model';

import {
    IgdbGenre,
    IgdbTheme,
    IgdbGameMode,
    IgdbPlayerPerspective,
    IgdbKeyword,
    IgdbFranchise,
    IgdbCollection,
    IgdbGameType
} from './classification.model';

import { IgdbPlatform } from './platform.model';
import { IgdbInvolvedCompany } from './company.model';
import { IgdbReleaseDate } from './release.model';
import { IgdbWebsite } from './website.model';

export interface IgdbGame {
    id: number;

    name?: string;
    slug?: string;
    url?: string;

    summary?: string;
    storyline?: string;

    cover?: IgdbImage;
    artworks?: IgdbImage[];
    screenshots?: IgdbImage[];
    videos?: IgdbVideo[];

    first_release_date?: number;
    release_dates?: IgdbReleaseDate[];

    genres?: IgdbGenre[];
    themes?: IgdbTheme[];
    game_modes?: IgdbGameMode[];
    player_perspectives?: IgdbPlayerPerspective[];
    keywords?: IgdbKeyword[];
    platforms?: IgdbPlatform[];
    game_type?: IgdbGameType;

    franchises?: IgdbFranchise[];
    collections?: IgdbCollection[];

    involved_companies?: IgdbInvolvedCompany[];

    websites?: IgdbWebsite[];

    rating?: number;
    rating_count?: number;

    aggregated_rating?: number;
    aggregated_rating_count?: number;

    total_rating?: number;
    total_rating_count?: number;

    hypes?: number;

    similar_games?: IgdbGame[];
    dlcs?: IgdbGame[];
    expansions?: IgdbGame[];
    parent_game?: IgdbGame;
}