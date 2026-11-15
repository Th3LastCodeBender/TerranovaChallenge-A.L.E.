
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
		'(window:scroll)': 'close()',
		'(window:resize)': 'close()',
	},
})
export class CollectionButton {
	private collectionsService = inject(CollectionsService);
	private auth = inject(AuthService);
	private router = inject(Router);
	private host = inject(ElementRef<HTMLElement>);

	private static openInstance: CollectionButton | null = null;

	gameId = input.required<number>();
	status = model<CollectionStatus | null>(null);
	variant = input<'full' | 'icon'>('full');

	open = signal(false);
	pending = signal(false);

	private trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
	private menu = viewChild.required<ElementRef<HTMLElement>>('menu');

	menuPosition = signal<Record<string, string>>({});
	private static readonly MENU_HEIGHT = 240;

	options = Object.values(COLLECTIONS)
		.filter((c): c is typeof c & { status: CollectionStatus } => c.status !== null)
		.map(c => ({ status: c.status, title: c.title }));

	currentTitle = computed(() =>
		this.options.find(o => o.status === this.status())?.title ?? null
	);

	constructor() {
		afterNextRender(() => document.body.appendChild(this.menu().nativeElement));
		inject(DestroyRef).onDestroy(() => this.menu().nativeElement.remove());
	}

	toggleMenu(event: Event): void {
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

		this.status.set(next);
		this.pending.set(true);

		const request = next === null
			? this.collectionsService.removeFromCollection(this.gameId())
			: this.collectionsService.setStatus(this.gameId(), next);

		request.subscribe({
			next: () => this.pending.set(false),
			error: err => {
				console.error('Errore aggiornamento collection:', err);
				this.status.set(previous);
				this.pending.set(false);
			},
		});
	}
}
