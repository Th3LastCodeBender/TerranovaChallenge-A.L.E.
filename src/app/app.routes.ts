import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Account } from './pages/account/account';
import { loginCheck, authCheck } from './loggedCheck';
import { GamesSearch } from './pages/games-search/games-search';
import { Register } from './pages/register/register';

export const routes: Routes = [
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
		component: Register
	}
];
