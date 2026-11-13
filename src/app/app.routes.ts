
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Account } from './pages/account/account';
import { GameDetails } from './pages/game-details/game-details';
import { GamesSearch } from './pages/games-search/games-search';
import { Register } from './pages/register/register';
import { loginCheck, authCheck, mfaPendingCheck, collectionTypeCheck } from './loggedCheck';
import { VerifyOtp } from './pages/verify-otp/verify-otp';
import { Collections } from './pages/collections/collections';

export const routes: Routes = [
	{
		path: 'games/:slug',
		loadComponent: () =>
			import('./pages/game-details/game-details')
			.then(component => component.GameDetails)
	},
	{
		path: '',
		component: Home
	},
	{
		path: 'login/verify',
		component: VerifyOtp,
		canActivate: [mfaPendingCheck]
	},
	{
		path: 'login',
		component: Login,
		canActivate: [loginCheck]
	},
	{
		path: 'me',
		component: Account,
		canActivate: [authCheck]
	},
	{
		path: 'games',
		component: GamesSearch
	},
	{
		path: 'register',
		component: Register,
		canActivate: [loginCheck]
	},
	{
		path: 'collections/:type',
		component: Collections,
		canActivate: [authCheck, collectionTypeCheck],
		// children: {}
	}

];
