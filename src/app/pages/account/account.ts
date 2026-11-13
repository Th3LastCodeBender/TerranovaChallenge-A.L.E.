import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth/auth-service';
import { Navbar } from '../../components/navbar/navbar';
import { Router } from '@angular/router';
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

  ngOnInit(): void {
    this.favouriteService.getCounts().subscribe({
      next: counts => this.counts.set(counts),
      error: err => console.error('Errore nel recupero dati collezioni: ', err)
    });
  }

  logout(): void {
		this.authService.logout().subscribe({
			complete: () => this.router.navigate(['/']),
			error: () => this.router.navigate(['/'])
		});
	}
}
