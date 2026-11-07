import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { ThemeService } from '../../services/theme/theme-service';


@Component({
  imports: [RouterLink],
  selector: 'app-navbar',
  styleUrl: './navbar.scss',
  templateUrl: './navbar.html',
})

export class Navbar {
  visibile = signal(false);
  themeService = inject(ThemeService);
  authService = inject(AuthService);
  router = inject(Router);

  changeTheme() {
    this.themeService.changeTheme();
  }

  logout() {
    this.authService.logout();
  }

  protected changeVisibility () {
    this.visibile.update(v => !v);
  }
}
