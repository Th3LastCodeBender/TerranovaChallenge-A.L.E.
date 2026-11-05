import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../models/user.model';
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

  login () {
    const user: User = {
      id: 1,
      username: "odoacr3e",
      email: "edoraccanello@gmail.com",
      name: "Edoardo",
      surname: "Raccanello"
    }
    this.changeVisibility();
    this.user.setUser(user);
    this.router.navigate(['/']);
  }

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
