import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth/auth-service';
import { Navbar } from '../../components/navbar/navbar';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CollectionCounts, FavoritesService } from '../../services/favorites/favorites-service';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PcSpecs, SpecsService } from '../../services/specs/specs-service';

@Component({
  imports: [Navbar, DatePipe, RouterLink, ReactiveFormsModule],
  selector: 'app-account',
  styleUrl: './account.scss',
  templateUrl: './account.html',
})
export class Account implements OnInit {

  authService = inject(AuthService);
  private router = inject(Router);
  private favouriteService = inject(FavoritesService);
  counts = signal<CollectionCounts | null>(null);

  mfaEnabled = signal(this.authService.user?.mfa ?? false);
  mfaLoading = signal(false);
  mfaError = signal<string | null>(null);

  // Eliminazione account: il riquadro di conferma si apre solo dopo il primo click
  deleteOpen = signal(false);
  deleteLoading = signal(false);
  deleteError = signal<string | null>(null);

  private specsService = inject(SpecsService);
  private fb = inject(FormBuilder);

  specs = signal<PcSpecs | null>(null);
  specsLoading = signal(true);
  specsSaving = signal(false);
  specsEditing = signal(false);
  specsError = signal<string | null>(null);
  // Avviso se CPU/GPU non sono nel database dei benchmark (dopo il salvataggio)
  specsWarning = signal<string | null>(null);

  // Stessi limiti della validazione in /api/specs/add-specs
  specsForm = this.fb.group({
	cpu: ['', [Validators.required, Validators.maxLength(100)]],
	gpu: ['', [Validators.required, Validators.maxLength(100)]],
	ramGb: [null as number | null, [Validators.required, Validators.min(1), Validators.max(1024)]],
	vramGb: [null as number | null, [Validators.min(1), Validators.max(128)]],
	os: ['', [Validators.required, Validators.maxLength(100)]],
  });

  // Stessi limiti della validazione in /api/auth/delete-account
  deleteForm = this.fb.group({
	password: ['', [Validators.required, Validators.maxLength(128)]],
  });

  ngOnInit(): void {
	this.favouriteService.getCounts().subscribe({
	  next: counts => this.counts.set(counts),
	  error: err => console.error('Errore nel recupero dati collezioni: ', err)
	});

	this.specsService.getSpecs().subscribe({
	  next: specs => {
		this.specs.set(specs);
		this.specsLoading.set(false);
	  },
	  error: err => {
		console.error('Errore nel recupero delle specifiche: ', err);
		this.specsLoading.set(false);
		this.specsError.set('Impossibile caricare le specifiche del PC');
	  }
	});
  }

  // Apre il form precompilato con le specifiche attuali (vuoto se non ce ne sono)
  startEditSpecs(): void {
	const current = this.specs();
	this.specsForm.reset({
	  cpu: current?.cpu ?? '',
	  gpu: current?.gpu ?? '',
	  ramGb: current?.ramGb ?? null,
	  vramGb: current?.vramGb ?? null,
	  os: current?.os ?? '',
	});
	this.specsError.set(null);
	this.specsWarning.set(null);
	this.specsEditing.set(true);
  }

  cancelEditSpecs(): void {
	this.specsEditing.set(false);
	this.specsError.set(null);
  }

  // add-specs sovrascrive i dati esistenti: serve sia per aggiungere che per modificare
  saveSpecs(): void {
	if (this.specsForm.invalid) {
	  this.specsForm.markAllAsTouched();
	  return;
	}

	const value = this.specsForm.getRawValue();
	const payload: PcSpecs = {
	  cpu: value.cpu!.trim(),
	  gpu: value.gpu!.trim(),
	  ramGb: Number(value.ramGb),
	  os: value.os!.trim(),
	};
	// vramGb è opzionale: il backend rifiuta null, quindi lo mandiamo solo se compilato
	if (value.vramGb !== null && value.vramGb !== undefined && String(value.vramGb) !== '')
	  payload.vramGb = Number(value.vramGb);

	this.specsSaving.set(true);
	this.specsError.set(null);

	this.specsService.saveSpecs(payload).subscribe({
	  next: res => {
		this.specs.set(res.specs);
		this.specsSaving.set(false);
		this.specsEditing.set(false);

		const unknown = [
		  !res.recognized.cpu ? 'CPU' : null,
		  !res.recognized.gpu ? 'GPU' : null,
		].filter(Boolean);
		this.specsWarning.set(
		  unknown.length
			? `${unknown.join(' e ')} non riconosciut${unknown.length > 1 ? 'e' : 'a'}: la stima di compatibilità potrebbe essere meno precisa`
			: null
		);
	  },
	  error: (err: HttpErrorResponse) => {
		this.specsSaving.set(false);
		this.specsError.set(this.specsErrorMessage(err, 'Impossibile salvare le specifiche, riprova'));
	  }
	});
  }

  deleteSpecs(): void {
	this.specsSaving.set(true);
	this.specsError.set(null);

	this.specsService.deleteSpecs().subscribe({
	  next: () => {
		this.specs.set(null);
		this.specsWarning.set(null);
		this.specsSaving.set(false);
		this.specsEditing.set(false);
	  },
	  error: (err: HttpErrorResponse) => {
		this.specsSaving.set(false);
		this.specsError.set(this.specsErrorMessage(err, 'Impossibile eliminare le specifiche, riprova'));
	  }
	});
  }

  private specsErrorMessage(err: HttpErrorResponse, fallback: string): string {
	if (err.status === 429)
	  return 'Troppi tentativi, riprova tra qualche minuto';
	if (err.status === 400 && err.error?.error)
	  return `Dati non validi: ${err.error.error}`;
	return fallback;
  }

  toggle2fa(event: Event): void {
	const input = event.target as HTMLInputElement;
	const enable = !this.mfaEnabled();
	const request = enable ? this.authService.activate2fa() : this.authService.disable2fa();

	this.mfaLoading.set(true);
	this.mfaError.set(null);

	request.subscribe({
	  next: () => {
		this.mfaEnabled.set(enable);
		this.mfaLoading.set(false);
	  },
	  error: (err: HttpErrorResponse) => {
		this.mfaLoading.set(false);
		input.checked = this.mfaEnabled();
		this.mfaError.set(
		  err.status === 429
			? 'Troppi tentativi, riprova tra qualche minuto'
			: 'Impossibile aggiornare la 2FA, riprova'
		);
	  }
	});
  }

  logout(): void {
		this.authService.logout().subscribe({
			complete: () => this.router.navigate(['/']),
			error: () => this.router.navigate(['/'])
		});
	}

  openDeleteAccount(): void {
	this.deleteForm.reset();
	this.deleteError.set(null);
	this.deleteOpen.set(true);
  }

  cancelDeleteAccount(): void {
	this.deleteOpen.set(false);
	this.deleteError.set(null);
	this.deleteForm.reset();
  }

  confirmDeleteAccount(): void {
	if (this.deleteForm.invalid) {
	  this.deleteForm.markAllAsTouched();
	  return;
	}

	this.deleteLoading.set(true);
	this.deleteError.set(null);

	this.authService.deleteAccount(this.deleteForm.getRawValue().password!).subscribe({
	  next: () => this.router.navigate(['/']),
	  error: (err: HttpErrorResponse) => {
		this.deleteLoading.set(false);
		this.deleteError.set(this.deleteErrorMessage(err));
	  }
	});
  }

  private deleteErrorMessage(err: HttpErrorResponse): string {
	switch (err.status) {
	  case 403: return 'Password errata';
	  case 429: return 'Troppi tentativi, riprova tra qualche minuto';
	  default: return 'Impossibile eliminare l\'account, riprova';
	}
  }
}
