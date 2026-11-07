import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  imports: [Navbar],
  selector: 'app-account',
  styleUrl: './account.scss',
  templateUrl: './account.html',
})
export class Account {
  authService = inject(AuthService);
  
  getUserParams() {
    return this.authService.getUser();
  }
}
