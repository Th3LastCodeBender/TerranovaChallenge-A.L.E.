# NostroDB — decisioni e punto di ripresa

> **Per Claude:** per riprendere basta questo file. Non rileggere `percorso-db.md`, `ARCHITECTURE_BLUEPRINT.md` o il subject, salvo necessità.
> Rispondi in italiano. L'utente scrive la prima bozza, Claude segnala i problemi e propone le correzioni direttamente.
> Per ogni problema spiega il motivo: in discussione l'utente deve saper difendere lo schema.

## Prossimo passo

L'utente scrive la bozza del caso obbligatorio, nello stile di `Draft.md` (tabella e qualche riga di esempio):
**un utente aggiunge un gioco ai preferiti e poi lo toglie.**

La bozza deve rispondere a:

1. Cosa impedisce di aggiungere due volte lo stesso gioco?
2. Cosa succede ai preferiti se un utente cancella l'account?

Non serve scrivere la tabella degli utenti, la genera Identity. Bisogna solo collegarsi al suo id, che di default è una stringa.

Poi: wishlist (vedere se può riusare la stessa struttura), statistiche, ponte con .NET.

## Progetto

Gaming Explorer: web app per esplorare videogiochi tramite le API RAWG. Gruppo A.L.E., 3 persone. L'utente si occupa del DB.

| Funzionalità | Tipo | Cosa serve nel DB |
|---|---|---|
| Preferiti | Obbligatoria | Quali giochi sono preferiti, e di chi |
| Autenticazione | Bonus, **la facciamo** | Tabelle generate da Identity |
| Wishlist | Bonus, da decidere | Una lista distinta dai preferiti |
| Statistiche personali | Bonus, da decidere | Giochi consultati; genere, piattaforma e rating ricavati da RAWG |

I bonus valgono in tutto +2 punti e contano solo se le funzionalità obbligatorie sono a posto.
Un bonus fuori dal subject (per esempio le specifiche del computer in JSON di `Nostrodb.md`) va concordato con il docente.
Ogni componente del gruppo deve saper spiegare e modificare il codice durante la presentazione.

## Decisioni

### Stack e container

- .NET + Angular + PostgreSQL 17.
- 3 container: frontend, backend, DB.
- Un nginx nel container frontend serve Angular e inoltra `/api` al backend: il browser parla con una sola origine e non serve CORS.
- La porta del DB è pubblicata (7171) per lavorare con `psql`. Nella versione da consegnare solo il backend deve raggiungere il DB.

### Dal blueprint `ft_trasci`

Il blueprint descrive un'altra app (scacchi, Node + Vue): vale come riferimento di organizzazione, il codice non si copia.

- **Si tiene:** migrations all'avvio del backend con tentativi ripetuti, accesso al DB solo tramite un livello dedicato, login con JWT nei cookie.
- **Si toglie:** Vault e ModSecurity con OWASP CRS (basta il `.env`), Socket.IO, Google OAuth, OTP via email.
- **Si rimanda:** Redis, solo se le risposte RAWG diventano un problema.

### Creazione delle tabelle

Con le migrations di EF Core e il provider Npgsql. Il database resta PostgreSQL.

1. Le tabelle e i vincoli si descrivono in C#.
2. `dotnet ef migrations add NomeModifica` genera la migration.
3. La migration viene applicata all'avvio del backend. EF Core segna in una sua tabella quali sono già state eseguite.

`dotnet ef migrations script` mostra l'SQL esatto da controllare. `CHECK`, `UNIQUE` e indici parziali si dichiarano anche in C#. Se serve, una migration può contenere SQL scritto a mano.

### Giochi RAWG

Si salva **solo l'id**, il resto si chiede a RAWG, così i dati sono sempre aggiornati.

| Conseguenza | Come gestirla |
|---|---|
| Una lista di 30 preferiti può richiedere fino a 30 chiamate, e il piano RAWG ha dei limiti | Cache di breve durata nel backend, senza tabelle in più |
| Se RAWG non risponde, la lista non ha titoli né copertine | Errore chiaro, che il subject comunque richiede |
| Senza tabella `giochi` nessuna FK controlla che l'id esista | Il backend lo verifica su RAWG quando si aggiunge il preferito |

Una copia dei dati si aggiunge solo se le statistiche risultano troppo lente.

### Motivazione di PostgreSQL per la documentazione

Il subject suggerisce SQL Server Express, quindi la scelta va motivata:

> Abbiamo scelto PostgreSQL al posto di SQL Server Express per tre motivi. Il responsabile del database lo conosce e lo ha già usato in progetti precedenti, riducendo i rischi di progettazione. È open source e la sua immagine Docker ufficiale è leggera, adatta alla nostra architettura a container su Linux. Si integra con ASP.NET Core Identity ed EF Core tramite il provider Npgsql e offre i vincoli che ci servono per garantire l'integrità dei dati direttamente nel database.

## Stato dello studio

Tappe 0-5 chiuse. Tappa 6 interrotta per scelta dell'utente (mancano REPEATABLE READ, phantom read, lost update, SERIALIZABLE, SAVEPOINT). Tappe 7 e 8 saltate: gli indici si recuperano solo dove servono alle tabelle.

Da fare sul DB di prova `terranova`, se non già fatto: eliminare la tabella `prova` con `DROP TABLE prova;` e salvare il dump in `docs/biblioteca-studio.sql`. Email dell'utente 1 e copia 6 risultano già a posto.

Le tabelle della biblioteca stanno in `terranova`, che ha lo stesso nome del progetto: tenerle separate da quelle vere.
