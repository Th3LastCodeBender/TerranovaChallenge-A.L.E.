import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-navbar',
  styleUrl: './navbar.scss',
  templateUrl: './navbar.html',
})

export class Navbar {
  visibile = signal(false);
  isDarkMode = signal(true);

  changeTheme() {
    this.isDarkMode.update(v => !v);
    document.documentElement.setAttribute('data-bs-theme', this.isDarkMode() ? 'dark' : 'light');
  }

  protected changeVisibility () {
    this.visibile.update(v => !v);
  }
}
