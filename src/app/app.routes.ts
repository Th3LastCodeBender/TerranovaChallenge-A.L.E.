import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Account } from './pages/account/account';
import { loginCheck, authCheck } from './loggedCheck';

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
	}
];
