
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Account } from './pages/account/account';
import { GameDetails } from './pages/game-details/game-details';
import { GamesSearch } from './pages/games-search/games-search';
import { Register } from './pages/register/register';
import { loginCheck, authCheck } from './loggedCheck';

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
	}
];
