
import { inject, Injectable } from '@angular/core';
import { User } from '../../models/user.model';
import { map, tap, Observable, finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UrlSegment } from '@angular/router';

// Campi che il backend si aspetta in POST /api/auth/signup
export interface RegisterData {
	name: string;
	surname: string;
	email: string;
	username: string;
	password: string;
}

export type LoginResult = | { status: 'logged'; user: User } | { status: 'mfa-required' };
type LoginResponse = User | { requires2fa: true };
const MFA_PENDING = 'mfaPending';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private http = inject(HttpClient);
	user: User | null = this.loadUser();

	login(email: string, password: string): Observable<LoginResult> {
		return (this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
			map((res): LoginResult => {
				if ('requires2fa' in res && res.requires2fa) {
					sessionStorage.setItem(MFA_PENDING, '1');
					return { status: 'mfa-required' };
				}
				const user = this.toUser(res as User);
				this.setUser(user);
				return { status: 'logged', user };
			})
		));
	}

	verifyOtp(otp: string): Observable<User> {
		return this.http.post<User>('/api/security/mfa', { otp }).pipe(
			map(res => this.toUser(res)),
			tap(user => {
				this.setUser(user);
				this.clearMfaPending()
			})
		)
	}

	isMfaPending(): boolean {
		return sessionStorage.getItem(MFA_PENDING) === '1';
	}

	clearMfaPending(): void {
		sessionStorage.removeItem(MFA_PENDING);
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
			createdAt: new Date(u.createdAt),
			mfa: u.mfa ?? false
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
			.pipe(finalize(() => {
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

	activate2fa(): Observable<unknown> {
		return this.http.post('/api/security/mfa/enable', {}).pipe(
			tap(() => this.setMfa(true))
		);
	}

	disable2fa(): Observable<unknown> {
		return this.http.delete('/api/security/mfa/disable').pipe(
			tap(() => this.setMfa(false))
		);
	}

	// Aggiorna lo stato 2FA dell'utente salvato (memoria + sessionStorage)
	private setMfa(enabled: boolean): void {
		if (this.user)
			this.setUser({ ...this.user, mfa: enabled });
	}
}
