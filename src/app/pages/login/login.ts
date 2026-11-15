
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth/auth-service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  form = this.formBuilder.nonNullable.group({
	email: ['', [Validators.required, Validators.email]],
	password: ['', Validators.required]
  });
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  
  login(): void {
	if (this.form.invalid) {
	  this.form.markAllAsTouched();
	  this.errorMessage.set(this.invalidFormMessage());
	  return ;
	}
	const { email, password } = this.form.getRawValue();
	this.loading.set(true);
	this.errorMessage.set(null);
	this.authService.login(email, password).subscribe({
	  next: (result) => {
		this.loading.set(false);
		if (result.status === 'mfa-required')
		  this.router.navigate(['/login/verify']);
		else
		  this.router.navigate(['/']);
	  },
	  error: (err: HttpErrorResponse) => {
		this.loading.set(false);
		this.errorMessage.set(this.messageFor(err.status));
	  },
	});  
  }
  private invalidFormMessage(): string {
	const { email, password } = this.form.controls;
	if (email.hasError('required') && password.hasError('required'))
	  return 'Inserisci email e password';
	if (email.hasError('required'))
	  return 'Inserisci la tua email';
	if (email.hasError('email'))
	  return 'L\'email non è valida';
	return 'Inserisci la password';
  }

  private messageFor(status: number): string {
	switch (status) {
	  case 0:   return 'Impossibile contattare il server, controlla la connessione';
	  case 401: return 'Email o password errati';
	  case 409: return 'Sei già loggato';
	  case 429: return 'Troppi tentativi, riprova tra poco';
	  default:  return 'Errore del server, riprova più tardi';
	}
  }
}
