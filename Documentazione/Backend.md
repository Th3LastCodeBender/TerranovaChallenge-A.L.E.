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