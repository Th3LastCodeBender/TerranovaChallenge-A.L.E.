import { HttpErrorResponse } from '@angular/common/http';

// Traduce la risposta d'errore del backend in un messaggio per l'utente
export function httpErrorMessage(err: unknown): string {
	if (!(err instanceof HttpErrorResponse))
		return 'Errore imprevisto, riprova';
	switch (err.status) {
		// status 0: la richiesta non ha avuto risposta (backend spento, rete assente)
		case 0:   return 'Impossibile contattare il server, controlla la connessione';
		case 400: return 'Uno dei filtri non è valido';
		case 401: return 'Sessione scaduta, effettua di nuovo il login';
		case 429: {
			// Retry-After lo manda il backend (checkRateLimit): secondi da aspettare
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
