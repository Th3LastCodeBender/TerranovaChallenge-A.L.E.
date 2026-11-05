import { Service, Injectable } from '@angular/core';
import { User } from '../../models/user.model';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	user: User | null = {
		id: 1,
		email: "edoraccanello@gmail.com",
		name: "Edoardo",
		surname: "Raccanello"
	};

	isLoggedIn(): boolean {
		return this.user !== null;
	}
}
