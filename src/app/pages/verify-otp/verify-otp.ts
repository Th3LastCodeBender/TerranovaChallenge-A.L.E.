import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  selector: 'app-verify-otp',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './verify-otp.html',
  styleUrl: '../login/login.scss', // riuso lo stile del login
})
export class VerifyOtp {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  form = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  verify(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOtp(this.form.getRawValue().otp.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const backendMsg: string | undefined = err.error?.error;

        if (err.status === 401 && backendMsg !== 'Invalid code') {
          // challenge scaduta / tentativi finiti / cookie assente
          this.authService.clearMfaPending();
          this.router.navigate(['/login']);
          return;
        }
        this.form.controls.otp.reset();
        this.errorMessage.set(this.messageFor(err.status));
      },
    });
  }

  cancel(): void {
    this.authService.clearMfaPending();
  }

  private messageFor(status: number): string {
    switch (status) {
      case 400: return 'Il codice deve essere di 6 cifre';
      case 401: return 'Codice errato';
      case 429: return 'Troppi tentativi, riprova tra poco';
      default:  return 'Errore del server, riprova più tardi';
    }
  }
}
