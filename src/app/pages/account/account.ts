import { Component, inject,  } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth/auth-service';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  imports: [Navbar, DatePipe],
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
