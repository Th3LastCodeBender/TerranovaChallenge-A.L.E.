# TerranovaChallenge-A.L.E.

Gaming Explorer, progetto della Challenge Terranova del gruppo A.L.E.

Qui c'è solo come farlo partire. Il resto sta in [Documentazione/](Documentazione/).

## Cosa serve

- Docker con Compose v2 (noi usiamo la 2.40), Git e Make
- Un'app su [Twitch Developers](https://dev.twitch.tv/console/apps) per avere Client ID e Client Secret di IGDB (l'account Twitch deve avere la 2FA attiva)
- Facoltativo: una GPU NVIDIA con [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html), solo se si vuole l'LLM veloce

## Avvio

```bash
git clone https://github.com/Th3LastCodeBender/TerranovaChallenge-A.L.E..git
cd TerranovaChallenge-A.L.E.
cp .env.example .env
```

Nel `.env` vanno messi almeno:

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`: quello che volete, la password solo lettere e numeri
- `REDIS_PASSWORD` e `OTP_PEPPER`: due stringhe casuali (`openssl rand -hex 32`)
- `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`: senza queste non arriva nessun gioco
- `EMAIL_CLIENT_ID` e `EMAIL_CLIENT_SECRET`: un Gmail e una sua "password per le app". Servono solo per mandare i codici della 2FA

Poi:

```bash
make all        # costruisce le immagini e avvia tutto (make all_gpu se avete la GPU NVIDIA)
make llm_pull   # solo la prima volta, scarica il modello per "Posso farlo girare?" (~5 GB)
```

L'app è su <http://localhost:8080>. Il primo `make all` ci mette qualche minuto.

## Sviluppo

```bash
make dev        # oppure make dev_gpu se avete la GPU NVIDIA
```

Frontend su <http://localhost:4200>, backend diretto su <http://localhost:3000> (comodo per Postman). Le modifiche al codice in `app/` si vedono senza riavviare niente.

Dopo un pull che porta nuove dipendenze o nuove migrations: `make dev_restart`.

## Comandi utili

```bash
make logs       # log di tutti i container
make ps         # stato dei container
make db         # psql dentro il database
make down       # ferma tutto, i dati restano
make clean      # ferma tutto e CANCELLA i dati del database (chiede conferma)
```

L'elenco completo è in [Infrastruttura.md](Documentazione/Infrastruttura.md#comandi).

## Se qualcosa non parte

- **Il compose si ferma con "manca nel .env"**: manca una variabile, ricontrollate il `.env`.
- **Il backend continua a riavviarsi**: quasi sempre una migration fallita o il DB creato con credenziali diverse da quelle del `.env`. Con `make logs` si vede.
- **Nessun gioco in home**: credenziali Twitch sbagliate o mancanti.
- **"Posso farlo girare?" non risponde**: non avete fatto `make llm_pull`. Senza GPU la prima analisi di un gioco può metterci più di un minuto, poi resta in cache.
