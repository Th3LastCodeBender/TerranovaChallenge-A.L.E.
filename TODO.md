# Gaming Explorer — Lista delle cose da fare

Nov 6, 2026 · @Magico

## Chi fa cosa e a che punto siamo

Il 6 novembre il gruppo ha cambiato stack: il backend passa da .NET a Next.js (solo API) con Prisma, e i dati dei giochi da RAWG a IGDB. Il codice .NET sul branch `backend` va riscritto; l'infrastruttura su `main` è già adattata. Le responsabilità di frontend e backend sono ricavate dalla cronologia dei commit: **da confermare**, compreso che `AidenDogs` e `andre42` siano la stessa persona.

| Area | Responsabile | Branch | Cosa c'è già | Cosa manca di più importante |
| --- | --- | --- | --- | --- |
| Docker e DB | Th3LastCodeBender | `main`, `DataBase` | Compose dei tre livelli, Dockerfile Node con Prisma, nginx, Makefile con worktree e migrations, `make dev`, schema dei preferiti deciso | `schema.prisma`, prima migration, prova completa con il backend vero |
| Backend | AidenDogs / andre42 | `backend` | Nulla in TypeScript: gli endpoint .NET su RAWG sono da riscrivere | Progetto Next, endpoint IGDB, autenticazione, preferiti, Postman |
| Frontend | odoacr3e | `frontend` | Angular 22, Bootstrap, navbar, card, griglia, pagine Home e Login, cambio tema | Chiamate HTTP (la griglia usa dati finti), modelli da allineare al nuovo JSON, ricerca, filtri, dettaglio, preferiti |
| Integrazione | Tutti | `main` | `make all` avvia i tre container; browser, nginx e backend comunicavano con il backend .NET | Ripetere la prova con il backend Next; importare i branch in `main` prima della consegna |

## Decisioni già prese

| Decisione | Scelta |
| --- | --- |
| Struttura della repo | `main` contiene Makefile, compose, `Docker/` e `Documentazione/`; ogni livello resta sul suo branch, collegato come worktree in `app/` |
| Avvio | `make dev` per lavorare (`localhost:4200`, volumi, nessun riavvio manuale); `make all` per la versione da consegnare (`localhost:8080`, immagini e nginx) |
| Stack | Backend Next.js usato solo come API (`app/api/v1/...`, porta 8080), Prisma 7 come ORM, PostgreSQL 17, dati dei giochi da IGDB |
| Schema e migrations | `prisma/` e `prisma.config.ts` stanno nel branch `backend`; li scrive e committa Th3LastCodeBender, il backend scrive servizi ed endpoint |
| Applicazione delle migrations | Automatica all'avvio del backend con `prisma migrate deploy`, sia in `make dev` sia in `make all` |
| Preferiti | Tabella `Favourites`: chiave primaria (utente, id IGDB), id del gioco `> 0`, cancellazione a cascata con l'utente, `createdAt`. Nessuna chiave esterna sul gioco: lo verifica il backend su IGDB |
| Campi utente | Solo quelli che servono all'accesso (email, hash della password, data di creazione); nome, cognome e telefono no |
| Branch del DB | `app/03_db` usa il branch `DataBase`; `DataBase_Study` resta come materiale di studio |
| Porta del DB | Non pubblicata: si entra con `make db` |
| Consegna | Prima della consegna i branch vengono importati in `main`, nelle stesse cartelle |

## Decisioni da prendere insieme

Queste scelte bloccano il lavoro di più persone, quindi vanno chiuse per prime. Le proposte sono da discutere.

| Decisione | Perché blocca | Proposta |
| --- | --- | --- |
| Credenziali Twitch | Senza Client ID e Secret nessuno può chiamare IGDB | Una persona crea l'app su Twitch Developers e passa le credenziali agli altri fuori da Git |
| Login | I preferiti sono obbligatori e servono un utente; senza Identity l'autenticazione va scritta da zero | Registrazione e login minimi subito, prima dei preferiti; password con argon2 o bcrypt; scegliere tra cookie di sessione e JWT |
| Preferiti senza account | Il frontend deve sapere cosa mostrare a chi non ha fatto l'accesso | Il cuore porta alla pagina di login |
| Formato JSON delle API | I modelli Angular usano i nomi di RAWG (`background_image`); IGDB usa nomi diversi | Il backend restituisce un formato suo, indipendente da IGDB, scritto nella collection Postman |
| Filtro per valutazione | Il subject lo chiede; IGDB ha voti degli utenti, della critica e un totale | Filtrare e ordinare sul voto totale e motivarlo nella documentazione |
| Bonus da fare | Wishlist e statistiche sono ancora da decidere e valgono in tutto +2 punti | Deciderlo solo quando le funzioni obbligatorie sono integrate |
| Scadenza | Non è indicata nei documenti del progetto | Fissare la data di consegna e una data per la prima integrazione |

## Docker e architettura — Th3LastCodeBender

L'obiettivo è che `make all` avvii tutta l'app da un clone pulito e che `make dev` permetta di lavorare senza riavviare i server. L'infrastruttura è adattata a Next e Prisma e provata su un progetto di prova: le verifiche vere aspettano il progetto Next sul branch `backend`.

**Passi 1-2: repo e worktree**

- [x] `.gitignore` che protegge `.env` e i worktree
- [x] `.env.example` senza segreti, con le variabili di Postgres e Twitch
- [x] `make setup`: worktree `app/01_frontend`, `app/02_backend` e `app/03_db`
- [x] `make status`: stato di tutti i worktree
- [ ] Spiegare ai boyz come usare `main` e i worktree

**Passo 3: DB**

- [x] `docker-compose.yml` con il DB, un volume nuovo separato da quello di studio e il controllo di salute
- [x] Nessuna porta pubblicata e accesso con `make db`
- [x] Comandi `up`, `down`, `re`, `ps`, `logs` e `fclean` nel Makefile
- [x] Verificare che i dati restino dopo `make down` e un nuovo avvio

**Passo 4: backend**

- [x] Dockerfile in `Docker/backend/`: Node 24, `prisma generate`, build di Next, migrations e avvio sulla porta 8080
- [x] Passare al backend `DATABASE_URL` e le credenziali Twitch
- [x] Far partire il backend solo quando il DB è pronto
- [ ] Verificare `docker compose build backend` con il progetto Next vero

**Passo 5: frontend e `make all`**

- [x] Dockerfile in `Docker/frontend/`: build di Angular, poi nginx che serve i file
- [x] Configurare nginx: inoltro di `/api` al backend e ritorno a `index.html` per le rotte Angular
- [x] Reti separate, così il frontend non raggiunge il DB
- [x] Verificare da `localhost:8080` la pagina e il refresh su `/login`
- [x] Committare sul branch `frontend` il `package-lock.json` rigenerato: senza, `npm ci` fallisce da un clone pulito
- [ ] Verificare che `/api/v1/...` arrivi dal browser al backend Next e restituisca dati IGDB

**Passo 6: `make dev`**

- [x] `docker-compose.dev.yml` con i volumi di `app/01_frontend` e `app/02_backend`, `ng serve` e `next dev`
- [x] Proxy di `ng serve` verso il backend, con la configurazione in `Docker/`
- [x] `node_modules` e cache di Angular e Next in volumi separati
- [x] `make dev_restart` per riavviare i container quando cambiano le dipendenze o arrivano nuove migrations
- [x] Verificare che le modifiche al frontend appaiano senza riavvii
- [ ] Verificare che le modifiche al backend Next si applichino senza riavvii (funziona sul progetto di prova)
- [x] Verificare che si possa committare dal worktree
- [x] Verificare che dopo `make dev` il comando `make all` torni a rispondere su `localhost:8080`

**Passo 7: backend e DB**

- [x] Regole `make migration`, `make migrate` e `make migrate_status`, con i file restituiti all'utente che le lancia
- [ ] Endpoint di prova che legge dal DB, come il vecchio `/health/db`
- [ ] Verificare che una migration già applicata non venga rieseguita al riavvio (funziona sul progetto di prova)

**Passo 8: verifica finale**

- [x] Scrivere il README con i passi per avviare il progetto
- [ ] Provare l'avvio da un clone pulito seguendo solo il README
- [ ] Provare il percorso completo: ricerca, dettaglio, login, aggiunta e rimozione di un preferito

**Prima della consegna**

- [ ] Importare i branch in `main`, nelle stesse cartelle dei worktree
- [ ] Verificare `make all` dopo l'importazione

**Punti da risolvere con il backend**

- [ ] Rate limit: dietro nginx tutti gli utenti arrivano dallo stesso IP. Se il backend limita per IP, deve leggere `X-Forwarded-For`, che nginx già invia

## Database — Th3LastCodeBender

Lo schema dei preferiti è deciso; ora va scritto in Prisma insieme alla tabella degli utenti, che senza Identity va fatta a mano.

**Schema**

- [x] Bozza dei preferiti: aggiunta e rimozione di un gioco, con tabella e righe di esempio
- [x] Cosa impedisce di aggiungere due volte lo stesso gioco: la chiave primaria (utente, id del gioco)
- [x] Cosa succede ai preferiti se un utente cancella l'account: vengono cancellati a cascata
- [x] Campi dell'utente: nessuno oltre a quelli per l'accesso
- [ ] Scegliere il tipo dell'id utente: intero progressivo o uuid

**Prisma e migrations**

- [ ] Scrivere `schema.prisma` con `User` e `Favourite`
- [ ] Creare la prima migration con `make migration name=init` e aggiungere a mano il `CHECK` sull'id del gioco
- [ ] Applicarla con `make migrate` e committare `prisma/` sul branch `backend`

**Verifica del funzionamento**

- [ ] Provare con `psql` i casi limite: gioco duplicato, id 0, utente inesistente, cancellazione dell'account
- [ ] Scrivere lo schema in `Documentazione/Database.md`, con la motivazione di PostgreSQL già pronta nel draft

**Pulizia dello studio**

- [x] Sul DB di prova `terranova`, eliminare la tabella `prova`
- [ ] Controllare che il dump `biblioteca-studio.sql` sia aggiornato

## Backend — AidenDogs / andre42

Il backend riparte da zero in Next.js. L'infrastruttura su `main` si aspetta alcune cose dal progetto: sono nella prima lista.

**Progetto Next**

- [ ] Progetto Next nella radice del branch `backend`, con `package-lock.json` committato e senza `"type": "commonjs"` in `package.json`
- [ ] Endpoint sotto `app/api/v1/...`: nginx inoltra `/api` così com'è
- [ ] Prisma 7 fissato (`prisma`, `@prisma/client`, `@prisma/adapter-pg` tra le `dependencies`): `prisma@latest` oggi installa una 8.0 non stabile
- [ ] `prisma.config.ts` nella radice, generator `prisma-client` con output `src/generated/prisma`, messo nel `.gitignore`
- [ ] Un solo client Prisma salvato in `globalThis`, mai usato nel middleware
- [ ] Variabili lette dall'ambiente: `DATABASE_URL`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`; nessun `.env` nel branch

**IGDB**

- [ ] Ottenere il token Twitch (`client_credentials`), tenerlo in memoria e rinnovarlo quando scade
- [ ] Riscrivere gli endpoint per giochi, dettaglio, screenshot, generi e piattaforme con le query di IGDB
- [ ] Costruire gli URL delle immagini da `image_id`
- [ ] Rispettare il limite di IGDB di circa 4 richieste al secondo
- [ ] Rate limit verso il frontend, come c'era in .NET
- [ ] Scrivere i test

**Autenticazione**

- [ ] Registrazione, login, logout e un endpoint per sapere chi è l'utente collegato
- [ ] Hash delle password con argon2 o bcrypt
- [ ] Cookie di sessione o JWT, secondo la decisione del gruppo, e protezione degli endpoint
- [ ] Regole di validazione e messaggi di errore per email e password

**Preferiti**

- [ ] `GET` della lista preferiti dell'utente collegato
- [ ] `POST` per aggiungere un gioco, verificando prima su IGDB che l'id esista
- [ ] `DELETE` per togliere un gioco
- [ ] Tradurre gli errori in codici HTTP chiari: non autenticato, gioco inesistente, gioco già presente
- [ ] Stabilire chi compone la lista con titoli e copertine: backend o frontend
- [ ] Chiedere a IGDB tutti i giochi della lista con una sola query, invece di una chiamata per gioco

**Postman (richiesto dal subject)**

- [ ] Creare una collection con tutti gli endpoint
- [ ] Verificare codici di stato, JSON e parametri non validi
- [ ] Simulare gli errori: IGDB non raggiungibile, token scaduto, utente non autenticato
- [ ] Esportare la collection nella repo per la consegna

## Frontend — odoacr3e

La base grafica c'è: il passo decisivo è sostituire i dati finti con le chiamate al backend. Da lì dipendono quasi tutte le funzioni obbligatorie.

**Collegamento al backend**

- [ ] Attivare `provideHttpClient` e creare un servizio per le chiamate a `/api/v1`, con percorsi relativi per evitare errori CORS
- [ ] Allineare i modelli TypeScript al JSON del backend: quelli attuali usano i nomi di RAWG
- [ ] Sostituire `GAMES_MOCKUP` in `game-list` con i dati reali

**Home e ricerca**

- [ ] Home con panoramica, barra di ricerca e una selezione di giochi
- [ ] Collegare la barra di ricerca della navbar, oggi senza effetto
- [ ] Ricerca per nome o parte del nome, con attesa tra un tasto e l'altro per non consumare il rate limit

**Ricerca avanzata**

- [ ] Filtri per genere e piattaforma, con i valori presi da `/genres` e `/platforms`
- [ ] Filtro per anno, nel formato concordato con il backend
- [ ] Filtro per valutazione, secondo la decisione del gruppo
- [ ] Ordinamento per nome, data di uscita e valutazione
- [ ] Paginazione dei risultati

**Card e dettaglio**

- [ ] Verificare che ogni card mostri copertina, titolo, data, valutazione media e piattaforme principali
- [ ] Rendere ogni card selezionabile, con apertura della pagina di dettaglio
- [ ] Aggiungere la rotta e la pagina di dettaglio del gioco
- [ ] Nel dettaglio mostrare descrizione, screenshot, generi, piattaforme, sviluppatore, publisher e valutazioni di utenti e critica

**Preferiti e account**

- [ ] Pulsante per aggiungere e togliere un gioco, su card e dettaglio
- [ ] Pagina dedicata con la lista dei preferiti, raggiungibile dalla navbar
- [ ] Completare la pagina di login e aggiungere la registrazione
- [ ] Mostrare nella navbar se l'utente ha fatto l'accesso e permettere il logout

**Stati e responsive**

- [ ] Indicatore di caricamento in ogni pagina che chiede dati
- [ ] Messaggio di errore quando le API non rispondono
- [ ] Messaggio quando la ricerca non trova risultati
- [ ] Provare tutte le pagine su desktop, tablet e smartphone
- [ ] Rimuovere testi provvisori come il titolo `Offcanvas` nel menù

## Consegna — tutto il gruppo

Si consegnano codice su GitHub, documentazione tecnica e una presentazione di circa 10 minuti. Documentazione, repo e presentazione valgono 10 punti su 40, bonus esclusi.

- [ ] Documentazione: funzionalità, architettura, tecnologie e scelte progettuali
- [ ] Motivare nella documentazione le scelte diverse dal subject: PostgreSQL, Docker, Next.js e Prisma, IGDB al posto di RAWG, eventuali IDE alternativi
- [ ] README con i passi per avviare il progetto
- [ ] Commit frequenti e descrittivi fino alla consegna
- [ ] Preparare la presentazione: caratteristiche principali, difficoltà affrontate e soluzioni
- [ ] Ognuno sa spiegare architettura e funzionalità, e sa modificare il codice se il docente lo chiede, anche fuori dalla propria parte
- [ ] Fare una prova generale con l'app avviata da zero

## Bonus, dopo le funzionalità obbligatorie

I bonus valgono in tutto +2 punti e contano solo se le funzionalità obbligatorie sono corrette. L'autenticazione non è qui perché serve ai preferiti.

| Bonus | Stato | Database | Backend | Frontend |
| --- | --- | --- | --- | --- |
| Dark / light mode | Pulsante presente | Nessun lavoro | Nessun lavoro | Verificare che la scelta resti ai successivi accessi |
| Wishlist | Da decidere | Seconda tabella con la stessa struttura dei preferiti | Endpoint di aggiunta, rimozione e lista | Pulsante e pagina dedicata |
| Statistiche personali | Da decidere | Salvare i giochi consultati | Calcolo di conteggi e distribuzioni con i dati IGDB | Dashboard |
| Confronto tra giochi | Non previsto | Nessun lavoro | Riuso del dettaglio esistente | Selezione di più giochi e schermata comparativa |
| Specifiche del computer in JSON | Idea fuori dal subject | Colonna JSON sull'utente | Lettura e salvataggio | Modulo nell'area personale |

Le specifiche del computer vanno prima concordate con il docente.
