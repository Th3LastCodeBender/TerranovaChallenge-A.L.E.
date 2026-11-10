import {
    Component,
    computed,
    inject,
    signal
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IgdbGame } from '../../models/game.model';
import { igdbImageUrl } from '../../models/image.model';
import {
    PlatformFamily,
    platformFamily
} from '../../models/platform.model';
import { GameCard } from '../../components/game-card/game-card';
import { GamesService } from '../../services/games/games-service';

@Component({
    imports: [GameCard, DatePipe, DecimalPipe],
    selector: 'app-game-details',
    styleUrl: './game-details.scss',
    templateUrl: './game-details.html',
})
export class GameDetails {
    private route = inject(ActivatedRoute);
    private gamesService = inject(GamesService);

    game = signal<IgdbGame | null>(null);

    isFavourite = signal(false);
    collectionStatus = signal<string | null>(null);

    isLoading = signal(true);
    errorMessage = signal<string | null>(null);

    coverUrl = computed(() => {
        const cover = this.game()?.cover;

        return cover
            ? igdbImageUrl(cover.image_id, 'cover_big')
            : null;
    });

    backgroundUrl = computed(() => {
        const currentGame = this.game();

        const image =
            currentGame?.artworks?.[0] ??
            currentGame?.screenshots?.[0];

        return image
            ? igdbImageUrl(image.image_id, 'screenshot_big')
            : null;
    });

    screenshotUrls = computed(() => {
        return (this.game()?.screenshots ?? []).map(image =>
            igdbImageUrl(image.image_id, 'screenshot_big')
        );
    });

    rating = computed(() => {
        const currentGame = this.game();

        if (!currentGame) {
            return null;
        }

        const score =
            currentGame.total_rating ??
            currentGame.rating;

        return score !== undefined
            ? score / 20
            : null;
    });

    criticScore = computed(() =>
        this.game()?.aggregated_rating ?? null
    );

    releaseDate = computed(() => {
        const timestamp = this.game()?.first_release_date;

        return timestamp
            ? new Date(timestamp * 1000)
            : null;
    });

    isAnnounced = computed(() =>
        !this.releaseDate() &&
        !!this.game()?.release_dates?.some(
            release =>
                release.human?.toUpperCase() === 'TBD'
        )
    );

    platformFamilies = computed(() => {
        const families = new Set<PlatformFamily>();

        for (const platform of this.game()?.platforms ?? []) {
            const family = platformFamily(platform);

            if (family) {
                families.add(family);
            }
        }

        return [...families];
    });

    constructor() {
        this.route.paramMap.subscribe(params => {
            const slug = params.get('slug');

            if (!slug) {
                this.isLoading.set(false);
                this.errorMessage.set('Game not found');
                return;
            }

            this.loadGame(slug);
        });
    }

    private loadGame(slug: string): void {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.game.set(null);

        this.gamesService.getGameBySlug(slug).subscribe({
            next: response => {
                this.game.set(response.game);

                this.isFavourite.set(
                    response.userData.isFavourite
                );

                this.collectionStatus.set(
                    response.userData.collectionStatus
                );

                this.isLoading.set(false);
            },

            error: error => {
                console.error(
                    'Error loading game details:',
                    error
                );

                this.game.set(null);
                this.isFavourite.set(false);
                this.collectionStatus.set(null);
                this.isLoading.set(false);

                if (error.status === 404) {
                    this.errorMessage.set('Game not found');
                } else {
                    this.errorMessage.set(
                        'Unable to load the game'
                    );
                }
            }
        });
    }
}