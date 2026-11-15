import { HttpErrorResponse } from '@angular/common/http';

export function httpErrorMessage(err: unknown): string {
	if (!(err instanceof HttpErrorResponse))
		return 'Errore imprevisto, riprova';
	switch (err.status) {
		case 0:   return 'Impossibile contattare il server, controlla la connessione';
		case 400: return 'Uno dei filtri non è valido';
		case 401: return 'Sessione scaduta, effettua di nuovo il login';
		case 429: {
			const seconds = Number(err.headers.get('Retry-After'));
			return seconds > 0
				? `Troppe richieste, riprova tra ${seconds} secondi`
				: 'Troppe richieste, riprova tra poco';
		}
		case 502:
		case 503: return 'Il catalogo dei giochi non risponde, riprova più tardi';
		default:  return 'Errore del server, riprova più tardi';
	}
}
