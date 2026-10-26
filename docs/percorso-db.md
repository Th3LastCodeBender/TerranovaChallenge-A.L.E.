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
