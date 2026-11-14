import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, switchMap, tap } from 'rxjs';
import { IgdbGame } from '../../models/game.model';
import { GameCard } from '../../components/game-card/game-card';
import { COLLECTIONS, CollectionSlug, CollectionsService } from '../../services/collections/collections-service';

@Component({
  imports: [GameCard],
  selector: 'app-collections',
  styleUrl: './collections.scss',
  templateUrl: './collections.html',
})
export class Collections {
	private collectionsService = inject(CollectionsService);
	private route = inject(ActivatedRoute);
	private router = inject(Router);

	slug = signal<CollectionSlug>('finished');
	page = signal(1);
	games = signal<IgdbGame[]>([]);
	total = signal(0);
	loading = signal(false);
	error = signal<string | null>(null);

	title = computed(() => COLLECTIONS[this.slug()].title);
	totalPages = computed(() => Math.max(1, Math.ceil(this.total() / 20)));

	constructor() {
		combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(
		map(([params, query]) => ({
			slug: params.get('type') as CollectionSlug, // già validato dal guard
			page: Math.max(1, Number(query.get('page')) || 1),
		})),
		tap(({ slug, page }) => {
			this.slug.set(slug);
			this.page.set(page);
			this.loading.set(true);
			this.error.set(null);
		}),
		switchMap(({ slug, page }) =>
			this.collectionsService.getCollection(slug, page).pipe(
			catchError(err => {
				console.error('Errore nel recupero della collezione:', err);
				this.error.set(err.status === 429
				? 'Troppe richieste, riprova tra poco'
				: 'Impossibile caricare la collezione');
				return of({ games: [], total: 0 });
			})
			)
		),
		takeUntilDestroyed()
		).subscribe(res => {
		this.games.set(res.games);
		this.total.set(res.total);
		this.loading.set(false);
		});
	}

	goToPage(page: number): void {
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { page },
			queryParamsHandling: 'merge',
			replaceUrl: true
		});
	}
}
