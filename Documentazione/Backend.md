# Backend

## In breve

Il backend è un progetto **Next.js usato solo come API**: tutte le route si trovano sotto `app/api/`. Il frontend lo chiama sempre con percorsi relativi (`/api/...`) e nginx gira le richieste.

Il codice è diviso in tre strati:

```
app/api/...   le route: gestione richieste, autenticazione, rate limit
lib/...       la logica: IGDB, sicurezza, Redis, LLM, motore "Can i run?"
query/...     il database, solo Prisma (vedi Database.md)
```

Una route tipo fa sempre le stesse cose, in quest'ordine: verifica se la richiesta proviene da un utente autenticato, rate limit, validazione dell'input, chiamata a `lib/` o `query/`, risposta JSON.

I dati dei giochi arrivano da **IGDB** (al posto di RAWG). Per usare IGDB serve un token Twitch, che il backend chiede da solo con Client ID e Secret e tiene in memoria finché non scade.

## Cosa c'è

| Gruppo | Route | Note |
| --- | --- | --- |
| Giochi | `games`, `games/home`, `games/search/[title]`, `games/[slug]`, `games/suggested` | tutto da IGDB, con filtri, ordinamento e paginazione |
| Account | `auth/signup`, `auth/login`, `auth/logout`, `auth/me`, `auth/delete-account` | sessione con cookie |
| 2FA | `security/mfa`, `mfa/enable`, `mfa/disable` | codice via email |
| Preferiti | `favourites/...` | aggiungi, togli, lista, solo gli id |
| Collezione | `collections/...`, `count-collections` | stato per gioco |
| PC | `specs/...`, `compat/can-i-run` | vedi [CanIRun.md](CanIRun.md) |

La collection Postman con tutte le route sta in `postman/`; come lanciarla e cosa controlla è in [Postman.md](Postman.md).

## Login e sessioni

Abbiamo scelto un **cookie di sessione** e non un JWT per una gestione del token piu' flessibile.

- Al login si genera un token casuale. Nel browser va il token (cookie `httpOnly`), nel DB solo il suo hash SHA-256.
- Ogni route protetta passa da `withAuth` (`lib/auth/authWrapper.ts`), che legge il cookie, cerca la sessione valida e passa l'id utente alla route. Se non c'è, 401.
- Le password sono hashate con argon2. In registrazione si controlla anche su Have I Been Pwned che la password non sia già finita in qualche data breach.
- Se l'email non esiste il login fa comunque la verifica su un hash finto, così il tempo di risposta non dice se un'email è registrata evitando l'enumerazione.

## 2FA

Se un utente ha la 2FA attiva, il login non crea la sessione di autenticazione ma avvia una challenge per il controllo dell'otp:

1. password giusta → si genera un codice di 6 cifre, si manda per email e si mette un cookie temporaneo (15 minuti), salvando l'hash del otp nel db
2. l'utente scrive il codice → `security/mfa` lo controlla
3. codice giusto → si crea la sessione autenticata

Al massimo 5 tentativi per codice e un solo codice attivo per utente. Come si evita che lo stesso codice venga usato due volte è spiegato in [Database.md](Database.md#il-caso-dei-codici-2fa).

## Rate limit

Ogni route ha una sua policy in `lib/redis/rate-limit.ts` (per esempio login 10 ogni 15 minuti, signup 5 all'ora). Il contatore sta in Redis. Le route chiamano tutte `checkRateLimit`, che restituisce la risposta 429 già pronta oppure `null` se si può andare avanti.

Di default il limite è per IP. Per le route pesanti (come `can-i-run`) è per utente.

Se Redis è giù il rate limit risponde 503: preferiamo fermarci che lasciare passare tutto.

## Problemi noti

Questi li conosciamo e non sono ancora sistemati:

- **Per spegnere la 2FA basta la sessione.** Andrebbe chiesta la password, come fa già `delete-account`.
- **Il token Twitch non si rinnova su un 401.** Se Twitch lo invalida prima della scadenza, IGDB non risponde fino al riavvio del backend.

> In sviluppo, dopo aver aggiunto un `export` a un modulo, Turbopack a volte continua a usare la versione vecchia (`... is not a function`). Si risolve con `docker restart terranova-backend-1`.
