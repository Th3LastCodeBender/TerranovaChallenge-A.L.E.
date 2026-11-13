import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth/auth-service';
import { Navbar } from '../../components/navbar/navbar';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CollectionCounts, FavoritesService } from '../../services/favorites/favorites-service';

@Component({
  imports: [Navbar, DatePipe],
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

  ngOnInit(): void {
	this.favouriteService.getCounts().subscribe({
	  next: counts => this.counts.set(counts),
	  error: err => console.error('Errore nel recupero dati collezioni: ', err)
	});
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
}
