import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './services/auth/auth-service';
import { authExpiredInterceptor } from './services/auth/auth-expired.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authExpiredInterceptor])),
    // L'app parte solo dopo questa chiamata: le guardie sanno già se l'utente è loggato
    provideAppInitializer(() => firstValueFrom(inject(AuthService).restoreSession()))
  ]
};
