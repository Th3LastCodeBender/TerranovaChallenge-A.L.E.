import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth-service';

const NOT_SESSION_401 = ['/api/auth/login', '/api/auth/me', '/api/security/mfa'];

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
