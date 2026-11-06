import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  imports: [RouterLink],
  selector: 'app-navbar',
  styleUrl: './navbar.scss',
  templateUrl: './navbar.html',
})

export class Navbar {
  visibile = signal(false);
  isDarkMode = signal(true);
  user = inject(AuthService);
  router = inject(Router);

  logout() {
    this.user.logout();
  }

  changeTheme() {
    this.isDarkMode.update(v => !v);
    document.documentElement.setAttribute('data-bs-theme', this.isDarkMode() ? 'dark' : 'light');
  }

  protected changeVisibility () {
    this.visibile.update(v => !v);
  }
}
