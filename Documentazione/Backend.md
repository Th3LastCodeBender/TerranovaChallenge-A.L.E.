# Backend

## Query 2FA (`query/mfa.ts`)

### Come usarle, in breve

- I vari typedef si trovano ad inizio file in questo caso è uno solo, `NewMfaChallenge`
- `findMfaByUserId(userId)` → `WG_Mfa | null`: se non è null, l'utente ha la 2FA attiva.
- `enableMfa(userId)` / `disableMfa(userId)`: attivano e disattivano la 2FA. `disableMfa` cancella anche tutte le challenge dell'utente.
- `createMfaChallenge({ userId, tokenHash, codeHash, sentTo, expiresAt })` → Crea la challenge. Prima cancella le vecchie challenge dell'utente, in sto modo ogni utente ne ha al massimo una attiva.
- Verifica dell'otp: `findValidChallenge` → confronto con `codeHash`, se otp sbagliato (hash otp != hash db) → `addFailedAttempt`, `consumeChallenge` se è giusto per aggiornare il campo lastUsedAt. Se una delle due restituisce `false`, il login va rifiutato.
- `MAX_ATTEMPTS` va passata sempre uguale a tutte e tre le funzioni di verifica, salvatela dove vuoi ma che sia sempre lei.
- `deleteExpiredChallenges()`: pulizia delle challenge scadute. Così a naso la chiamerei periodicamente come ci eravamo detti.
- Generare OTP e token, calcolarne l'hash, decidere `expiresAt` e inviare l'email spetta a chi chiama le query.

### Nel dettaglio

Funzioni per la verifica in due passaggi con codice OTP via email. Lavorano sulle tabelle `wgMfa` (utenti con 2FA attiva) e `wgMfaChallenges` (codici inviati).

Le query si occupano solo del database. Spetta a chi le chiama:
- generare OTP e token e calcolarne l'hash;
- inviare l'email;
- scrivere la route e gestire il cookie.

### Gestione della 2FA

| Funzione | Restituisce | Note |
|---|---|---|
| `findMfaByUserId(userId)` | `WG_Mfa \| null` | se non è null, l'utente ha la 2FA attiva |
| `enableMfa(userId)` | `WG_Mfa` | attiva la 2FA; se è già attiva non fa nulla |
| `disableMfa(userId)` | `[BatchPayload, BatchPayload]` | disattiva la 2FA e cancella tutte le challenge dell'utente |

### Login con 2FA

**1. Invio del codice**

```ts
createMfaChallenge({ userId, tokenHash, codeHash, sentTo, expiresAt })
```

Restituisce la challenge creata. **Prima cancella le vecchie challenge dell'utente**, quindi ogni utente ne ha al massimo una attiva.

**2. Verifica del codice**, in quest'ordine:

1. `findValidChallenge(tokenHash, MAX_ATTEMPTS)` → `WG_MfaChallenge | null`.
   Restituisce `null` se il token non esiste o se la challenge è scaduta, già usata o senza tentativi rimasti.
2. Si confronta l'hash del codice inserito con `challenge.codeHash`, con un confronto a tempo costante.
3. Codice **sbagliato** → `addFailedAttempt(challenge.id, MAX_ATTEMPTS)` → `boolean`.
   Aumenta `attempts` di 1. Restituisce `false` se nel frattempo la challenge non era più valida.
4. Codice **giusto** → `consumeChallenge(challenge.id, challenge.userId, MAX_ATTEMPTS)` → `boolean`.
   In una transazione segna la challenge come usata e aggiorna `lastUsedAt` in `wgMfa`.
   Se restituisce `false`, la challenge è stata usata o è scaduta tra il passo 1 e il passo 4: il login va rifiutato.

`MAX_ATTEMPTS` va passata **sempre uguale** a tutte e tre le funzioni.

### Pulizia

`deleteExpiredChallenges()` → `BatchPayload` (`{ count }`) cancella le challenge scadute. La chiama ogni ora, insieme a `deleteExpiredSessions()`, il job in `lib/db/cleanup.ts`, che `instrumentation.ts` avvia all'avvio del server.

### Perché niente `SELECT ... FOR UPDATE`

`addFailedAttempt` e `consumeChallenge` ripetono tutte le condizioni di validità dentro la `WHERE` dell'`UPDATE` e controllano quante righe sono state aggiornate. Se due richieste arrivano insieme, solo una aggiorna la riga (count 1); l'altra trova count 0 e riceve `false`. In questo modo la stessa challenge non può essere usata due volte.


Ho usato la gerarchia GPU 2026 di Tom’s Hardware. È tra le fonti più affidabili perché testa tutte le schede sulla stessa macchina e con la stessa metodologia: CPU Ryzen 7 9800X3D, impostazioni tra high e ultra a seconda del gioco, risoluzione nativa senza upscaling né frame generation. I valori sono la media geometrica degli FPS su 11 giochi raster. 
tomshardware
tomshardware

Quanto lavoro in più per la GPU

Full HD (1920×1080): circa 2,07 milioni di pixel, il riferimento (1×)
QHD (2560×1440): circa 3,69 milioni di pixel, 1,78 volte il Full HD
4K (3840×2160): circa 8,29 milioni di pixel, 4 volte il Full HD

In teoria quindi il QHD dovrebbe dare circa il 56% degli FPS del Full HD e il 4K circa il 25%.

I dati reali (FPS medi)

GPU	1080p	1440p	4K	1440p / 1080p	4K / 1080p
RTX 5090	203,8	167,3	110,8	82%	54%
RX 9070 XT	156,6	116,5	65,8	74%	42%
RTX 5070	132,6	96,4	54,3	73%	41%
RTX 5060 Ti 16GB	105,2	73,4	40,2	70%	38%
RTX 4060	71,5	47,6	17,4	67%	24% 
The GPU benchmarks hierarchy 2026: Ten years of graphics card hardware tested and ranked
 +4

Le percentuali le ho calcolate io dai valori della tabella.

Cosa mostrano i dati

Passare dal Full HD al QHD costa circa il 20–33% degli FPS. È molto meno di quanto direbbe il numero di pixel. Acer riporta un dato simile: circa il 78% di pixel in più abbassa il frame rate più o meno del 20–35%. 
acer
Passare al 4K costa circa il 45–60% sulle schede di fascia medio-alta. Sulle schede economiche si arriva fino al 75%.
Sulle GPU di fascia alta, in Full HD il limite è la CPU. La 5090 perde solo il 18% passando al QHD perché in Full HD non lavora al massimo. Tom’s Hardware lo dice esplicitamente: è difficile sfruttare a fondo la 5090 nei giochi raster se non si gioca in 4K. 
tomshardware
In 4K conta la VRAM. La 5060 Ti 8GB e la 16GB vanno quasi uguali in Full HD (100,4 contro 105,2 FPS), ma in 4K la versione da 8GB scende a 28,1 FPS contro i 40,2 della 16GB. 
tomshardware
Non esiste una tabella valida per tutti. Un gioco limitato dalla CPU cambia poco salendo di risoluzione, mentre uno limitato dalla GPU può rallentare parecchio. 
itechguides

Per il tuo gioco di carri armati questo significa che il costo della risoluzione dipende soprattutto dagli shader per pixel (post-processing, ombre, illuminazione). La logica di gioco e le draw call pesano sulla CPU e non cambiano con la risoluzione.

Sources:

Tom’s Hardware – GPU benchmarks hierarchy 2026
Acer – 1080p vs 1440p gaming 2026
iTechGuides – What 1080p, 1440p and 4K mean for performance


## Errori del backend (aggiornato 2026-11-15)

Ho ripreso il report del 13/11 e ho ricontrollato ogni punto sul codice di adesso. `tsc --noEmit` e `pnpm lint` sono puliti, senza errori né warning. Quasi tutto è risolto (elenco in fondo). Restano i sei punti qui sotto, che sono di Andre. Ognuno ha il problema e un fix già pronto.

### Da fare (Andre)

**A1. L'IP del client lo decide il client** 🟠
`lib/security/client-ip.ts`

Adesso `getClientIp` è l'**unico punto** in cui si legge l'IP: lo usano `checkRateLimit` e le tre route che salvano la sessione (`login`, `signup`, `security/mfa`). Basta quindi cambiare questa funzione e lo schema, senza toccare le route.

Il problema: nginx (`Docker/frontend/nginx.conf`) imposta `X-Forwarded-For $proxy_add_x_forwarded_for`. Quel valore **prende l'header mandato dal client e ci aggiunge in fondo l'IP vero**. Noi leggiamo il primo elemento, cioè quello che sceglie il client.

```
il client (5.5.5.5) manda:  X-Forwarded-For: 1.2.3.4
al backend arriva:          X-Forwarded-For: 1.2.3.4, 5.5.5.5
getClientIp restituisce:    1.2.3.4
```

Le conseguenze:
- cambiando l'header a ogni richiesta si aggira ogni rate limit, compresi login e OTP;
- se l'header non è un IP (`abc`, oppure il fallback `"unknown"`), l'INSERT in `wgSessions.ip` (`@db.Inet`) fallisce e il login risponde 500.

Fix:
1. Leggere `X-Real-IP`. Nginx lo **sovrascrive** con `$remote_addr`, quindi il valore del client viene buttato via. Poi validarlo:
   ```ts
   import { isIP } from "net"

   export function getClientIp(req: Request): string | null
   {
   	const ip = req.headers.get("x-real-ip")?.trim()

   	return ip && isIP(ip) ? ip : null
   }
   ```
2. Schema: `ip String? @db.Inet`, poi la migration (`ALTER TABLE "wgSessions" ALTER COLUMN "ip" DROP NOT NULL`).
3. `query/sessions.ts`: in `NewSession` scrivere `ip: string | null`.
4. `lib/redis/rate-limit.ts`, in `checkRateLimit`: come default dell'identificatore usare `getClientIp(req) ?? "unknown"`.

In sviluppo davanti al backend c'è il proxy di Angular, che non imposta `X-Real-IP`. Quindi l'IP sarà `null` e tutte le richieste finiranno in un unico contatore `unknown`. Va bene: in produzione c'è sempre nginx.

**A2. Per attivare o disattivare la 2FA basta la sessione** 🟠
`app/api/security/mfa/disable/route.ts`, `app/api/security/mfa/enable/route.ts`

Chi ruba il cookie di sessione può spegnere la 2FA senza password né OTP. Allo stesso modo `enable` la accende senza controllare che l'email riceva davvero i codici: se l'email è sbagliata, l'utente resta chiuso fuori.

Fix:
- **disable**: chiedere la password nel body e verificarla. C'è già tutto, perché fa la stessa cosa `app/api/auth/delete-account/route.ts`: `findPasswordHashById(session.userId)` + `verifyPassword`, e 403 se la password è sbagliata;
- **enable**: mandare un OTP e attivare la 2FA solo dopo che l'utente l'ha inserito giusto. Come minimo, chiedere anche qui la password;
- frontend: il toggle in `pages/account` deve chiedere la password (o il codice) prima di chiamare la route.

**A3. `games/[slug]` risponde 500 se il DB non risponde** 🟡
`app/api/games/[slug]/route.ts:126-134`

Se `getUserGameData` fallisce (Postgres giù), la route risponde 500, anche se il gioco da IGDB è già arrivato. Il frontend (`game-details.ts:154`) legge `response.userData.isFavourite` senza controlli, quindi `userData` deve esserci sempre e non può essere `null`.

Fix: restituire il gioco con un `userData` vuoto, lo stesso che si usa già quando l'utente non è loggato.
```ts
const EMPTY_USER_DATA = { isFavourite: false, collectionStatus: null }

// in getUserGameData:   if (!auth.ok) return EMPTY_USER_DATA
// nel GET:
try
{
	userData = await getUserGameData(req, game.id)
}
catch (error)
{
	console.error(error)
	userData = EMPTY_USER_DATA
}
```

**A4. Il token Twitch non si rinnova se IGDB risponde 401** 🟡
`lib/igdb-api/twitch-auth.ts`

Il token resta in memoria fino a `expires_in`. Se Twitch lo invalida prima, per esempio perché si rigenera il client secret, tutte le chiamate a IGDB danno 401 fino al riavvio del backend.

Fix:
- esportare `invalidateTwitchToken()`, che mette `cachedToken = null`;
- le chiamate a IGDB, se ricevono 401, la chiamano e riprovano **una volta**. Oggi `getTwitchAccessToken` è usata in 16 punti: conviene un unico helper `igdbFetch(endpoint, body)` che pensa a token, header e nuovo tentativo, e che sostituisce le fetch sparse (`utils.ts`, `home`, `suggested`, `search`, `[slug]`, `games`, `steam-app`);
- togliere `import "dotenv/config"`: dentro Next le variabili d'ambiente le carica Next.

**A5. HIBP: `User-Agent` è ancora il placeholder** 🟡
`lib/security/password.ts:39`

`"User-Agent": "YourAppName"`: l'API di Have I Been Pwned chiede uno User-Agent che identifichi l'applicazione. Fix: metterci il nome del progetto, per esempio `"Wikigame"`.

**A6. `signup/route.ts` esporta anche `signup`** 🟡
`app/api/auth/signup/route.ts:67`

In un `route.ts` è meglio esportare solo i metodi HTTP. Next 16 non dà errore, quindi è solo ordine. Fix: spostare `SignupData`, `isUniqueConstraintViolation`, `validateSignupBody` e `signup` in `lib/auth/signup.ts`, che deve iniziare con `import "server-only"`. Nella route restano solo il `POST` e l'import di `signup`.

### Già sistemato (dal report del 13/11 a oggi)

- **2FA**:
  - al token arriva il valore del cookie e non l'oggetto;
  - `MFA_COOKIE_DURATION_SECONDS` è in secondi: il cookie e la challenge durano tutti e due 15 minuti, e la challenge non scade più dopo 0,9 s;
  - l'OTP viene inviato per email.
- **Signup e login**:
  - i duplicati rispondono 409 (`P2002`) e non più 500;
  - il dummy hash usa gli stessi parametri argon2 di `hashPassword`.
- **Sessioni**:
  - il logout usa `deleteMany`, quindi due logout insieme non danno più 500;
  - sessioni e challenge scadute vengono cancellate ogni ora (`instrumentation.ts` + `lib/db/cleanup.ts`).
- **Preferiti e collezione**:
  - la paginazione la fa il DB (prima l'offset veniva applicato due volte);
  - `total` viene dalle count;
  - `getGamesByIds` restituisce i giochi nell'ordine degli id e non in quello di IGDB.
- **`can-i-run`**:
  - ha una policy di rate limit sua (`can_i_run`, 10 al minuto **per utente**);
  - la fetch a Steam ha un timeout di 10 s;
  - due richieste insieme sullo stesso gioco aspettano la stessa chiamata all'LLM.
- **`/api/games`**: si autentica con l'access token e ha filtri, ordinamento e limite all'offset.
- **Rate limit**: il blocco di circa 25 righe copiato in 22 route è diventato `checkRateLimit(req, endpoint, policy, identifier?)` in `lib/redis/rate-limit.ts`, che restituisce la risposta 429/503 oppure `null`.
- **Tipi**:
  - le risposte di IGDB hanno un tipo (`lib/igdb-api/types.ts`), e non ci sono più `any`;
  - la build passa il type check.
- **Pulizia**:
  - tolti `query/password.ts` e gli import inutilizzati;
  - nel lint c'è `ignoreRestSiblings`, che permette `const { passwordHash, ...safeUser } = user`.
- **Nuovo**: `DELETE /api/auth/delete-account`, che vuole la password nel body e risponde 403 se è sbagliata. Ha la policy `delete_account` (5 ogni 15 minuti per utente) e il pulsante nella pagina account.

> **In sviluppo:** dopo aver aggiunto un `export` a un modulo, Turbopack a volte continua a usare la versione vecchia (`... is not a function` su tutte le route). Si risolve con `docker restart terranova-backend-1`.

## Paginazione e conteggi nelle query di preferiti e collection

Ho aggiunto `limit`/`offset` lato DB e due funzioni di conteggio in `query/favourites.ts` e `query/collection.ts`. Il parametro `page` è opzionale.

### Firme

```ts
listFavourites(userId, page?: { limit: number, offset: number })
countFavourites(userId)                      // -> number

listCollection(userId, status?, page?: { limit: number, offset: number })
countCollection(userId, status?)             // -> number
```

Per avere tutta la collezione a pagine si passa `undefined` come status: `listCollection(userId, undefined, { limit, offset })`.

Le route `get-favourites`, `get-items` e `count-collections` usano già queste funzioni: la paginazione la fa il DB e `total` viene dalla count.

**Nota:** l'ordinamento adesso ha `gameId` come secondo criterio, dopo `createdAt` per i preferiti e `updatedAt` per la collection. Così, se due righe hanno lo stesso timestamp, le pagine non ripetono e non saltano giochi.
