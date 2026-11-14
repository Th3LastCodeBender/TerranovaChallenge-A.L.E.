import { Component, computed, HostListener, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PcSpecs, SpecsService } from '../../services/specs/specs-service';
import {
	CanIRunResponse,
	CheckStatus,
	CompatService,
	HardwareModel,
	Resolution,
	RESOLUTIONS,
	Verdict,
} from '../../services/compat/compat-service';

// Una riga del confronto "Your PC" vs "Minimum"
interface CompareRow {
	label: string;
	have: string;
	need: string;
	status: CheckStatus;
	estimated: boolean;
}

const VERDICT_TEXT: Record<Verdict, { title: string; text: string; icon: string }> = {
	'recommended': { title: 'Yes, it runs great', text: 'Your PC meets the recommended requirements.', icon: 'bi-check-circle-fill' },
	'minimum': { title: 'Yes, it runs', text: 'Your PC meets the minimum requirements, but not the recommended ones.', icon: 'bi-check-circle' },
	'cannot-run': { title: 'Probably not', text: 'Your PC is below the minimum requirements.', icon: 'bi-x-circle-fill' },
	'unknown': { title: 'Hard to say', text: 'We could not compare some of your components with the requirements.', icon: 'bi-question-circle' },
};

@Component({
	selector: 'app-can-i-run',
	imports: [RouterLink],
	templateUrl: './can-i-run.html',
	styleUrl: './can-i-run.scss',
})
export class CanIRun {
	private specsService = inject(SpecsService);
	private compatService = inject(CompatService);

	gameId = input.required<number>();
	gameName = input<string | undefined>('');

	readonly resolutions = RESOLUTIONS;

	open = signal(false);
	resolution = signal<Resolution>('1080p');

	specs = signal<PcSpecs | null>(null);
	specsLoading = signal(false);

	result = signal<CanIRunResponse | null>(null);
	loading = signal(false);
	error = signal<string | null>(null);

	verdict = computed(() => {
		const res = this.result();
		return res ? { key: res.compat.verdict, ...VERDICT_TEXT[res.compat.verdict] } : null;
	});

	// Se il gioco non ha requisiti minimi su Steam ripieghiamo sui consigliati
	tierLabel = computed(() => this.result()?.requirements.minimum ? 'Minimum' : 'Recommended');

	rows = computed<CompareRow[]>(() => {
		const res = this.result();
		const specs = this.specs();
		if (!res || !specs)
			return [];

		const tier = res.requirements.minimum ?? res.requirements.recommended;
		const check = res.requirements.minimum ? res.compat.minimum : res.compat.recommended;
		if (!tier || !check)
			return [];

		const cpuNeed = this.models(tier.cpuModels)
			?? [tier.cpuCores ? `${tier.cpuCores} cores` : null, tier.cpuGhz ? `${tier.cpuGhz} GHz` : null]
				.filter(Boolean).join(' · ');

		return [
			{ label: 'CPU', have: specs.cpu, need: cpuNeed || '—', status: check.cpu.status, estimated: check.cpu.estimated },
			{ label: 'GPU', have: specs.gpu, need: this.models(tier.gpuModels) ?? '—', status: check.gpu.status, estimated: check.gpu.estimated },
			{ label: 'RAM', have: `${specs.ramGb} GB`, need: tier.ramGb ? `${tier.ramGb} GB` : '—', status: check.ramGb.status, estimated: false },
			{ label: 'VRAM', have: specs.vramGb ? `${specs.vramGb} GB` : '—', need: tier.vramGb ? `${tier.vramGb} GB` : '—', status: check.vramGb.status, estimated: false },
			{
				label: 'OS',
				have: specs.os,
				need: tier.os ?? '—',
				// Il backend segnala l'OS solo con osWarning (niente "pass" esplicito)
				status: res.compat.osWarning ? 'fail' : (tier.os ? 'pass' : 'unknown'),
				estimated: false,
			},
		];
	});

	// Stime FPS dei quattro preset per la risoluzione scelta
	fpsCells = computed(() =>
		(this.result()?.fps?.cells ?? []).filter(cell => cell.resolution === this.resolution())
	);

	openModal(): void {
		this.open.set(true);
		this.error.set(null);
		this.loadSpecs();
	}

	@HostListener('document:keydown.escape')
	closeModal(): void {
		this.open.set(false);
	}

	selectResolution(resolution: Resolution): void {
		if (resolution === this.resolution() || this.loading())
			return;
		this.resolution.set(resolution);
		this.check();
	}

	// Ricarichiamo le specifiche a ogni apertura: l'utente potrebbe averle cambiate dall'account
	private loadSpecs(): void {
		this.specsLoading.set(true);
		this.specsService.getSpecs().subscribe({
			next: specs => {
				this.specs.set(specs);
				this.specsLoading.set(false);
				if (specs)
					this.check();
			},
			error: () => {
				this.specsLoading.set(false);
				this.error.set('Unable to load your PC specs, try again');
			}
		});
	}

	private check(): void {
		this.loading.set(true);
		this.error.set(null);

		this.compatService.canIRun(this.gameId(), this.resolution()).subscribe({
			next: res => {
				this.result.set(res);
				this.loading.set(false);
			},
			error: (err: HttpErrorResponse) => {
				this.loading.set(false);
				this.result.set(null);
				this.error.set(this.errorMessage(err));
			}
		});
	}

	private models(list: HardwareModel[]): string | null {
		return list.length ? list.map(m => m.original).join(' / ') : null;
	}

	// null = nessun messaggio: il template mostra già lo stato "nessuna specifica"
	private errorMessage(err: HttpErrorResponse): string | null {
		const backend: string | undefined = err.error?.error;

		if (err.status === 400 && backend === 'No PC specs saved') {
			this.specs.set(null);
			return null;
		}
		if (err.status === 404 && backend === 'Game not available on Steam')
			return 'This game is not available on Steam, so we cannot check its requirements';
		if (err.status === 404)
			return 'No system requirements found for this game';
		if (err.status === 429)
			return 'Too many requests, try again in a few minutes';
		return 'Unable to check the requirements right now, try again';
	}
}
