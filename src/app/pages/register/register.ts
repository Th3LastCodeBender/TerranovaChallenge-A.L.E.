import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  // Stesse regole del backend, così l'utente vede l'errore prima di inviare
  form = this.formBuilder.nonNullable.group({
    name:     ['', [Validators.required, Validators.maxLength(100)]],
    surname:  ['', [Validators.required, Validators.maxLength(100)]],
    email:    ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
  });

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  register(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.messageFor(err));
      },
    });
  }

  private messageFor(err: HttpErrorResponse): string {
    switch (err.status) {
      case 400: return this.translate(err.error?.error);
      case 409: return 'Email o username già in uso';
      case 429: return 'Troppi tentativi, riprova tra poco';
      default:  return 'Errore del server, riprova più tardi';
    }
  }

  // Traduce i messaggi 400 che arrivano dal backend
  private translate(message?: string): string {
    if (message?.includes('12 characters'))  return 'La password deve avere almeno 12 caratteri';
    if (message?.includes('too long'))       return 'La password è troppo lunga';
    if (message?.includes('too weak'))       return 'Password troppo debole: usa più parole, numeri o simboli';
    if (message?.includes('compromised'))    return 'Questa password è apparsa in un data breach, scegline un\'altra';
    if (message?.includes('username'))       return 'Username non valido (da 5 a 100 caratteri)';
    if (message?.includes('email'))          return 'Email non valida';
    if (message?.includes('name or surname')) return 'Nome o cognome non validi';
    return 'Dati non validi, controlla i campi';
  }
}
