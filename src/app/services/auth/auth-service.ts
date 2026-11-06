import { Service, Injectable } from '@angular/core';
import { User } from '../../models/user.model';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	user: User | null = this.loadUser();

	setUser(user: User): void {
		this.user = user;
		sessionStorage.setItem('user', JSON.stringify(user));
	}

	getUser(): User {
		return this.getUser();
	}

	isLoggedIn(): boolean {
		return this.user !== null;
	}

	logout() {
		this.user = null;
		sessionStorage.removeItem('user');
	}

	private loadUser(): User | null {
		const user = sessionStorage.getItem('user');
		if (!user)
			return null;
		return JSON.parse(user);
	}
}
