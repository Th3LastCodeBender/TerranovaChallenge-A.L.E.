import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

// Stessa chiave letta dallo script inline in index.html
const THEME_STORAGE_KEY = 'theme';

// Tema salvato in localStorage; se manca (o lo storage non è accessibile) si usa light
function readStoredTheme(): Theme {
	try {
		return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

@Injectable({
	providedIn: 'root'
})
export class ThemeService {
	isDarkMode = signal(readStoredTheme() === 'dark');

	constructor() {
		this.applyTheme();
	}

	changeTheme() {
		this.isDarkMode.update(v => !v);
		this.applyTheme();
		try {
			localStorage.setItem(THEME_STORAGE_KEY, this.currentTheme());
		} catch {
			// Storage non disponibile (es. navigazione privata): il tema vale solo per questa sessione
		}
	}

	private currentTheme(): Theme {
		return this.isDarkMode() ? 'dark' : 'light';
	}

	private applyTheme() {
		document.documentElement.setAttribute('data-bs-theme', this.currentTheme());
	}
}
