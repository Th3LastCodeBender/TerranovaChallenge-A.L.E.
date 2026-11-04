# TerranovaChallenge-A.L.E.
Progetto della Challenge Terranova da parte del gruppo A.L.E

## Requisiti

- Docker con Docker Compose v2 (la versione che usiamo noi è la 2.40)
- Git e Make
- Una chiave API di [RAWG](https://rawg.io/apidocs) sperando che rawg non sia down come al solito

## Avvio

```bash
git clone https://github.com/Th3LastCodeBender/TerranovaChallenge-A.L.E..git
cd TerranovaChallenge-A.L.E.
cp .env.example .env
```

Apri `.env`, inserisci la chiave in `Rawg__ApiKey` e scegli una password per il database. Poi lancia:

```bash
make all
```

L'applicazione è su <http://localhost:8080>.

## Sviluppo

```bash
make dev
```

L'applicazione è su <http://localhost:4200>. Le modifiche ai sorgenti in `app/` si applicano senza riavviare i container. Il primo avvio richiede qualche minuto; con `make logs` puoi seguirne l'avanzamento.

Il frontend deve chiamare il backend con percorsi relativi, come `/api/v1/games`. Gli endpoint nuovi devono stare sotto `/api`, altrimenti non sono raggiungibili dal browser.

## Struttura

Il branch `main` contiene l'infrastruttura. Ogni livello ha il suo branch, collegato come worktree da `make setup`, che `make all` e `make dev` lanciano in automatico.

| Cartella | Branch | Contenuto |
| --- | --- | --- |
| `.` | `main` | Makefile, compose, `Docker/`, `Docs/` |
| `app/01_frontend` | `frontend` | Angular |
| `app/02_backend` | `backend` | .NET |
| `app/03_db` | `DataBase` | Materiale sul database |

I commit fatti dentro una cartella finiscono sul suo branch. Le modifiche a Makefile e compose si committano dalla root, su `main`.

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `make all` | Costruisce e avvia la versione da consegnare |
| `make dev` | Avvia la versione di sviluppo |
| `make dev_restart` | Riavvia frontend e backend dopo un cambio di dipendenze |
| `make down` | Ferma i container e conserva i dati |
| `make re` | Ferma i container e rilancia `make all` |
| `make ps` | Mostra lo stato dei container |
| `make logs` | Segue i log |
| `make db` | Apre `psql` sul database |
| `make status` | Mostra lo stato di tutti i worktree |
| `make clean` | Ferma i container e **cancella i dati del database** |
| `make fclean` | **Cancella immagini, container e reti non in uso di tutto Docker**, anche di altri progetti |
