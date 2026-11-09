
import { inject, Injectable } from '@angular/core';
import { User } from '../../models/user.model';
import { map, tap, Observable, finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Campi che il backend si aspetta in POST /api/auth/signup
export interface RegisterData {
	name: string;
	surname: string;
	email: string;
	username: string;
	password: string;
}

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private http = inject(HttpClient);
	user: User | null = this.loadUser();

	login(email: string, password: string): Observable<User> {
		return (this.http.post<User>('/api/auth/login', { email, password }).pipe(
			map(res => this.toUser(res)),
			tap(user => this.setUser(user))
		));
	}

	// Dopo la registrazione il backend imposta già il cookie: l'utente è loggato
	register(data: RegisterData): Observable<User> {
		return this.http.post<User>('/api/auth/signup', data).pipe(
			map(res => this.toUser(res)),
			tap(user => this.setUser(user))
		);
	}

	private toUser(u: User): User {
		return {
			id: u.id,
			username: u.username,
			email: u.email,
			firstName: u.firstName,
			lastName: u.lastName,
			createdAt: new Date(u.createdAt)
		};
	}

	setUser(user: User): void {
		this.user = user;
		sessionStorage.setItem('user', JSON.stringify(user));
	}

	getUser(): User | null {
		return this.user;
	}

	isLoggedIn(): boolean {
		return this.user !== null;
	}

	logout(): Observable<unknown> {
		return this.http
			.post('/api/auth/logout', {})
			.pipe(finalize(() => {          // pulisce il browser sia se va bene sia se va male
				this.user = null;
				sessionStorage.removeItem('user');
			}));
	}

	private loadUser(): User | null {
		const user = sessionStorage.getItem('user');
		if (!user)
			return null;
		return JSON.parse(user);
	}
}
