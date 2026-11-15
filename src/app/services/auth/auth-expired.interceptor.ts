import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth-service';

// Su queste route il 401 vuol dire "credenziali o codice sbagliati", non "sessione scaduta"
const NOT_SESSION_401 = ['/api/auth/login', '/api/auth/me', '/api/security/mfa'];

// Se il backend risponde 401 mentre il frontend crede di essere loggato,
// la sessione sul server non c'è più (scaduta, logout da un'altra scheda, account eliminato):
// si toglie l'utente e si va al login
export const authExpiredInterceptor: HttpInterceptorFn = (req, next) => {
	const auth = inject(AuthService);
	const router = inject(Router);

	return next(req).pipe(
		catchError((err: unknown) => {
			if (err instanceof HttpErrorResponse && err.status === 401
				&& !NOT_SESSION_401.includes(req.url) && auth.isLoggedIn()) {
				auth.clearUser();
				router.navigate(['/login']);
			}
			return throwError(() => err);
		})
	);
};
