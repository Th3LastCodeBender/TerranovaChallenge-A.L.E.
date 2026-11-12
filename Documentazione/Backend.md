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
- decidere `expiresAt` e la costante `MAX_ATTEMPTS`;
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
