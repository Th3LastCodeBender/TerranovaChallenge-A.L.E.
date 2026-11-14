
import {
	afterNextRender,
	Component,
	computed,
	DestroyRef,
	ElementRef,
	inject,
	input,
	model,
	signal,
	viewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import {
	COLLECTIONS,
	CollectionsService,
	CollectionStatus
} from '../../services/collections/collections-service';

@Component({
	selector: 'app-collection-button',
	styleUrl: './collection-button.scss',
	templateUrl: './collection-button.html',
	host: {
		'(document:click)': 'onDocumentClick($event)',
		'(document:keydown.escape)': 'close()',
		// Il menu è fixed: se la pagina scorre o si ridimensiona non sarebbe più allineato
		'(window:scroll)': 'close()',
		'(window:resize)': 'close()',
	},
})
export class CollectionButton {
	private collectionsService = inject(CollectionsService);
	private auth = inject(AuthService);
	private router = inject(Router);
	private host = inject(ElementRef<HTMLElement>);

	// Un solo menu aperto alla volta (lo stopPropagation impedisce al document:click
	// di chiudere il menu di un'altra card)
	private static openInstance: CollectionButton | null = null;

	gameId = input.required<number>();
	status = model<CollectionStatus | null>(null);   // two-way: [(status)]
	variant = input<'full' | 'icon'>('full');        // 'icon' = quadrato con + (game-card)

	open = signal(false);
	pending = signal(false);

	private trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
	private menu = viewChild.required<ElementRef<HTMLElement>>('menu');

	// Posizione del menu (position: fixed) calcolata dal bottone
	menuPosition = signal<Record<string, string>>({});
	private static readonly MENU_HEIGHT = 240;   // stima con 4 voci + "Remove"

	// Voci del menu ricavate da COLLECTIONS (esclusi i preferiti, che hanno il loro bottone)
	options = Object.values(COLLECTIONS)
		.filter((c): c is typeof c & { status: CollectionStatus } => c.status !== null)
		.map(c => ({ status: c.status, title: c.title }));

	currentTitle = computed(() =>
		this.options.find(o => o.status === this.status())?.title ?? null
	);

	constructor() {
		// Il menu viene spostato in <body>: così overflow: hidden e transform degli
		// antenati (es. .custom-card in hover, .game-hero) non lo tagliano né lo spostano
		afterNextRender(() => document.body.appendChild(this.menu().nativeElement));
		inject(DestroyRef).onDestroy(() => this.menu().nativeElement.remove());
	}

	toggleMenu(event: Event): void {
		// Evita che il click arrivi alla game-card (che aprirebbe la pagina del gioco)
		event.stopPropagation();
		event.preventDefault();

		if (!this.auth.isLoggedIn()) {
			this.router.navigate(['/login']);
			return;
		}
		if (this.open()) {
			this.close();
			return;
		}
		CollectionButton.openInstance?.close();
		this.menuPosition.set(this.computeMenuPosition());
		this.open.set(true);
		CollectionButton.openInstance = this;
	}

	// Apre sotto il bottone, oppure sopra se in basso non c'è abbastanza spazio
	private computeMenuPosition(): Record<string, string> {
		const rect = this.trigger().nativeElement.getBoundingClientRect();
		const gap = 6;
		const spaceBelow = window.innerHeight - rect.bottom;
		const openUp = spaceBelow < CollectionButton.MENU_HEIGHT && rect.top > spaceBelow;

		return {
			left: `${rect.left}px`,
			'min-width': `${rect.width}px`,
			...(openUp
				? { bottom: `${window.innerHeight - rect.top + gap}px` }
				: { top: `${rect.bottom + gap}px` }),
		};
	}

	close(): void {
		this.open.set(false);
		if (CollectionButton.openInstance === this)
			CollectionButton.openInstance = null;
	}

	onDocumentClick(event: MouseEvent): void {
		const target = event.target as Node;
		if (this.open()
			&& !this.host.nativeElement.contains(target)
			&& !this.menu().nativeElement.contains(target))
			this.close();
	}

	select(next: CollectionStatus | null): void {
		this.close();
		const previous = this.status();
		if (this.pending() || next === previous)
			return;

		this.status.set(next);   // aggiornamento ottimistico
		this.pending.set(true);

		const request = next === null
			? this.collectionsService.removeFromCollection(this.gameId())
			: this.collectionsService.setStatus(this.gameId(), next);

		request.subscribe({
			next: () => this.pending.set(false),
			error: err => {
				console.error('Errore aggiornamento collection:', err);
				this.status.set(previous);   // rollback
				this.pending.set(false);
			},
		});
	}
}
