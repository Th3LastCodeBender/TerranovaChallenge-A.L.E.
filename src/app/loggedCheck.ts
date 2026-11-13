
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./services/auth/auth-service";

export const loginCheck: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);

	if (auth.isLoggedIn()) {
		return router.createUrlTree(['/']);
	}
	return true;
}

export const authCheck: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);

	if (!auth.isLoggedIn())
		return router.createUrlTree(['/login']);
	return true;
}

export const mfaPendingCheck: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);

	if (auth.isLoggedIn())
		return router.createUrlTree(['/']);
	if (!auth.isMfaPending())
		return router.createUrlTree(['/login']);
	return true;
}
