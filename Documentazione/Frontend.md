# Frontend

## In breve

Il frontend è un'app **Angular 22** con **Bootstrap 5** e Bootstrap Icons. Non parla mai con IGDB direttamente: chiama solo il nostro backend con percorsi relativi (`/api/...`). In dev ci pensa il proxy di `ng serve` (`Docker/frontend/proxy.dev.json`), in produzione nginx.

Il codice sta in `app/01_frontend/src/app/` (branch `frontend`):

```
pages/          una cartella per pagina (home, games, game-details, account, login...)
components/     pezzi riusati: navbar, game-card, carousel, filtri, bottoni preferiti/collezione, can-i-run
services/       le chiamate HTTP e lo stato condiviso (auth, giochi, preferiti, collezioni, specs, compat, tema)
models/         le interfacce dei dati: quasi tutte ricalcano IGDB
loggedCheck.ts  le guardie delle route
```

Il sito si chiama **Wikigame**: cerchi un gioco, ne vedi la scheda, lo metti nei preferiti o in una collezione e scopri se il tuo PC lo regge.

## Le feature

### Home

Mostra dei caroselli orizzontali di giochi. Le categorie arrivano da `GET /api/games/home` come oggetto `{ nome_categoria: IgdbGame[] }`. Il frontend dà titolo e icona a quelle che conosce (`trending_games`, `most_played`, `most_recent`); una categoria nuova aggiunta dal backend compare lo stesso, con la chiave come titolo.

Se sei loggato, in cima c'è anche **"Consigliati per te"** (`GET /api/games/suggested`). Se questa chiamata fallisce la sezione sparisce e il resto della home si vede comunque.

### Ricerca e catalogo

- **Navbar**: mentre scrivi (almeno 2 lettere, 300 ms dopo l'ultimo tasto) compare un menu con i risultati. Invio porta a `/games?search=...` con tutti i risultati.
- **`/games`**: senza ricerca mostra tutto il catalogo, con ricerca solo i risultati. 20 giochi per pagina.
- **Filtri**: genere, piattaforma, anno, voto utenti (in stelle), ordinamento e verso. Stanno tutti **nei query param dell'URL** (`/games?genre=shooter&sort=rating&order=desc`), quindi una ricerca filtrata si può copiare, ricaricare o ritrovare col tasto indietro. Ogni cambio di filtro riparte da pagina 1.
- **`/genres`**: la lista dei generi, ognuno porta a `/games` con quel filtro già messo.

Le stelle traducono il voto IGDB (0-100): 1 stella = 20+, 2 = 40+, 3 = 60+, 4 = 80+, 5 = 90+. Il 5 parte da 90 e non da 100 perché quasi nessun gioco arriva a 100.

### Scheda del gioco (`/games/:slug`)

Copertina, sfondo (artwork o screenshot), descrizione, data di uscita, voto utenti e voto della critica, piattaforme raggruppate per famiglia (PlayStation, Xbox, Nintendo, PC), sviluppatori, publisher e screenshot.

Se un gioco non ha data ma ha una release "TBD", viene mostrato come **annunciato**.

Da qui si aggiunge il gioco ai preferiti o a una collezione, e si apre "Posso farlo girare?".

### Account, login e 2FA

- **Registrazione** e **login** con email e password. La sessione è un cookie `httpOnly` messo dal backend: il frontend non vede né salva nessun token.
- All'avvio l'app chiama `GET /api/auth/me` **prima** di mostrare qualsiasi pagina, così sa già se sei loggato.
- **2FA**: se l'utente l'ha attiva, il login risponde `{ requires2fa: true }` e si passa a `/login/verify` per il codice arrivato via email.
- **Sessione scaduta**: se il backend risponde 401 mentre il frontend ti crede loggato (sessione scaduta, logout da un'altra scheda), un interceptor HTTP toglie l'utente e porta al login.
- **`/me`**: dati dell'utente, quanti giochi ha in ogni collezione, attivazione e disattivazione della 2FA, **specifiche del PC** ed eliminazione dell'account (chiede di nuovo la password).

### Preferiti e collezioni

Ogni gioco può essere nei preferiti e, separatamente, in **una** collezione:

| Collezione | URL | Stato nel backend |
| --- | --- | --- |
| Finished | `/collections/finished` | `FINISHED` |
| Playing | `/collections/playing` | `PLAYING` |
| To play | `/collections/to-play` | `TO_PLAY` |
| Wishlist | `/collections/to-buy` | `TO_BUY` |
| Favourites | `/collections/favourites` | (tabella a parte) |

Spostare un gioco da una collezione all'altra è una sola chiamata: il backend sostituisce lo stato.

Cuore e menu della collezione stanno su ogni card. Per non fare una richiesta per card, all'inizio si scaricano una volta sola **tutti gli id dei preferiti** e **tutti gli stati delle collezioni** dell'utente, e le card guardano lì. Il click aggiorna subito l'icona e, se il backend risponde con un errore, torna indietro.

Se non sei loggato, cliccare cuore o collezione porta al login.

### Posso farlo girare?

Nella scheda del gioco c'è un bottone che apre una finestra con:

- il **verdetto**: gira bene (requisiti consigliati), gira (minimi), probabilmente no, difficile dirlo;
- il confronto riga per riga tra il tuo PC e i requisiti (CPU, GPU, RAM, VRAM, sistema operativo), con un segno sui valori stimati;
- una **stima degli FPS** per i quattro preset grafici, a 1080p, 1440p o 4K.

Le specifiche del PC si inseriscono in `/me`. Se il backend non riconosce la CPU o la GPU, avvisa che la stima sarà meno precisa. Come funziona il calcolo è spiegato in [CanIRun.md](CanIRun.md).

### Tema chiaro e scuro

Il bottone nella navbar cambia tema e lo ricorda in `localStorage`. Uno script in `index.html` lo applica prima che parta Angular, così non si vede il lampo del tema sbagliato.

## I modelli: cosa arriva dal backend

### I giochi sono oggetti IGDB

Il backend chiede i dati a IGDB e li passa al frontend **quasi così come sono**: cambia solo l'involucro (vedi sotto). Per questo i modelli in `models/` hanno gli stessi nomi di campo di IGDB, in `snake_case`:

| File | Interfacce |
| --- | --- |
| `game.model.ts` | `IgdbGame`, il gioco |
| `image.model.ts` | `IgdbImage`, `IgdbVideo`, `igdbImageUrl()` |
| `classification.model.ts` | generi, temi, modalità, franchise...: tutti `{ id, name, slug? }` |
| `platform.model.ts` | `IgdbPlatform`, `platformFamily()` |
| `company.model.ts` | `IgdbCompany`, `IgdbInvolvedCompany` |
| `release.model.ts`, `website.model.ts` | date di uscita per piattaforma, link |

Tre cose da sapere per usarli.

**1. Quasi tutto è opzionale.** Il backend sceglie quali campi chiedere a IGDB, e un campo vuoto **non compare proprio** nel JSON (non arriva come `null`). Per questo nei tipi quasi tutto ha il `?`, e nel codice si usa `?.` con un valore di riserva:

```ts
game.genres?.map(g => g.name).join(', ') ?? 'N/D'
```

**2. Date e voti hanno il formato IGDB.**
- `first_release_date` è un timestamp Unix **in secondi**: `new Date(game.first_release_date * 1000)`.
- `rating` (utenti), `aggregated_rating` (critica) e `total_rating` (media dei due) vanno **da 0 a 100**, con decimali.

**3. Le immagini sono solo un id.** Arriva `cover.image_id`, e l'URL si costruisce con la dimensione che serve:

```ts
igdbImageUrl(game.cover.image_id, 'cover_big')
// https://images.igdb.com/igdb/image/upload/t_cover_big/<image_id>.jpg
```

Un gioco come arriva al frontend (valori di esempio):

```json
{
  "id": 119133,
  "name": "Elden Ring",
  "slug": "elden-ring",
  "cover": { "id": 1001, "image_id": "abc123xyz" },
  "first_release_date": 1645747200,
  "genres": [{ "id": 12, "name": "Role-playing (RPG)" }],
  "platforms": [{ "id": 6, "name": "PC (Microsoft Windows)", "abbreviation": "PC" }],
  "involved_companies": [
    { "id": 5001, "company": { "id": 1012, "name": "FromSoftware" },
      "developer": true, "publisher": false, "porting": false, "supporting": false }
  ],
  "total_rating": 94.3
}
```

### Gli involucri del backend

Il backend mette i giochi dentro risposte sue:

| Route | Risposta |
| --- | --- |
| `GET /api/games`, `GET /api/games/search/:title` | `{ results: IgdbGame[], count, offset, limit, hasMore }` |
| `GET /api/games/home` | `{ trending_games: IgdbGame[], most_played: [...], ... }` |
| `GET /api/games/:slug` | `{ game: IgdbGame, userData: { isFavourite, collectionStatus } }` |
| `GET /api/favourites/get-favourites`, `GET /api/collections/get-items` | `{ games: IgdbGame[], total }` |

`/api/games/suggested` per ora restituisce generi e piattaforme come semplici stringhe: `games-service.ts` li converte in `{ id, name }` prima di passarli alle card.

### I modelli nostri

Questi non vengono da IGDB ma dal nostro backend:

- **`User`** (`user.model.ts`): `id`, `username`, `firstName`, `lastName`, `email`, `createdAt`, `mfa`.
- **`GameFilters`** (`game-filters.model.ts`): i filtri di `/games` e le loro opzioni. I valori devono restare uguali a quelli di `lib/igdb-api/filters.ts` del backend.
- **`PcSpecs`** (`specs-service.ts`): `cpu`, `gpu`, `ramGb`, `vramGb?`, `os`.
- **`CanIRunResponse`** (`compat-service.ts`): requisiti estratti da Steam, verdetto e stima FPS. È copiato a mano dai tipi del backend: se cambia lì, va cambiato anche qui.

## Parte tecnica: Angular e Bootstrap

### Angular

- **Componenti standalone**: niente `NgModule`, ogni componente dichiara nel suo `imports` quello che usa.
- **Signal per lo stato**: `signal()` per i valori che cambiano, `computed()` per quelli derivati (es. l'URL della copertina a partire dal gioco), `input()` per i dati passati da fuori. Il template si aggiorna da solo quando cambia un signal.
- **Template con `@if` e `@for`**: la sintassi nuova, al posto di `*ngIf` e `*ngFor`.
- **RxJS solo dove serve**: chiamate HTTP, ricerca nella navbar (`debounceTime` + `switchMap`, così una ricerca vecchia viene annullata da quella nuova) e lettura dei query param dei filtri.
- **Service `providedIn: 'root'`**: un'unica istanza per tutta l'app. È questo che permette a `FavoritesService` e `CollectionsService` di condividere lo stato fra card e scheda del gioco.
- **Routing** in `app.routes.ts`. La scheda del gioco è caricata in lazy (`loadComponent`). Le guardie in `loggedCheck.ts`:
  - `authCheck`: pagina solo per loggati, altrimenti `/login`;
  - `loginCheck`: login e registrazione solo per chi non è loggato;
  - `mfaPendingCheck`: `/login/verify` solo se c'è un login a metà;
  - `collectionTypeCheck`: `/collections/:type` solo con un tipo valido.
- **Form reattivi** (`FormBuilder` + `Validators`) per le specifiche e l'eliminazione dell'account, con gli stessi limiti della validazione del backend.
- **Errori HTTP**: `utils/http-error-message.ts` traduce lo status in un messaggio per l'utente (0 = server irraggiungibile, 429 = troppe richieste, con i secondi da aspettare presi da `Retry-After`).

### Bootstrap

Usiamo **solo il CSS** di Bootstrap, importato in SCSS in `styles.scss`, più le icone (`bi bi-...`). Il JavaScript di Bootstrap non è incluso: anche dove usiamo le sue classi (per esempio `offcanvas` per il menu laterale), ad aprire e chiudere ci pensa Angular con un signal.

Di Bootstrap usiamo soprattutto:

- la griglia (`container`, `row`, `col-*`, `row-cols-*`) per le liste di card;
- le utility (`d-flex`, `gap-*`, `mb-*`, `text-center`...);
- `form-control`, `alert`, `spinner-border` per form, errori e caricamenti;
- **`data-bs-theme`** su `<html>` per il tema chiaro o scuro, che cambia `ThemeService`.

Colori e sfondo sono variabili CSS nostre (`--bg-gradient`, `--title-game-start`...) definite in `styles.scss` per ognuno dei due temi. Le classi nostre hanno il prefisso `custom-`.

## Problemi noti

- I test in `*.spec.ts` sono in gran parte quelli generati da Angular e non aggiornati (es. `app.spec.ts` cerca ancora `Hello, challenge`).
- I testi dell'interfaccia sono misti: collezioni e "Posso farlo girare?" in inglese, filtri, home e messaggi d'errore in italiano.
