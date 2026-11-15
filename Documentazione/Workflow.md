# Come abbiamo lavorato

## In breve

Siamo in tre e ci siamo divisi per livello: uno sul frontend (Angular), (Edoardo), uno sul backend (route, login, sicurezza) (Andrea), uno su infrastruttura, database, query, can-i-run (Leonardo).

Ogni livello ha il suo branch e il branch `main` tiene solo quello che serve a far girare tutto insieme (Docker, Makefile, documentazione). Con i git worktree ognuno lavora sulla sua cartella ma l'app si avvia da `main` con un comando.

## Organizzazione

- **Branch per livello**: `frontend`, `backend_ts`, `DataBase`. Frontend e backend hanno tutti e due `src/` e `package.json` nella root, metterli nello stesso branch voleva dire riorganizzare tutto e litigare sui merge.
- **Worktree**: `make setup` monta ogni branch nella sua cartella sotto `app/`. Un commit fatto in `app/02_backend` va su `backend_ts`, uno fatto nella root va su `main`.
- **Commit**: tutti nello stesso formato, `KEYWORD STATO | messaggio | file`, con uno script nostro (vedi [Tools.md](Tools.md)). Così dal log si capisce subito cosa è una feature, cosa un bug e cosa documentazione.
- **Lista delle cose da fare**: in `TODO.md` su `main`, divisa per area. Le decisioni che bloccavano più persone (formato delle API, login, credenziali Twitch) le abbiamo prese insieme all'inizio.
- **Database**: lo schema lo tocca solo chi fa le query, sempre con le migrations. Così nessuno si ritrova un DB diverso da quello degli altri.
- **API**: le route sono provate con la collection Postman in `postman/`, che si può lanciare anche da terminale con newman.

## Il cambio di stack

All'inizio il backend era in .NET con RAWG, come suggerito dal subject. Il 6 novembre siamo passati a **Next.js + Prisma** e a **IGDB**:

- TypeScript sia nel frontend che nel backend, quindi tutti possono leggere il codice degli altri
- Prisma ci dà migrations in SQL leggibile e un client tipizzato
- IGDB ha più dati dei giochi (aziende, edizioni, collegamenti agli store, che ci servivano per Steam)

L'infrastruttura su `main` era già fatta per .NET: abbiamo cambiato solo Dockerfile e compose del backend, il resto (reti, nginx, Makefile) è rimasto uguale.

## Scelte DevOps

### Tutto in Docker Compose

Chi valuta il progetto, e ognuno di noi, ha le stesse versioni di Node, Postgres e Redis senza installare niente oltre a Docker. Kubernetes o simili per un progetto così sarebbero stati eccessivi: un compose basta e si legge in cinque minuti.

### Make davanti a tutto

I comandi di Docker sono lunghi e facili da sbagliare (soprattutto con due o tre file compose insieme). Il Makefile li nasconde: `make all`, `make dev`, `make db`. I comandi pericolosi (`clean`, `fclean`) chiedono conferma.

### Due compose: finale e sviluppo

- `make all` costruisce le immagini vere ed è quello che si consegna.
- `make dev` aggiunge un file sopra (`docker-compose.dev.yml`) che monta il codice e lancia `ng serve` e `next dev`, così le modifiche si vedono subito.

Con un override invece di due compose separati, DB, Redis, reti e variabili restano scritti una volta sola. In sviluppo `node_modules` sta in un volume Docker: se no i pacchetti compilati per Alpine finiscono nella cartella del progetto e si rompono sul nostro PC.

### Reti separate e una sola porta

Il frontend sta su una rete, DB e Redis su un'altra, il backend su tutte e due. Se nginx venisse bucato non arriverebbe comunque al database. All'esterno è aperta solo la 8080, e siccome pagina e API passano dallo stesso nginx non serve CORS.

### Healthcheck e ordine di avvio

Senza healthcheck il backend partiva prima che Postgres accettasse connessioni e le migrations fallivano. Ora ogni servizio aspetta che quelli da cui dipende siano sani. Il backend apposta non aspetta Ollama: se l'LLM non c'è, solo "Posso farlo girare?" smette di funzionare.

### Migrations all'avvio

Il backend fa `prisma migrate deploy` ogni volta che parte. Chi fa pull non deve ricordarsi niente, e un DB nuovo (per esempio quello di chi corregge) si crea da solo.

### Un solo `.env`

Tutte le variabili stanno nel `.env` della root, con i nomi usati dal codice. Il compose le passa intere al backend e prende da lì quelle di Postgres e Redis. Se manca una variabile importante il compose si ferma subito con un errore chiaro, invece di far partire un backend rotto. Il `.env` non si committa, c'è `.env.example`.

### Ollama nel compose

L'LLM gira in locale nello stesso compose, così il progetto non dipende da un'API a pagamento. La GPU è facoltativa (`make dev_gpu`), e il modello sta in un volume che nemmeno `make fclean` cancella, perché riscaricare 5 GB ogni volta non ha senso.

## Cosa non abbiamo fatto

- **Niente CI**: non c'è una pipeline che builda e testa a ogni push. I test li abbiamo fatti a mano con Postman/newman e provando l'app dal browser.
- **Immagine del backend pesante**: si porta dietro le dipendenze di sviluppo. Una build multi-stage la ridurrebbe, ma abbiamo preferito un Dockerfile semplice da spiegare.
- **Merge su `main`**: prima della consegna i branch vanno importati in `main` nelle stesse cartelle, così la repo si usa anche senza worktree.
