# Test delle API (Postman)

## In breve

Tutte le route del backend sono provate con una collection Postman: [`postman/Wikigame.postman_collection.json`](../postman/Wikigame.postman_collection.json) (formato v2.1, si importa in qualsiasi versione di Postman).

La collection non è solo un elenco di richieste: ogni richiesta ha dei test che controllano lo status HTTP, che la risposta sia JSON, il contenuto e il messaggio di errore. Le cartelle 1-7 sono un giro completo che si lancia in un colpo solo: crea un utente, usa tutte le funzioni e alla fine lo cancella, quindi non lascia sporco nel DB.

Ultimo giro (15/11/2026, stack di produzione su `localhost:8080`): **78 richieste, 251 controlli, 0 falliti**.

## Come lanciarla

Con lo stack avviato (`make all`):

- **Postman**: Import → il file JSON → tasto destro sulla collection → *Run collection*. Togli la spunta alla cartella 8.
- **Terminale**, con newman:

```bash
npx newman run postman/Wikigame.postman_collection.json \
  --folder "1. Giochi (pubbliche)" --folder "2. Route protette senza login" \
  --folder "3. Account" --folder "4. Preferiti" \
  --folder "5. Collezioni (wishlist e stati)" --folder "6. PC e Can I run?" \
  --folder "7. Chiusura account" --timeout-request 180000
```

L'indirizzo sta nella variabile `baseUrl` (default `http://localhost:8080`, passando da nginx). Per il backend in sviluppo basta cambiarla in `http://localhost:3000`.

Le cartelle vanno lanciate **in ordine**: la 3 crea l'utente e salva il cookie di sessione, le altre lo usano.

## Cosa c'è dentro

| Cartella | Cosa prova |
| --- | --- |
| 1. Giochi | home, elenco con paginazione, ricerca per nome, filtri (genere, piattaforma, anno, rating), ordinamento, scheda di dettaglio |
| 2. Senza login | ogni route protetta risponde 401, anche con un cookie inventato |
| 3. Account | signup, me, logout, login, 2FA accesa e spenta |
| 4. Preferiti | aggiungi, lista, solo id, rimuovi, giochi suggeriti |
| 5. Collezioni | stati TO_PLAY / PLAYING / FINISHED / TO_BUY (la wishlist), contatori |
| 6. PC e Can I run? | specifiche del PC e stima di compatibilità e FPS |
| 7. Chiusura account | cancellazione dell'utente di test |
| 8. Login con 2FA | a mano, vedi sotto |

Per ogni funzione c'è il caso che va bene e i casi di errore. Qualche esempio di cosa controllano i test, oltre allo status:

- **Ricerca avanzata**: chiede gli RPG su PC usciti nel 2015 con rating ≥ 70, ordinati per voto, e verifica gioco per gioco che anno, genere e rating siano giusti e che l'ordine sia decrescente.
- **Ricerca base**: ogni titolo restituito contiene davvero il testo cercato. Una ricerca senza risultati deve dare lista vuota con 200, non un errore.
- **Scheda di dettaglio**: ci sono descrizione, generi, piattaforme, voti, screenshot con URL, sviluppatore e publisher. Da anonimo `userData` è vuoto; dopo aver messo il gioco nei preferiti e in collezione, la stessa richiesta lo riporta.
- **Login**: dopo il logout il vecchio cookie non vale più, e la password non compare mai nella risposta.
- **Suggeriti**: al massimo 5 giochi, ognuno con punteggio, e nessuno già tra i preferiti.
- **Contatori**: dopo le aggiunte e le rimozioni i numeri tornano esatti.
- **Input non validi**: genere inesistente, anno 1800, rating 150, offset negativo, slug con caratteri strani, gameId `"abc"`, JSON rotto, RAM passata come stringa, risoluzione `8k`. Ognuno deve dare 400 con il suo messaggio preciso.

## Come funziona la sessione

Il login mette un cookie `httpOnly` (`valid-login-session`). Il test di signup e di login lo legge dall'header `Set-Cookie` e lo salva nella variabile `sessionCookie`; le richieste protette lo rimandano nell'header `Cookie`. Così la collection funziona uguale in Postman e in newman, senza dipendere dal cookie jar.

Il signup usa un'email con il timestamp (`postman_<ms>@example.com`), quindi ogni giro crea un utente nuovo.

## La cartella 8 (2FA)

Il login di un utente con 2FA manda un codice per email vera, quindi non si può automatizzare. Per provarlo:

1. imposta `mfaEmail` e `mfaPassword` di un utente con 2FA attiva e un'email reale;
2. lancia *Login*: risponde 201 con `requires2fa: true` e mette il cookie `2fa_cookie`;
3. leggi il codice nella mail, mettilo in `otp` e lancia *Verifica codice*.

Ci sono anche i due casi di errore (codice sbagliato, codice non di 6 cifre). Accendere e spegnere la 2FA invece è nel giro automatico (cartella 3).

## Cose da sapere

- **Rate limit.** Il signup accetta 5 richieste all'ora per IP e il giro ne fa 4. Se si rilancia tutto entro un'ora, il signup risponde 429 e il resto fallisce a cascata. In quel caso si aspetta, oppure si svuotano i contatori in Redis (`docker exec terranova-redis-1 redis-cli --scan --pattern 'rate-limit:*' | xargs docker exec -i terranova-redis-1 redis-cli del`, solo in locale).
- **Can I run? è lenta la prima volta.** La prima stima su un gioco passa dal modello locale (Ollama) e nel giro di prova ci ha messo 81 secondi. Dopo è in cache e risponde in pochi millisecondi. Per questo il timeout delle richieste è a 180 s, come quello di nginx.
- **I dati vengono da IGDB.** I test sui giochi controllano la forma e la coerenza dei risultati, non titoli precisi (a parte The Witcher 3 e Portal 2, usati come giochi fissi), perché il catalogo cambia.
- All'inizio avevamo una collection nel formato a file YAML di Postman v12, ma la versione di Postman che usavamo non riusciva ad aprirla e non aveva test. L'abbiamo rifatta da zero in questo formato e tolta dalla repo.
