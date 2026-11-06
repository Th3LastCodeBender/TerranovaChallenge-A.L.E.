import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  imports: [],
  selector: 'app-account',
  styleUrl: './account.scss',
  templateUrl: './account.html',
})
export class Account {
  user = inject(AuthService);
  
  getUserParams() {
    return this.user.getUser();
  }
}
