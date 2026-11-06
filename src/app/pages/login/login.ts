
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  imports: [RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  user = inject(AuthService);
  router = inject(Router);
  
  login () {
    const user: User = {
      id: 1,
      username: "odoacr3e",
      email: "edoraccanello@gmail.com",
      name: "Edoardo",
      surname: "Raccanello"
    }
    this.user.setUser(user);
    this.router.navigate(['/']);
  }
}
