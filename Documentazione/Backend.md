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

`deleteExpiredChallenges()` → `BatchPayload` (`{ count }`) cancella le challenge scadute. Per ora non la chiama nessuno: si può usare in un job periodico o ogni tanto durante il login.

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


ERRORI DEL BACKEND

## Report controllo errori backend (2026-11-13, aggiornato dopo il pull)

Ho letto tutto `app/02_backend` (fino al commit `5f53bd55`) e ho lanciato `tsc --noEmit` e `pnpm lint`. Lo stack era spento, quindi i punti segnati **[verificato]** li ho controllati nel codice delle librerie o con uno script a parte. Gli altri sono da provare a mano.

Priorità: 🔴 rompe una funzione o la build · 🟠 bug o problema di sicurezza · 🟡 pulizia / incoerenze

### 🔴 Bloccanti

**B1. La 2FA non funziona: al token arriva l'oggetto cookie, non la stringa**
`app/api/security/mfa/route.ts:46`
`cookieStore.get(MFA_COOKIE_NAME)` restituisce `{ name, value }`, e `hashSessionToken(pending2FA)` passa l'oggetto intero a `crypto.update()`. Risultato: lancia un TypeError e ogni verifica dell'OTP risponde 500. È anche un errore di `tsc`.
Fix: `hashSessionToken(pending2FA.value)`.

**B2. Le challenge 2FA scadono dopo 0,9 secondi**
`query/mfa.ts:43`
`new Date(Date.now() + MFA_COOKIE_DURATION_SECONDS)` somma 900 **millisecondi**, non secondi. Anche sistemato B1, `findValidChallenge` non trova mai la challenge.
Fix: `MFA_COOKIE_DURATION_SECONDS * 1000`.

**B3. `can-i-run` va in crash se il gioco ha CPU/GPU nei requisiti** *(in corso)*
`lib/compat/check.ts:66-67`
Ora `cpuModels`/`gpuModels` sono `HardwareModel[]` (`{original, model, estimated}`), ma `compareHardware` si aspetta ancora `string[]`. `normalizeHardwareName(obj)` chiama `.toLowerCase()` su un oggetto, quindi risponde 500. Errore di `tsc`.
Fix: passare `tier.cpuModels.map(m => m.model)` (lo stesso per la GPU).

**B4. `next build` fallisce: ci sono errori di tipo**
`tsc --noEmit` dà 4 errori sul nostro codice: B1 e B3, più:
- `app/api/security/mfa/route.ts:89`: `const {passwordHash, ...safeUser} = user`, ma `findUserById` esclude già `passwordHash`. Basta `NextResponse.json(user)`.
- `lib/security/password.ts:4`: mancano i tipi di `zxcvbn`. Fix: `pnpm add -D @types/zxcvbn`.

Finché non si sistemano, la build di produzione non passa: Next fa il type check durante `next build`.

**B5. `get-items` e `get-favourites` rispondono sempre 500**
`lib/utils.ts:197-200`, `app/api/collections/get-items/route.ts:56`, `app/api/favourites/get-favourites/route.ts:49`
Ora `getGamesByIds` restituisce cose diverse a seconda del caso:
- `[]` se non ci sono id;
- l'array JSON se IGDB risponde bene;
- la `Response` se IGDB dà errore.

Le route fanno `if (!games.ok)`. Su un array `ok` è `undefined`, quindi si entra sempre nell'if, e `games.text()` lancia `TypeError: games.text is not a function` → 500. Succede anche con la collezione vuota. `tsc` non lo vede perché `response.json()` è `any`, e quindi lo diventa tutto il tipo di ritorno.
Fix: in `getGamesByIds` tornare al `throw` (le route hanno già il `catch`), oppure restituire `{ ok: true, games } | { ok: false, status }` con un tipo esplicito.

**B6. `/api/games` non si autentica mai su IGDB**
`app/api/games/route.ts:12`
`Authorization: Bearer ${requireEnv("TWITCH_CLIENT_SECRET")}` manda il client secret come token. Lì ci va l'access token: IGDB risponde 401, quindi la route dà sempre 502.
Fix: `const token = await getTwitchAccessToken()` e `Bearer ${token}`, come nelle altre route.

### 🟠 Bug e sicurezza

**S1. Signup con email/username già usati → 500 invece di 409** **[verificato]**
`app/api/auth/signup/route.ts:16-19`
`isUniqueConstraintViolation` controlla `code === "23505"`, cioè il codice di Postgres. Prisma però lo converte: l'adapter pg mappa `23505` su `UniqueConstraintViolation`, e il client lo rilancia come `P2002`.
Fix: `err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"`.

**S2. Timing attack sul login: si capisce se un'email è registrata** **[verificato]**
`app/api/auth/login/route.ts:9`
`DUMMY_HASH` usa `m=65536`, mentre `hashPassword` usa `memoryCost: 32768`. L'ho misurato: verify sul dummy ≈ 50 ms, su un hash vero ≈ 26 ms. Chi misura i tempi di risposta capisce se l'email esiste.
Fix: generare il dummy con gli stessi parametri di `hashPassword`, per esempio una volta all'avvio con `hashPassword("dummy")`.

**S3. `x-forwarded-for` lo decide il client**
Tutte le route: `req.headers.get("x-forwarded-for")?.split(",")[0]`
- Il rate limit è per IP, e l'IP arriva da un header che il client può scrivere. Cambiando l'header a ogni richiesta si aggira ogni limite, login e OTP compresi.
- Lo stesso valore finisce in `wgSessions.ip`, che è `@db.Inet`. Se l'header non è un IP valido (`X-Forwarded-For: abc`, oppure il fallback `"unknown"`), Postgres rifiuta l'INSERT e il login risponde 500 "Unable to create session".
Da verificare: chi mette l'header davanti al backend (proxy/frontend) e se sovrascrive quello del client. Fix: prendere l'IP solo da un header scritto dal nostro proxy, validarlo (`net.isIP`) e, se non è valido, salvare `null` (la colonna va resa nullable) o un placeholder valido.

**S4. Disattivare la 2FA basta la sessione**
`app/api/security/mfa/disable/route.ts`
Chi ruba un cookie di sessione può spegnere la 2FA senza password né OTP. Conviene chiedere la password (o un OTP) prima di `disableMfa`. Lo stesso vale per `enable`: oggi si attiva senza verificare che l'email riceva davvero il codice.

**S5. Cookie 2FA e challenge hanno durate diverse**
`app/api/auth/login/route.ts:146`: il cookie ha `maxAge: 300` (5 min), mentre `MFA_COOKIE_DURATION_SECONDS` è 15 min. La costante è importata ma non usata (lo dice anche il lint). Fix: `maxAge: MFA_COOKIE_DURATION_SECONDS`.

**S6. L'OTP non viene inviato**
`app/api/auth/login/route.ts:149`: TODO aperto, manca l'invio della mail. Senza, la 2FA non si può usare neanche dopo aver sistemato B1 e B2.

**S7. Logout concorrente → 500**
`query/sessions.ts:60`: `delete` lancia `P2025` se la riga è già stata cancellata, per esempio con due logout in parallelo. Fix: `deleteMany({ where: { tokenHash } })`. Poi in `logout/route.ts` il `findValidSession` prima della delete non serve più.

**S8. Nessuna pulizia di sessioni e challenge scadute**
`deleteExpiredSessions` è commentata (`query/sessions.ts:63`) e `deleteExpiredChallenges` non la chiama nessuno. Le tabelle crescono senza limite: serve un job periodico o una chiamata ogni tanto durante il login.

**S9. Collezione e preferiti: l'ordine si perde**
`app/api/collections/get-items/route.ts:53`, `app/api/favourites/get-favourites/route.ts:46`
Gli id vengono ordinati per `updatedAt`/`createdAt`, ma `getGamesByIds` li manda a IGDB con `where id = (...)` e IGDB li restituisce nel suo ordine. Fix: riordinare la risposta seguendo l'array `ids`.

### 🟡 Incoerenze e pulizia

- **`/api/games` (`app/api/games/route.ts`):**
  - non ha `where` né `sort`, quindi restituisce giochi in ordine casuale, DLC e versioni comprese. In search c'è `version_parent = null`;
  - `offset` non ha un limite massimo (search si ferma a 9999);
  - richiede il login ma non usa `session` (warning del lint). Se deve essere pubblica come search e `[slug]`, togliere `withAuth`.
- **`count-collections` (`app/api/count-collections/route.ts:39-43`):**
  - fa 5 query una dopo l'altra e carica tutte le righe solo per contarle;
  - le query `countFavourites` e `countCollection` ora ci sono: resta da usarle nella route (vedi "Paginazione e conteggi" in fondo). Volendo si possono lanciare insieme con un `Promise.all`.
- **Paginazione in memoria:** `listCollection`/`listFavourites` ora accettano `{ limit, offset }` e il taglio lo fa il DB. Resta da togliere lo `slice` nelle route `get-favourites` e `get-items` (vedi "Paginazione e conteggi" in fondo).
- **`offset` gestito in modo diverso:** in `get-favourites` è obbligatorio, in `get-items` no (`Number(null) === 0`).
- **Policy riusate:** `can-i-run` usa `get_items`. Visto che chiama l'LLM (fino a 120 s), conviene una policy sua, magari per `userId` invece che per IP. `get_items` a 10/min può essere stretto per un frontend che pagina.
- **`can-i-run` senza dedupe:** due richieste insieme sullo stesso gioco non in cache chiamano l'LLM due volte. La fetch a Steam (`lib/steam/requirements.ts:53`) non ha timeout.
- **`games/[slug]`:** se `getUserGameData` fallisce (DB giù), risponde 500 su tutta la pagina del gioco. Si potrebbe restituire il gioco con `userData` vuoto.
- **Twitch token (`lib/igdb-api/twitch-auth.ts`):** se IGDB risponde 401 non lo rinnova. `import "dotenv/config"` è inutile dentro Next.
- **HIBP (`lib/security/password.ts:45`):** `User-Agent: "YourAppName"` è ancora il placeholder.
- **`signup/route.ts:65`** esporta `signup`: nei file `route.ts` meglio esportare solo i metodi HTTP. Spostarla in `lib/`.
- **Il blocco rate limit (~25 righe) è copiato in tutte le 19 route.** Si potrebbe fare un helper `withRateLimit(policy)` o un `rateLimitResponse()`.
- **Codice morto e warning del lint:**
  - `query/password.ts` è un file incompleto e mai usato: eliminarlo;
  - in `query/users.ts`, `jsonError` è importato ma non usato e `deleteUser` non la usa nessuno;
  - in `signup/route.ts`, `findUserByEmail` è importato ma non usato;
  - in `login/route.ts`, `MFA_COOKIE_DURATION_SECONDS` vedi S5;
  - in `games/route.ts`, `session` non è usato.
- **Configurazione DB unica:** sia la CLI di Prisma sia il runtime (`lib/db/db-pool.ts`) usano le variabili `DB_*` del `.env`. `prisma.config.ts` costruisce l'URL da `DB_*`, e `DATABASE_URL` non esiste più.

### Ordine consigliato

1. B1, B2, B3, B4, B5, B6: correzioni brevi (B5 un po' di più), sbloccano 2FA, `can-i-run`, collezioni, `/api/games` e la build.
2. S1, S2, S3: signup, timing attack, IP.
3. S5, S6, S7: completano il flusso 2FA.
4. Il resto, quando c'è tempo.

## Paginazione e conteggi nelle query di preferiti e collection

Ho aggiunto `limit`/`offset` lato DB e due funzioni di conteggio in `query/favourites.ts` e `query/collection.ts`. Il parametro `page` è opzionale, quindi le route di adesso funzionano ancora senza modifiche.

### Firme

```ts
listFavourites(userId, page?: { limit: number, offset: number })
countFavourites(userId)                      // -> number

listCollection(userId, status?, page?: { limit: number, offset: number })
countCollection(userId, status?)             // -> number
```

Per avere tutta la collezione a pagine si passa `undefined` come status: `listCollection(userId, undefined, { limit, offset })`.

### Da cambiare nelle route

1. **`app/api/favourites/get-favourites/route.ts`**
   ```ts
   // prima
   const favourites = await listFavourites(session.userId)
   const ids = favourites.slice(offset, offset + limit).map(...)
   // dopo
   const favourites = await listFavourites(session.userId, { limit, offset })
   const ids = favourites.map(...)
   ```
2. **`app/api/collections/get-items/route.ts`**
   ```ts
   const entries = await listCollection(session.userId, status, { limit, offset })
   const ids = entries.map(...)
   ```
3. **`app/api/count-collections/route.ts`:** adesso scarica tutte le righe cinque volte solo per contarle. Va sostituito con:
   ```ts
   const favourites = await countFavourites(session.userId)
   const to_play = await countCollection(session.userId, "TO_PLAY")
   const playing = await countCollection(session.userId, "PLAYING")
   const finished = await countCollection(session.userId, "FINISHED")
   const to_buy = await countCollection(session.userId, "TO_BUY")
   ```
   Questi sono già numeri: dove adesso c'è `.length` va tolto.
4. **Facoltativo:** in get-favourites e get-items si può aggiungere `total` alla risposta, con la count corrispondente. Così il frontend sa quante pagine ci sono o se mostrare "carica altri".

**Nota:** l'ordinamento adesso ha `gameId` come secondo criterio, dopo `createdAt` per i preferiti e `updatedAt` per la collection. Così, se due righe hanno lo stesso timestamp, le pagine non ripetono e non saltano giochi.
