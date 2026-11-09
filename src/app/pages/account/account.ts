import { Component, inject,  } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth/auth-service';
import { Navbar } from '../../components/navbar/navbar';
import { Router } from '@angular/router';

@Component({
  imports: [Navbar, DatePipe],
  selector: 'app-account',
  styleUrl: './account.scss',
  templateUrl: './account.html',
})
export class Account {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  logout(): void {
		this.authService.logout().subscribe({
			complete: () => this.router.navigate(['/']),
			error: () => this.router.navigate(['/'])
		});
	}
}
