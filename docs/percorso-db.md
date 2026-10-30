# Percorso di apprendimento DB — file di contesto

> **Istruzioni per Claude:** leggi tutto questo file e riprendi esattamente da dove indicato in
> "Stato attuale". Rispetta la sezione "Modalità" senza eccezioni.

## Modalità (regole per Claude)

- Agisci come un **maestro**, non come un risolutore: **non dare soluzioni né codice già pronto** per il progetto.
- Guida con **domande** ("cosa succede se…?", "dove salvi questa informazione se…?") finché l'utente arriva da solo alla risposta.
- Quando l'utente mostra un lavoro (diagramma ER, DDL, query), **non correggerlo direttamente**: fai emergere i problemi con domande.
- Per gli esercizi usa un **dominio giocattolo (biblioteca)**, non il dominio del progetto.
- Si avanza di tappa solo quando l'utente sa rispondere alle domande della tappa con parole sue.
- Per l'installazione/ambiente (Tappa 0) va bene dare comandi concreti: è setup, non la soluzione del progetto. Spiega però cosa fa ogni comando.
- Lingua: italiano.
- A fine tappa aggiorna `docs/appunti.md` con le regole e le definizioni ricavate dall'utente (non anticipare tappe future).

## Chi è l'utente

- Studente 42, nel gruppo **A.L.E.** per la **Terranova Challenge**.
- Deve progettare e realizzare il **database** dell'applicazione descritta nel subject.
- **Non ha mai lavorato con i database.**
- Stack scelto dal gruppo: **.NET (backend) + Angular (frontend) + PostgreSQL**.
- Il subject non è ancora nella repo: chiederlo all'utente quando servirà (dopo le basi).

## Percorso (in ordine di dipendenza)

### Tappa 0 — Ambiente
PostgreSQL in locale (meglio via Docker), saper entrare con `psql`, comandi `\l`, `\dt`, `\d tabella`.

### Tappa 1 — Modello relazionale, Primary Key, Foreign Key
- Entità vs istanza, tabella vs riga.
- Cosa rende buona una PK? Chiave naturale vs surrogata: pro/contro.
- Cosa garantisce una FK? Cosa succede cancellando una riga referenziata?
- Esercizio: entità della biblioteca (libri, autori, utenti, prestiti) + PK motivate.
- Trappola: chiavi che sembrano uniche ma possono cambiare/ripetersi.

### Tappa 2 — Cardinalità e molteplicità
- 1:1, 1:N, N:M: dove va la FK in ciascun caso?
- Perché N:M richiede una tabella in mezzo?
- "Può avere" vs "deve avere" → come si esprime (NULL / NOT NULL).
- Esercizio: diagramma ER biblioteca (libro N:M autore, utente 1:N prestito, prestito → una copia fisica). Domanda guida: "libro" e "copia" sono la stessa entità?
- Trappola: liste dentro una colonna (`autori = "Rossi, Bianchi"`).

### Tappa 3 — Normalizzazione
- Anomalie di inserimento / aggiornamento / cancellazione.
- 1NF, 2NF, 3NF: quale problema risolve ciascuna. Dipendenza funzionale. Quando denormalizzare.
- Esercizio: scomporre `prestiti(utente_nome, utente_email, libro_titolo, autore_nome, data)` fino alla 3NF e confrontare con l'ER della Tappa 2.

### Tappa 4 — DDL, tipi di dato, Enum
- CREATE / ALTER / DROP (DDL — non "DLL"). Esistono anche DCL e TCL.
- `varchar(n)` vs `text`, `timestamp` vs `timestamptz`, `numeric` vs `float` per importi: capire il perché.
- Vincoli: NOT NULL, UNIQUE, CHECK, DEFAULT. `ON DELETE CASCADE / RESTRICT / SET NULL`.
- Enum vs tabella di lookup: vantaggi e problemi nel modificare i valori.
- Esercizio: DDL della biblioteca scritto a mano.

### Tappa 5 — DML e DQL
- Ordine: INSERT/UPDATE/DELETE → SELECT/WHERE → ORDER BY/LIMIT → JOIN (inner, left) → GROUP BY/HAVING + aggregazioni → subquery.
- INNER vs LEFT JOIN nei risultati; WHERE vs HAVING; UPDATE senza WHERE.
- Esercizio: libri mai prestati, utente con più prestiti, autori con più di 2 libri.

### Tappa 6 — Transazioni e ACID
- Significato di A, C, I, D con esempio di cosa va storto senza ciascuna.
- BEGIN, COMMIT, ROLLBACK, SAVEPOINT.
- Anomalie di concorrenza ("vulnerabilità"): dirty read, non-repeatable read, phantom read, lost update ↔ livelli di isolamento. Default di PostgreSQL.
- Esercizio: due terminali `psql`, due bibliotecari che prestano l'ultima copia nello stesso momento.

### Tappa 7 — Indici
- Cos'è un indice (B-tree), costo in scrittura, PK indicizzate in automatico, e le FK in PostgreSQL?
- `EXPLAIN ANALYZE`.
- Esercizio: 100.000 righe con `generate_series`, misurare con e senza indice.

### Tappa 8 — Funzioni e trigger
- Funzioni SQL vs PL/pgSQL, trigger.
- Domanda per il team: quanta logica nel DB e quanta in C#?

### Ponte con .NET
Entity Framework Core: code-first vs database-first, migrations. Saper leggere e giudicare il DDL generato.

### Fase finale — Progetto reale
1. L'utente estrae entità e relazioni dal subject.
2. Claude fa domande finché lo schema regge.
3. Ogni artefatto (ER, DDL, query) viene rivisto con lo stesso metodo socratico.

## Risorse
- Documentazione ufficiale PostgreSQL — capitolo "Tutorial"
- pgexercises.com
- use-the-index-luke.com
- SQLBolt

## Stato attuale

**Tappa corrente:** 4 — DDL, tipi di dato, Enum. Da iniziare.

**Prossima azione:** iniziare la Tappa 4: l'utente scrive a mano in psql il DDL della biblioteca (libri, copie, autori, autore_libri, utenti, prestiti) partendo dallo schema del Draft. Prima far ragionare sui tipi (varchar vs text, timestamp vs timestamptz, numeric vs float per la multa_pagata). Da riprendere: CASCADE e SET NULL (finora conosce solo il blocco = RESTRICT) con prova pratica; id surrogato vs PK composta nella tabella ponte; NULL in UNIQUE con prova pratica; tariffe storiche (valida_dal/valida_al).

## Registro progressi
<!-- Aggiungi una riga ogni volta che completi qualcosa o prendi una decisione. -->
- 2026-10-20 — Definito il percorso. Si parte dalla Tappa 0.
- 2026-10-20 — Tappa 0 iniziata. Ubuntu 26.04, Docker non ancora installato. Dati istruzioni: docker.io + compose v2, docker-compose.yml con postgres:17 e volume nominato, credenziali in .env.
- 2026-10-21 — Docker già installato. Container `terranova-db` avviato (porta host 7171 → 5432). Corretti errore di indentazione YAML (`volumes:` top-level) e mapping porta. `psql` funziona, nessuna tabella. Mancano le risposte alle domande di verifica della Tappa 0.
- 2026-10-21 — Risposte Tappa 0: immagine/container OK; volume e `down -v` OK in teoria (test pratico non ancora fatto); password: conclusione giusta, motivo sbagliato (pensa che il .env venga "copiato" nel container; il vero motivo è che la password viene salvata nel volume al primo init). Iniziata Tappa 1: l'utente dice "ogni libro ha un suo id". Prossimo passo: chi assegna l'id, ISBN vs copia fisica, chiave naturale vs surrogata.
- 2026-10-21 — Password: l'utente ha intuito che sta nel volume, chiarito che si salva l'utente creato al primo init, non la variabile. Tappa 0 chiusa (resta consigliato il test pratico). Tappa 1: l'utente sceglie un id inventato (surrogato) "per avere controllo". Ha saltato le domande su ISBN e copie. Prossimo passo: duplicati con chiave surrogata (serve UNIQUE?), libro vs copia.
- 2026-10-21 — L'utente capisce che il DB non blocca i duplicati e propone controlli nell'app (non conosce ancora i vincoli). Non conosceva l'ISBN: spiegato. Ha intuito da solo il concetto di FK ("righe che puntano ad altre tabelle") e propone tabelle piano/stanza/scaffale. Usata l'analogia con gli array di struct in C. Prossimo passo: dividere gli attributi tra libro e copia, chi deve imporre l'unicità (app o DB).
- 2026-10-21 — L'utente sceglie le regole nel DB. Chiedeva se fossero codice che parte all'inserimento: spiegata la differenza tra vincoli (dichiarati) e trigger (codice, Tappa 8). Scarta l'ISBN come PK perché i libri vecchi non ce l'hanno ✅. Ha diviso correttamente gli attributi tra libro e copia ✅. Domande aperte: quale tabella punta all'altra (FK dal lato N), cosa rendere UNIQUE nella tabella libro, "chi l'ha" appartiene alla copia o a un prestito?
- 2026-10-21 — Bonus: l'utente ha inventato da solo l'entità prestito ✅, ma mette la FK sulla copia (copia → prestito), quindi la direzione è ancora sbagliata. Non ha risposto su UNIQUE né sulla direzione libro/copia. Prossimo passo: quanti prestiti in un anno per una copia, quindi la FK va dal lato "molti"; ridondanza di "quale libro" nel prestito.
- 2026-10-22 — A: copia → libro corretto ✅, ma regola generale non formulata e non applicata a prestito/copia. B: "non serve" corretto, motivo sbagliato ("loop di FK"; in realtà rischio di dati contraddittori). C: risponde "la chiave surrogata" (contraddice quanto capito prima: l'id non blocca i duplicati); buona l'osservazione che il titolo non può essere unico per via delle edizioni.
- 2026-10-22 — A1 ✅ (una cella, un valore). A2: capisce che la copia non può contenere i suoi prestiti (scarta l'array da solo) ma non ha ancora detto esplicitamente "FK in prestito" né formulato la regola. B: vuole "proteggere" l'assegnazione; intuisce che la copia è la fonte giusta → portarlo a "salvare ogni fatto una volta sola". C: propone una "guardia" (= vincolo UNIQUE, non ancora nominato) senza dire su quali colonne; propone di generare un ISBN finto per i libri vecchi → far vedere che o è un id surrogato (non blocca duplicati) o è calcolato da altre colonne (allora l'unicità è su quelle). Domanda NULL in UNIQUE ancora saltata.
- 2026-10-22 — A2: si è perso, propone "tabella per utente" o "tabella prestiti per anno" (per non far crescere i dati) → dimentica di aver già creato prestito; trappola tabelle-per-anno (rimandare a indici, Tappa 7). Proposto esercizio con righe concrete da riempire. B1: "non so come potrebbe contraddirsi" = in realtà risposta giusta (non può). B2: vede la duplicazione come "sicurezza" e la rimozione come "ottimizzazione" → concetto chiave da ribaltare: ridondanza = rischio. C: abbandona ISBN generato, ma ancora non dice su quali colonne mettere la guardia.
- 2026-10-22 — A2 ✅: mette copia_id nel prestito, scrive 3 righe corrette e naviga prestito → copia → libro da solo. Regola "lato molti" non ancora detta esplicitamente. Ha scritto l'utente come nome nel prestito. B ✅ chiusa: "un dato univoco è la risposta giusta" (ogni informazione in un solo posto). C: propone titolo + data pubblicazione + edizione; mancano autore e una data assoluta (scrive "6 anni fa").
- 2026-10-22 — Utenti ✅: crea da solo la tabella utenti e mette la chiave nel prestito al posto del nome. C ✅ (concettualmente): unicità su titolo + autore + data precisa + edizione; l'utente chiede di accettare risposte concettuali senza dettagli. Regola FK: risponde con principi generici ("dati univoci, evitare di saltare tra tabelle") → non ancora formulata.
- 2026-10-22 — Regola FK: la dice per intuito ("dal lato molti") ma chiede cosa significa → spiegata con "ogni riga del lato molti ha UN solo riferimento, quindi ci sta in una cella" + test pratico "ogni X ha un solo Y?". ON DELETE: propone da solo di non cancellare la copia ma segnarla come non reperibile, per tenere lo storico ✅ (cancellazione logica).
- 2026-10-22 — ON DELETE: propone da solo di bloccare la cancellazione di una riga referenziata (= RESTRICT/NO ACTION, comportamento di default della FK) ✅. Non ha elencato le alternative (CASCADE, SET NULL) → rimandate alla Tappa 4. **Tappa 1 chiusa.** Iniziata Tappa 2 con libro–autore N:M.
- 2026-10-22 — Creato `docs/appunti.md` con regole e definizioni delle Tappe 0 e 1.
- 2026-10-22 — Tappa 2: test "ogni X ha un solo Y?" applicato a libro–autore in entrambe le direzioni ✅ (entrambi falliscono). Prossimo passo: far vedere che la FK non sta né in libro né in autore (esercizio con righe concrete), senza suggerire la tabella in mezzo.
- 2026-10-22 — Esercizio libro–autore: mette la FK in entrambe le tabelle e risolve il N:M duplicando le righe (Good Omens 2 volte, Pratchett 2 volte); nella tabella autori Pratchett punta a 1 e 2 (entrambi Good Omens), Mort sparito → le due tabelle si contraddicono. Prossimo passo: far contare le entità reali, far notare la contraddizione e collegarla a "ogni fatto in un solo posto".
- 2026-10-22 — Capisce che duplicare le righe crea entità finte (4 libri invece di 3, 4 autori invece di 2) ✅. Non ha notato Mort sparito. Propone "una tabella per autore" (stessa trappola di tabella-per-utente/anno). Prossimo passo: domanda "nuovo autore = nuova tabella?" + analogia con prestito (riga che collega UN utente a UNA copia), senza nominare la tabella ponte.
- 2026-10-22 — Con l'analogia del prestito capisce che ogni fatto "X ha scritto Y" ha 1 autore e 1 libro ✅ ed elenca correttamente i 4 fatti ✅. Prossimo passo: trasformare i fatti in righe con gli id → arriverci da solo alla tabella ponte, poi ripulire libri/autori dalle FK.
- 2026-10-22 — Autori ora puliti (2 righe, nessuna FK) ✅. Libri però contiene i 4 fatti (titolo + autore FK): Good Omens duplicato → metà problema risolto. Non ha ancora creato una terza tabella. Prossimo passo: "cosa rappresenta una riga di libri?", vincolo libri = esattamente 3 righe, dove finiscono i 4 fatti.
- 2026-10-22 — Libri ora 3 righe ✅ ma cade nella trappola lista in colonna (Good Omens → autore "1, 2"). Prossimo passo: ricordargli la sua regola "una cella, un valore" + i fatti non sono né libri né autori, come il prestito non è né utente né copia.
- 2026-10-22 — Scarta copie come posto per i fatti ✅ e propone da solo "una terza tabella che rappresenta chi ha scritto cosa" ✅ (tabella ponte, non ancora nominata). Dubbio: "non avrei di nuovo righe multiple?" → distinguere righe che duplicano un'entità (male) da una riga per ogni fatto (giusto, come prestiti). Prossimo passo: fargli scrivere la terza tabella con gli id.
- 2026-10-22 — N:M risolto da solo ✅: libri (3 righe), autori (2 righe), terza tabella con id_libro + id_autore (4 righe = 4 fatti), riconosce che "non duplico nulla, sono fatti". Dato il nome: tabella ponte/associativa. Ha intuito che può avere "altre informazioni utili" (attributi della relazione). Prossimo passo: formulare la regola N:M con parole sue; riga 5 = (1,1) di nuovo → serve l'id? unicità sulla coppia. Poi 1:1 e NULL/NOT NULL.
- 2026-10-22 — Guardia sulla coppia (id_libro, id_autore) ✅. Regola N:M formulata da solo: "ponte quando X multiple corrispondono a Y multiple" (test fallisce in entrambe le direzioni) ✅. Questione id surrogato vs PK composta nella ponte lasciata aperta (scelta legittima, riprendere in Tappa 4). Prossimo: 1:1 (utente–tessera) e poi NULL/NOT NULL.
- 2026-10-22 — 1:1 utente–tessera: sceglie di fondere la tessera nella riga dell'utente ✅ (soluzione tipica per 1:1) con id tessera "non replicabile" (= UNIQUE) ✅. Ma lo chiama "id di una tessera" → chiarire che senza tabella tessere non è una FK, è un attributo UNIQUE. Prossimo: tessera persa e sostituita (1:1 che nel tempo diventa 1:N) e utente senza tessera ancora (NULL / può vs deve).
- 2026-10-22 — Tessera = attributo, non FK ✅. Tessera persa: propone tabella di tessere perse da monitorare (scelta valida) → nel tempo utente–tessera diventa 1:N, da far notare. Tessera non ritirata: propone colonna "stato non attiva" e una tabella tessere solo se le info crescono (buon senso ✅), ma non ha detto cosa c'è nel numero tessera intanto → introdurre NULL, poi può/deve (NULL vs NOT NULL).
- 2026-10-22 — Tessere perse: righe, non colonne ✅; 1:1 diventa 1:N con lo storico (spiegato). Giulia/Luca: prima pensava che la guardia guardasse i nomi, poi capisce che NON_RITIRATA duplicato viene bloccato ✅. Scarta da solo i valori magici/eccezioni perché rischiosi ✅ e propone numero generato all'iscrizione + colonna attiva/non attiva (valida). Introdotto NULL per nome (assenza di valore, ignorato da UNIQUE). Prossimo: può/deve sulle colonne di prestiti (data_restituzione vs copia_id) → NOT NULL.
- 2026-10-22 — Può/deve sulle colonne di prestiti tutto corretto ✅ (solo data_restituzione può essere NULL). **Tappa 2 chiusa.** Aggiornato `docs/appunti.md` con la Tappa 2.
- 2026-10-22 — Tappa 3 iniziata: tabella unica prestiti(utente_nome, utente_email, libro_titolo, autore_nome, data) con tre scenari (inserimento libro nuovo, cambio email, cancellazione unico prestito) per far emergere le anomalie.
- 2026-10-22 — Tre anomalie riconosciute ✅ (inserimento: libro senza prestito; aggiornamento: Mario con più email dopo script interrotto; cancellazione: perso Coraline e Gaiman). Sulla 2 aveva prima deviato sul problema identificazione (giusto ma non il punto). Prossimo: causa comune → dipendenze funzionali ("se conosco X conosco Y?").
- 2026-10-22 — Dipendenze trovate ✅: email → nome, titolo → autore, data dipende dal singolo prestito. Nominata "dipendenza funzionale". Prossimo: causa delle anomalie = dipendenze che non riguardano il prestito salvate nel prestito → scomporre la tabella e confrontare con lo schema della Tappa 2 (attenzione: autore è N:M).
- 2026-10-22 — Scomposizione ✅: libri, copie, autori, autore_libri (ponte), utenti, prestiti (utente_id, copia, data_inizio, data_fine NULL). titolo→autore gestito come N:M. Libro 4 senza autore e autore Magico senza libri (riga ponte mancante, probabilmente distrazione) → usarlo come prova che l anomalia di inserimento è sparita. Prossimo: rifare i 3 scenari sul nuovo schema, poi 1NF/2NF/3NF.
- 2026-10-22 — Verifica scenari sul nuovo schema ✅ (inserimento libero, aggiornamento 1 riga, cancellazione prestito non tocca il libro). Piccolo errore di navigazione: indica Mort come mai prestato (è in prestito 1 via copia 4). Prossimo: 1NF/2NF/3NF come esercizio di abbinamento forma ↔ errore già visto.
- 2026-10-22 — Abbinamento forme normali tutto corretto ✅ (A lista in cella → 1NF, B email→nome → 3NF, C titolo nella ponte dipende solo da id_libro → 2NF), risposte secche senza spiegare la dipendenza. Prossimo: quando denormalizzare (contatore prestiti in utenti = ridondanza; tariffa multa salvata nel prestito = fatto diverso, fotografia nel tempo).
- 2026-10-22 — Contatore: capisce vantaggio (lettura veloce) e rischio (desincronizzazione per crash/dimenticanza) ✅, preferisce che sia il DB a garantire. Anticipati: transazioni (T6) per il crash, indici (T7) per contare senza scorrere tutto, trigger (T8) per tenerlo sincronizzato. Prossimo: caso multa/tariffa (fotografia nel tempo ≠ duplicazione), con contesto chiaro.
- 2026-10-22 — Multa: capisce che con la tariffa attuale lo storico mente ✅, propone tariffe con periodo di validità (tecnica valida) ✅, e che l'importo pagato con sconto è un fatto nuovo del prestito ✅ (fotografia ≠ duplicazione). **Tappa 3 chiusa.** Aggiornato `docs/appunti.md` con la Tappa 3.
- 2026-10-30 — Tappa 4 iniziata (nuova macchina: va ricreato il `.env` e avviato il container). Tipi: varchar(n) vs text non conosciuto, non vuole limitare i titoli ma pensa al limite come difesa da crash/exploit (da chiarire: la difesa sta nell'app e nelle query parametrizzate, il limite è una regola sui dati). Sceglie `date` per i prestiti → verificare con due prestiti della stessa copia nello stesso giorno. float vs numeric ✅ (lo collega ai float in C e al fixed-point). Prossimo: prova pratica varchar(5), ordine dei prestiti nello stesso giorno, numeric(p,s).
- 2026-10-30 — Prova varchar(5) ✅ (rifiutato, nessun crash). Vuole limiti su scaffale e nomi (50) → da mettere in dubbio: nomi lunghi reali, costo dell'errore; scaffale: la regola è la lunghezza o il formato (nel Draft c'è "Golden")? Capisce che `date` non basta ✅ e propone timestamp; chiede chi si occupa della rappresentazione → proposto esperimento timestamp vs timestamptz con SET TIME ZONE. Domande sicurezza (injection/limite lato app) e numeric(p,s) ancora senza risposta.
- 2026-10-30 — Nomi senza limite ✅. Scaffali: "chiedere alla biblioteca e adattare il DB" ✅ → introdotto CHECK (formato vs lunghezza). timestamptz scelto ✅, rappresentazione al front ✅. Sicurezza: ordine front → back → DB giusto, ma non ha concluso dove va il limite (front aggirabile con curl → back) né che l'injection non dipende dalla lunghezza (query parametrizzate). numeric ✅ ma p/s non spiegati → esperimento con numeric(5,2). Prossimo: CHECK sullo scaffale e primo CREATE TABLE a mano (libri, autori).
- 2026-10-30 — numeric(p,s): capisce che sono le impostazioni del fixed-point, s = 2 decimali ✅. Pensa che p sia solo la parte intera ("grande quanto vuoi") → p = cifre totali; non ha notato che 12.345 viene arrotondato in silenzio (errore solo sull'overflow). Prossimo: arrotondamento silenzioso, numeric senza p/s vs limite come regola (multa con uno zero in più), multe negative → CHECK. Ancora aperti: dove va il limite sulle richieste (back), CHECK scaffale, DDL libri/autori.
- 2026-10-30 — numeric: rifiutare > modificare in silenzio ✅, p = cifre totali ✅, errore solo sulla parte intera ✅; dice "tronca" ma in realtà arrotonda (12.345 → 12.35). Multe negative: CHECK > 0 ✅ (aperto: 0 è una multa valida? condonata?). Domanda sicurezza (primo livello controllato = back) saltata due volte → rimandata al ponte .NET. Prossimo: DDL libri/autori, poi CHECK scaffale in copie.
- 2026-10-30 — Arrotondamento: risponde "le multe nascono già con 2 decimali" → chi lo garantisce? (contraddice "regole nel DB"; numeric(p,2) arrotonda senza errore). Condono: pagata con importo 0 ✅ ma va in conflitto con il suo CHECK > 0. Primo DDL: `id GENERATED int AS IDENTITY` → errore di sintassi (ordine nome/tipo/vincoli). Mancano ancora PK, NOT NULL, guardia anti-duplicati.
- 2026-10-30 — GENERATED: ordine nome/tipo/proprietà ✅; dopo l'esperimento sceglie ALWAYS ✅ ("by default la precompila ma me la fa modificare"). Non ha commentato gli id duplicati nella tabella b (senza PK: due righe con id 1) → usarlo per introdurre PRIMARY KEY. Prossimo: DDL libri con PK, NOT NULL, UNIQUE.
- 2026-10-30 — PK: tira a indovinare la sintassi (CHECK (PRIMARY KEY), PROPRIETARY KEY, UNIQUE KEY) → data la sintassi `... AS IDENTITY PRIMARY KEY` (è sintassi, non progetto) e mostrato `\h CREATE TABLE`. Ha scritto `CHECK (titolo != NULL)` → trappola: il confronto con NULL dà NULL e il CHECK lo lascia passare. Esperimento proposto per farglielo scoprire, poi NOT NULL (già visto in Tappa 2).
- 2026-10-30 — Esperimenti NULL fatti (insert NULL passa il CHECK, confronti con NULL → NULL), ma non ricorda NOT NULL e chiede la risposta diretta → data (era già nei suoi appunti della Tappa 2), con spiegazione della logica a tre valori. Segnale di stanchezza: dosare le domande, una alla volta. Prossimo: DROP + ricreare libri con PK e NOT NULL; ALTER ... SET NOT NULL con righe NULL già presenti.
- 2026-10-30 — libri ricreata con PK + NOT NULL ✅. ALTER SET NOT NULL con NULL presenti: capisce che il DB rifiuta ✅; prima propone di cancellare le righe, poi di modificarle ✅. Prossimo: modificare con quale valore (rischio valore magico "SCONOSCIUTO", regola 7 Tappa 2), poi guardia anti-duplicati (UNIQUE) su libri.
- 2026-10-30 — Libri senza titolo: decide che non devono esistere → NOT NULL confermato come regola di dominio ✅. Prossimo: UNIQUE su libri (l'autore ora sta nella ponte: un UNIQUE può attraversare tabelle?), poi NULL in UNIQUE con edizione mancante.
- 2026-10-30 — Guardia libri: aggiunge la lingua ✅; capisce che titolo+data+edizione+lingua blocca due libri diversi (caso "Ritorno") ✅. Non ha capito la domanda "UNIQUE su colonna di un'altra tabella" → riformulata con esperimento. Torna all'ISBN: chiede come l'avevamo deciso → ricordato (non PK perché i vecchi non ce l'hanno) e proposto ISBN come colonna normale NULL + UNIQUE, con prova pratica NULL in UNIQUE (punto rimasto aperto dalla Tappa 2).
- 2026-10-30 — ISBN NULL in UNIQUE: spiegato con il suo esempio Giulia/Luca (non voleva testare). Per i libri senza ISBN non trovava guardie; propone l'autore e da solo nota il problema "più autori" → spiegato limite dei vincoli dichiarati (UNIQUE solo su colonne della propria tabella, non su insiemi). Sceglie mix A (guardia composta senza autore, con editore) + C (avviso dall'app) ✅. Prossimo: DDL completo di libri; trappola NULL nella guardia composta (edizione NULL → duplicati passano), poi NULLS NOT DISTINCT.
- 2026-10-30 — Vuole imparare ALTER invece di DROP ✅ (date forme principali di ALTER TABLE). Tentato `editore text BY DEFAULT 'self published'` → sintassi DEFAULT data; domanda aperta: un default inventato è un dato falso (come NON_RITIRATA). Data di pubblicazione: capisce che `date` valida il calendario ma non la plausibilità; testo per l'anno scartato con l'esperimento '999' < '1950'; sceglie integer ✅; EXTRACT(YEAR ...) come "parser"; precisione variabile (data esatta vs solo anno) → sceglie per semplicità solo l'anno ✅. Prossimo: ALTER con anno + CHECK (limite inferiore e anno corrente), poi chiudere editore/default, guardia composta e NULL nella guardia.
- 2026-10-30 — Stato di libri (via ALTER): id identity+PK, titolo text NOT NULL, edizione text NOT NULL, editore text DEFAULT 'self published', data_di_pubblicazione smallint + CHECK <= anno corrente ✅ (manca il limite inferiore; il nome non è più vero), isbn varchar(13) (limite con regola vera 👍, ma trattini/ISBN-10?; UNIQUE da verificare). Manca la guardia composta. Domande aperte: default editore, edizione NOT NULL per libri vecchi, nome colonna.
- 2026-10-30 — ISBN: spiegati ISBN-10/13 (stesso codice, conversione con prefisso 978, cifra di controllo, trattini solo visivi, ISBN = edizione + formato). Dopo aver proposto colonne isbn_10/isbn_13/altri capisce che basta il 13 ✅ e formula l'algoritmo di normalizzazione (10 → converto, 13 → ok, altro → rifiuto) ✅. Divisione backend (trasforma) / DB (ultima guardia) rimandata al ponte .NET. CHECK regex `isbn_13 ~ '^[0-9]{13}$'`: condizione giusta da solo ✅, non ricorda la parola CHECK (stanchezza). Chiede come aggiungere UNIQUE. Domanda aperta: una riga di libri è un'opera o un'edizione+formato?
