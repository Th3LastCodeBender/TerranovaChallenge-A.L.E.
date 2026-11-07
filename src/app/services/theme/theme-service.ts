import { Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class ThemeService {
	isDarkMode = signal(true);

	changeTheme() {
		this.isDarkMode.update(v => !v);
		document.documentElement.setAttribute(
			'data-bs-theme', 
			this.isDarkMode() ? 'dark' : 'light');
	}
}
