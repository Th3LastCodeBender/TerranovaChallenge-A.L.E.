# Gaming Explorer — Lista delle cose da fare

Nov 3, 2026 · @Magico

## Chi fa cosa e a che punto siamo

Il backend RAWG e la grafica di base esistono già, ma i pezzi non sono collegati: mancano preferiti, autenticazione, Docker completo e integrazione. Le responsabilità di frontend e backend sono ricavate dalla cronologia dei commit: **da confermare**, compreso che `AidenDogs` e `andre42` siano la stessa persona.

| Area | Responsabile | Branch | Cosa c'è già | Cosa manca di più importante |
| --- | --- | --- | --- | --- |
| Docker e DB | Th3LastCodeBender | `main`, `DataBase` | Compose dei tre livelli, Dockerfile, nginx, Makefile con i worktree, studio di PostgreSQL | `make dev`, schema reale, migrations |
| Backend | AidenDogs / andre42 | `backend` | .NET 10, endpoint `/api/v1` per giochi, dettaglio, screenshot, generi e piattaforme, rate limit | Collegamento al DB, Identity, endpoint preferiti, Postman |
| Frontend | odoacr3e | `frontend` | Angular 22, Bootstrap, navbar, card, griglia, pagine Home e Login, cambio tema | Chiamate HTTP (la griglia usa dati finti), ricerca, filtri, dettaglio, preferiti |
| Integrazione | Tutti | `main` | `make all` avvia i tre container; browser, nginx e backend comunicano | Collegare il backend al DB, importare i branch in `main` prima della consegna |

## Decisioni già prese

| Decisione | Scelta |
| --- | --- |
| Struttura della repo | `main` contiene Makefile, compose, `Docker/` e `Docs/`; ogni livello resta sul suo branch, collegato come worktree in `app/` |
| Avvio | `make dev` per lavorare (`localhost:4200`, volumi, nessun riavvio manuale); `make all` per la versione da consegnare (`localhost:8080`, immagini e nginx) |
| Branch del DB | `app/03_db` usa il branch `DataBase`; `DataBase_Study` resta come materiale di studio |
| Porta del DB | Non pubblicata: si entra con `make db` |
| Consegna | Prima della consegna i branch vengono importati in `main`, nelle stesse cartelle |

## Decisioni da prendere insieme

Queste scelte bloccano il lavoro di più persone, quindi vanno chiuse per prime. Le proposte sono da discutere.

| Decisione | Perché blocca | Proposta |
| --- | --- | --- |
| Chi scrive il codice EF Core | Sta a metà tra DB e backend | Th3LastCodeBender scrive entità, `DbContext` e migrations; il backend scrive servizi ed endpoint |
| Preferiti e login | I preferiti sono obbligatori, l'autenticazione è un bonus: se Identity tarda, i preferiti restano fermi | Identity minima (registrazione e login) subito, prima dei preferiti |
| Preferiti senza account | Il frontend deve sapere cosa mostrare a chi non ha fatto l'accesso | Il cuore porta alla pagina di login |
| Formato JSON delle API | Il modello Angular usa nomi come `background_image`; va verificato che il backend restituisca gli stessi | Fissare un solo formato e scriverlo nella collection Postman |
| Filtro per valutazione | Il subject lo chiede, ma `/games` espone `metacritic` e non un filtro `rating` | Filtrare con `metacritic`, ordinare per `rating` e motivarlo nella documentazione |
| Campi utente | `Nostrodb.md` prevede nome, cognome e telefono: sono dati personali da gestire | Tenere solo quelli che l'app usa davvero |
| Bonus da fare | Wishlist e statistiche sono ancora da decidere e valgono in tutto +2 punti | Deciderlo solo quando le funzioni obbligatorie sono integrate |
| Scadenza | Non è indicata nei documenti del progetto | Fissare la data di consegna e una data per la prima integrazione |

## Docker e architettura — Th3LastCodeBender

L'obiettivo è che `make all` avvii tutta l'app da un clone pulito e che `make dev` permetta di lavorare senza riavviare i server. Passi 1-5 quasi completati: restano la correzione del lock da committare e la prova con RAWG. Il prossimo è `make dev`.

**Passi 1-2: repo e worktree**

- [x] `.gitignore` che protegge `.env` e i worktree
- [x] `.env.example` senza segreti e chiave RAWG nel `.env` locale
- [x] `make setup`: worktree `app/01_frontend`, `app/02_backend` e `app/03_db`
- [x] `make status`: stato di tutti i worktree
- [ ] Spiegare ai boyz come usare `main` e i worktree

**Passo 3: DB**

- [x] `docker-compose.yml` con il DB, un volume nuovo separato da quello di studio e il controllo di salute
- [x] Nessuna porta pubblicata e accesso con `make db`
- [x] Comandi `up`, `down`, `re`, `ps`, `logs` e `fclean` nel Makefile
- [x] Verificare che i dati restino dopo `make down` e un nuovo avvio

**Passo 4: backend**

- [x] Dockerfile in `Docker/backend/`: compilazione .NET 10 e immagine finale separate
- [x] Passare al backend la chiave RAWG e i dati di connessione al DB
- [x] Far partire il backend solo quando il DB è pronto
- [x] Verificare `/health` dalla rete interna

**Passo 5: frontend e `make all`**

- [x] Dockerfile in `Docker/frontend/`: build di Angular, poi nginx che serve i file
- [x] Configurare nginx: inoltro di `/api` al backend e ritorno a `index.html` per le rotte Angular
- [x] Reti separate, così il frontend non raggiunge il DB
- [x] Verificare da `localhost:8080` la pagina e il refresh su `/login`
- [x] Verificare che `/api` arrivi dal browser al backend (con RAWG giù risponde `504`, gestito dal backend)
- [ ] Committare sul branch `frontend` il `package-lock.json` rigenerato: senza, `npm ci` fallisce da un clone pulito
- [ ] Quando RAWG torna, verificare che `/api/v1/genres` restituisca dati veri, chiave compresa

**Passo 6: `make dev`**

- [ ] `docker-compose.dev.yml` con i volumi di `app/01_frontend` e `app/02_backend`, `ng serve` e `dotnet watch`
- [ ] Proxy di `ng serve` verso il backend, con la configurazione in `Docker/`
- [ ] `node_modules`, `bin` e `obj` in volumi separati dai sorgenti
- [ ] Comando per riavviare i container quando cambiano le dipendenze
- [ ] Verificare che le modifiche appaiano senza riavvii e che si possano committare dal worktree

**Passo 7: backend e DB** (da concordare con chi lavora sul backend)

- [ ] Endpoint di prova che esegue `SELECT 1` sul DB

**Passo 8: verifica finale**

- [ ] Scrivere il README con i passi per avviare il progetto
- [ ] Provare l'avvio da un clone pulito seguendo solo il README
- [ ] Provare il percorso completo: ricerca, dettaglio, login, aggiunta e rimozione di un preferito

**Prima della consegna**

- [ ] Importare i branch in `main`, nelle stesse cartelle dei worktree
- [ ] Verificare `make all` dopo l'importazione

**Punti da risolvere con il backend**

- [ ] Rate limit: dietro nginx tutti gli utenti risultano con lo stesso IP e dividono lo stesso limite. Serve `UseForwardedHeaders` in `Program.cs` e `X-Forwarded-For` in nginx
- [ ] `UseHttpsRedirection`: decidere come gestirlo, dato che dietro nginx il backend riceve HTTP

## Database — Th3LastCodeBender

Il primo risultato da consegnare al gruppo è la tabella dei preferiti, già collegata agli utenti di Identity. Del gioco si salva solo l'id RAWG.

**Schema**

- [ ] Scrivere la bozza dei preferiti: aggiunta e rimozione di un gioco, con tabella e righe di esempio
- [ ] Rispondere nella bozza: cosa impedisce di aggiungere due volte lo stesso gioco?
- [ ] Rispondere nella bozza: cosa succede ai preferiti se un utente cancella l'account?
- [ ] Decidere se la classe utente di Identity va estesa con altri campi

**EF Core e migrations** (se confermato nelle decisioni)

- [ ] Aggiungere Npgsql ed EF Core al progetto `Terranova.Infrastructure`
- [ ] Creare il `DbContext` con le tabelle di Identity e quella dei preferiti
- [ ] Dichiarare in C# i vincoli decisi nella bozza
- [ ] Generare la prima migration e controllare l'SQL con `dotnet ef migrations script`
- [ ] Applicare le migrations all'avvio del backend, con tentativi ripetuti se il DB non è ancora pronto

**Verifica del funzionamento**

- [ ] Provare con `psql` i casi limite: gioco duplicato, utente inesistente, cancellazione dell'account
- [ ] Verificare che una migration già applicata non venga rieseguita al riavvio
- [ ] Scrivere lo schema in `Docs/Database.md`, con la motivazione di PostgreSQL già pronta nel draft

**Pulizia dello studio**

- [x] Sul DB di prova `terranova`, eliminare la tabella `prova`
- [ ] Controllare che il dump `biblioteca-studio.sql` sia aggiornato

## Backend — AidenDogs / andre42

Gli endpoint RAWG richiesti ci sono già: mancano autenticazione, preferiti e prove con Postman.

**Correzioni su ciò che esiste**

- [ ] `GET /` risponde `500`: `Program.cs` usa `RequireRateLimiting("global")`, ma sono definite solo `standard` ed `expensive`. Da correggere
- [ ] Verificare che il limite di 30 richieste al minuto su `/games` regga la ricerca dinamica
- [ ] Scrivere i test: i progetti contengono solo `UnitTest1.cs`

**Autenticazione**

- [ ] Configurare ASP.NET Core Identity sul `DbContext`
- [ ] Registrazione, login, logout e un endpoint per sapere chi è l'utente collegato
- [ ] JWT nei cookie, come deciso nel draft, e relativa protezione degli endpoint
- [ ] Regole di validazione e messaggi di errore per email e password

**Preferiti**

- [ ] `GET` della lista preferiti dell'utente collegato
- [ ] `POST` per aggiungere un gioco, verificando prima su RAWG che l'id esista
- [ ] `DELETE` per togliere un gioco
- [ ] Tradurre gli errori in codici HTTP chiari: non autenticato, gioco inesistente, gioco già presente
- [ ] Stabilire chi compone la lista con titoli e copertine: backend o frontend
- [ ] Aggiungere una cache di breve durata per le risposte RAWG: 30 preferiti possono richiedere fino a 30 chiamate

**Postman (richiesto dal subject)**

- [ ] Creare una collection con tutti gli endpoint
- [ ] Verificare codici di stato, JSON e parametri non validi
- [ ] Simulare gli errori: RAWG non raggiungibile, quota esaurita, utente non autenticato
- [ ] Esportare la collection nella repo per la consegna

## Frontend — odoacr3e

La base grafica c'è: il passo decisivo è sostituire i dati finti con le chiamate al backend. Da lì dipendono quasi tutte le funzioni obbligatorie.

**Collegamento al backend**

- [ ] Attivare `provideHttpClient` e creare un servizio per le chiamate a `/api/v1`
- [ ] Allineare i modelli TypeScript al JSON del backend
- [ ] Sostituire `GAMES_MOCKUP` in `game-list` con i dati reali

**Home e ricerca**

- [ ] Home con panoramica, barra di ricerca e una selezione di giochi
- [ ] Collegare la barra di ricerca della navbar, oggi senza effetto
- [ ] Ricerca per nome o parte del nome, con attesa tra un tasto e l'altro per non consumare il rate limit

**Ricerca avanzata**

- [ ] Filtri per genere e piattaforma, con i valori presi da `/genres` e `/platforms`
- [ ] Filtro per anno, convertito nel parametro `dates` (`2020-01-01,2020-12-31`)
- [ ] Filtro per valutazione, secondo la decisione del gruppo
- [ ] Ordinamento per nome, data di uscita e valutazione
- [ ] Paginazione dei risultati

**Card e dettaglio**

- [ ] Verificare che ogni card mostri copertina, titolo, data, valutazione media e piattaforme principali
- [ ] Rendere ogni card selezionabile, con apertura della pagina di dettaglio
- [ ] Aggiungere la rotta e la pagina di dettaglio del gioco
- [ ] Nel dettaglio mostrare descrizione, screenshot, generi, piattaforme, sviluppatore, publisher, valutazione e Metacritic

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
- [ ] Motivare nella documentazione le scelte diverse dal subject: PostgreSQL, Docker ed eventuali IDE alternativi
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
| Wishlist | Da decidere | Valutare se riusare la struttura dei preferiti | Endpoint di aggiunta, rimozione e lista | Pulsante e pagina dedicata |
| Statistiche personali | Da decidere | Salvare i giochi consultati | Calcolo di conteggi e distribuzioni con i dati RAWG | Dashboard |
| Confronto tra giochi | Non previsto | Nessun lavoro | Riuso del dettaglio esistente | Selezione di più giochi e schermata comparativa |
| Specifiche del computer in JSON | Idea fuori dal subject | Colonna JSON sull'utente | Lettura e salvataggio | Modulo nell'area personale |

Le specifiche del computer vanno prima concordate con il docente.
