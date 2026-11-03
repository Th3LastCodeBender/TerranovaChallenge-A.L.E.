# Appunti DB

Regole e definizioni ricavate durante il percorso (vedi `percorso-db.md`).
Esempi sul dominio giocattolo: **biblioteca**.

---

## Tappa 0 — Ambiente (Docker + PostgreSQL)

| Concetto | Definizione |
|---|---|
| **Immagine** | Il modello (es. `postgres:17`). Non gira, è lo stampo. |
| **Container** | Un'istanza che gira, creata da un'immagine. |
| **Volume** | Dove vivono i dati, fuori dal container. Sopravvive al container. |
| `docker compose down` | Spegne e rimuove i container. **I dati restano** nel volume. |
| `docker compose down -v` | Rimuove anche i volumi. **I dati sono persi.** |

- La password nel `.env` serve **solo al primo avvio**: lì viene creato l'utente e salvato nel volume.
  Cambiare il `.env` dopo non cambia niente; l'utente esiste già nel volume.

---

## Tappa 1 — Modello relazionale, PK, FK

### Definizioni

| Termine | Cosa vuol dire |
|---|---|
| **Entità** | Un "tipo di cosa" che vuoi ricordare (libro, copia, utente, prestito). Diventa una **tabella**. |
| **Istanza** | Un singolo esemplare di quell'entità (il libro *Il nome della rosa*). Diventa una **riga**. |
| **Attributo** | Una caratteristica dell'entità (titolo, scaffale…). Diventa una **colonna**. |
| **Primary Key (PK)** | La colonna che identifica una riga in modo univoco. |
| **Chiave naturale** | Una PK presa dal mondo reale (es. ISBN). |
| **Chiave surrogata** | Una PK inventata dal DB (es. `id` 1, 2, 3…). Non ha significato fuori dal DB. |
| **Vincolo** | Una regola **dichiarata** su una colonna, che il DB fa rispettare a tutti. Non è codice che scrivi tu. |
| **Foreign Key (FK)** | Una colonna che contiene la PK di una riga di un'altra tabella: la riga "punta" a quella riga. |
| **Cancellazione logica** | Invece di cancellare la riga, la segni come non più valida (es. copia "non reperibile"). Lo storico resta. |

> Analogia C: una FK è come salvare in una struct l'**indice** di un elemento di un altro array,
> invece di copiarci dentro l'elemento.

### Regole

1. **Ogni riga ha una PK.** Qui scegliamo una chiave **surrogata** perché ci dà controllo:
   le chiavi naturali possono mancare (i libri vecchi non hanno ISBN) o cambiare.

2. **La PK non impedisce i duplicati.** Lo stesso libro inserito due volte prende id 1 e id 2.
   Per bloccare i duplicati serve un **vincolo di unicità** sulle colonne che definiscono "lo stesso libro"
   (es. titolo + autore + data di pubblicazione + edizione). Il titolo da solo non basta.

3. **Le regole sui dati vanno nel DB, non solo nell'app.** Un vincolo vale per chiunque scriva nel DB.
   - *Vincolo* = regola dichiarata.
   - *Trigger* = codice che parte all'inserimento (Tappa 8).

4. **Se un gruppo di attributi cambia per ogni esemplare, è un'entità diversa.**

   | libro (uguale per tutte le copie) | copia (diverso per ogni copia) |
   |---|---|
   | titolo, autore, ISBN, anno, pagine | stato di usura, scaffale, data di acquisto |

   Anche un **evento** può essere un'entità: il **prestito** (chi, quale copia, quando, se è stato restituito).

5. **Una cella contiene un solo valore.** Niente liste o array dentro una colonna.

6. **Direzione della FK: va dal lato "molti".**
   Test: *"ogni X ha un solo Y?"* → se la risposta è sì, `Y_id` va in X.

   | lato "uno" | lato "molti" | dove va la FK |
   |---|---|---|
   | libro | copia | `copia.libro_id` |
   | copia | prestito | `prestito.copia_id` |
   | utente | prestito | `prestito.utente_id` |

   Perché: ogni riga del lato "molti" punta a **una sola** riga dell'altra tabella, quindi le basta una cella.

7. **Ogni informazione va salvata in un posto solo.**
   Il prestito **non** contiene `libro_id`: si ricava passando prestito → copia → libro.
   Se lo salvassi due volte, potrebbero contraddirsi (prestito dice libro 5, la copia dice libro 7) e nessuno saprebbe quale è giusto.
   Passare da una tabella all'altra è il prezzo, piccolo, di avere dati coerenti.

8. **Niente dati "derivati" o relativi.** Salva valori assoluti: la data di pubblicazione, non "6 anni fa".

9. **Non si salva un nome al posto di una entità.** Nel prestito non scrivi `giorgio`, ma `utente_id`.
   Due Giorgio diversi restano distinti e i dati dell'utente si aggiornano in un solo posto.

10. **La FK protegge i riferimenti.** Il DB garantisce che una FK punti a una riga che esiste.
    Se cancelli una riga ancora puntata da altre righe, il DB **rifiuta** la cancellazione
    (comportamento predefinito, `RESTRICT`). Altre opzioni nella Tappa 4.

---

## Tappa 2 — Cardinalità e molteplicità

### Definizioni

| Termine | Cosa vuol dire |
|---|---|
| **Cardinalità** | Quante righe di una tabella possono essere legate a una riga dell'altra: 1:1, 1:N, N:M. |
| **Tabella ponte** | (associativa, di giunzione, *junction table*) Tabella in cui ogni riga è **un fatto** che lega una riga di X a una riga di Y. Es. `libri_autori`: "Pratchett ha scritto Good Omens". |
| **NULL** | "Qui **non c'è nessun valore**". Non è uno zero, né una stringa vuota, né un valore speciale tipo `NON_RITIRATA`. |
| **NOT NULL** | Vincolo: la colonna **deve** avere sempre un valore. |

### Regole

1. **Il test "ogni X ha un solo Y?" si fa in entrambe le direzioni.**

   | Risultato del test | Cardinalità | Dove va il collegamento |
   |---|---|---|
   | sì in una direzione, no nell'altra | 1:N | FK nel lato "molti" |
   | no in entrambe | N:M | **tabella ponte** con due FK |
   | sì in entrambe | 1:1 | spesso nella **stessa riga** (es. numero tessera dentro `utenti`) |

2. **N:M non si risolve duplicando le righe.** Se metti Good Omens due volte in `libri` (una per autore),
   il DB crede che i libri siano 4 invece di 3. Ogni tabella deve avere **una riga per ogni cosa reale**.

3. **La tabella ponte non duplica nulla:** ha una riga per ogni **fatto**, come `prestiti` ha una riga per ogni prestito.
   Può contenere anche informazioni che appartengono al **legame**, non al libro né all'autore.

4. **Nella tabella ponte la coppia di FK non può ripetersi.** Unicità su `(id_libro, id_autore)`:
   una seconda riga `1 | 1` direbbe lo stesso fatto due volte.

5. **Righe, non colonne.** Se qualcosa può ripetersi (3 tessere perse), aggiungi righe.
   Con le colonne (`tessera1`, `tessera2`, `tessera3`) alla quarta dovresti cambiare la struttura.

6. **Molti 1:1 sono 1:N nel tempo.** Se ti serve lo storico (tessere perse), la relazione diventa 1:N.

7. **Niente valori finti con significato speciale.** `NON_RITIRATA` in una colonna con unicità blocca il secondo utente.
   Se il valore non esiste ancora, usa **NULL**. La guardia di unicità non confronta i NULL.

8. **Ogni colonna dichiara se "può" o "deve" avere un valore.**

   | `prestiti` | NULL? | perché |
   |---|---|---|
   | id, utente_id, copia_id, data_prestito | no → NOT NULL | un prestito senza questi dati non esiste |
   | data_restituzione | sì | finché il libro non torna, la data non esiste |

---

## Tappa 3 — Normalizzazione

### Definizioni

| Termine | Cosa vuol dire |
|---|---|
| **Anomalia di inserimento** | Non puoi registrare un fatto senza inventarne un altro (un libro nuovo non entra se nessuno l'ha preso in prestito). |
| **Anomalia di aggiornamento** | Lo stesso fatto è scritto in più righe: un aggiornamento a metà lascia il DB in contraddizione (Mario con due email). |
| **Anomalia di cancellazione** | Cancellando un fatto ne perdi un altro (cancelli l'unico prestito di *Coraline* e sparisce il libro, e con lui Gaiman). |
| **Dipendenza funzionale** `X → Y` | "Se conosco X, conosco Y". Es. `email → nome`, `titolo → autore`. |
| **Normalizzazione** | Spezzare le tabelle seguendo le dipendenze, finché ogni fatto ha un posto suo. |
| **Denormalizzazione** | Rimettere apposta un dato ridondante (es. un contatore) per leggere più in fretta. |

### Le forme normali

| Forma | Regola | Esempio di violazione |
|---|---|---|
| **1NF** | Ogni cella contiene **un solo valore**. | `libri`: `Good Omens | 1, 2` |
| **2NF** | Con una chiave di più colonne, ogni altra colonna dipende dalla chiave **intera**. | `titolo` nella ponte `(id_libro, id_autore)`: dipende solo da `id_libro` |
| **3NF** | Nessuna colonna dipende da **un'altra colonna che non è la chiave**. | `utente_nome` nei prestiti: dipende da `utente_email`, non dal prestito |

### Regole

1. **Causa delle anomalie:** dentro una tabella stanno fatti che non la riguardano
   (`email → nome` è un fatto sull'utente, ma era salvato in ogni prestito).

2. **Rimedio:** ogni dipendenza va nella tabella dell'entità a cui appartiene.
   Partendo dalla tabella unica dei prestiti si ritrova lo schema delle Tappe 1–2:
   `libri`, `copie`, `autori`, `autore_libri`, `utenti`, `prestiti`.

3. **Prima normalizza, poi denormalizza solo se hai misurato che è lento.**
   Un contatore (`numero_prestiti` in `utenti`) rende la lettura veloce, ma salva lo stesso fatto in due posti:
   se un aggiornamento salta o va in crash, i due posti si contraddicono.
   Meglio che a garantirlo sia il DB: transazioni (Tappa 6), indici (Tappa 7), trigger (Tappa 8).

4. **Una fotografia nel tempo non è una duplicazione.**
   "Giorgio ha pagato 2 €" è un **fatto nuovo** del prestito: non si ricava dalla tariffa attuale,
   che può cambiare, né dallo storico delle tariffe (c'è stato uno sconto). Va salvato nel prestito.
   - *Duplicazione* = lo stesso fatto in due posti, che **devono** restare uguali.
   - *Fotografia* = il valore in un certo momento, che **può** essere diverso da quello attuale.

---

## Tappa 4 — DDL, tipi di dato, Enum

### Definizioni

| Termine | Cosa vuol dire |
|---|---|
| **DDL** | I comandi che cambiano la **struttura**: `CREATE`, `ALTER`, `DROP`. |
| `text` / `varchar(n)` | Testo senza limite / con limite. Il limite è una **regola sui dati**, non una difesa: usalo solo se è vero (`isbn_13` = 13 cifre). |
| `date` / `timestamptz` | Solo il giorno / l'istante preciso con fuso. Due prestiti nello stesso giorno si ordinano solo col secondo. |
| `numeric(p,s)` | Decimale esatto, per gli importi. `p` = cifre totali, `s` = decimali. `float` è approssimato. |
| **Sequenza** (`*_seq`) | Il contatore dietro `IDENTITY`. Il numero si consuma anche se l'INSERT fallisce: i buchi negli id sono normali. |
| **CHECK** | Vincolo con una **condizione** sulla riga. Può usare più colonne, ma **solo della propria riga**. |
| **Enum** | Tipo con una lista fissa di etichette. |
| **Tabella di lookup** | Tabella con i valori ammessi, a cui si punta con una FK (`formati`). |
| **Regex** | Descrive com'è fatto un testo: `[0-9]` un carattere, `{n}` n volte, `+` 1 o più volte, `^` inizio testo, `$` fine testo. In SQL sta tra `'...'` e si usa con `~`. |
| **Anonimizzazione** | I dati personali vanno a NULL, la riga resta: i prestiti continuano a puntarci. |
| **Indice unico parziale** | UNIQUE solo sulle righe scelte con un `WHERE` (solo i prestiti aperti). |

### Regole

1. **Ordine di creazione: prima la tabella puntata.** Una FK richiede che la tabella di destinazione esista già.
   `formati` → `libri` → `copie` → `autori` → `utenti` → `autore_libri` → `prestiti`.

2. **Ordine in una colonna:** nome, tipo, proprietà. `ON DELETE` sta subito dopo il suo `REFERENCES`.

3. **Un confronto con NULL dà NULL, e il CHECK rifiuta solo ciò che è falso.**
   - `CHECK (titolo != NULL)` non blocca niente → si usa `NOT NULL`, oppure `IS NULL` / `IS NOT NULL`.
   - Il formato dello scaffale non blocca uno scaffale NULL.
   - Se la colonna del CHECK può essere NULL, il CHECK può passare per sbaglio.

4. **"Se A allora B" in un CHECK si scrive "non A OR B".** `AND` viene valutato prima di `OR`.
   Così una colonna è obbligatoria solo in certi casi (`scaffale` in `copie`, i dati personali in `utenti`).

5. **UNIQUE confronta le righe, CHECK guarda una riga sola.**
   UNIQUE vale solo sulle colonne della propria tabella e non considera uguali i NULL.
   Se il NULL è legittimo nella guardia: `NULLS NOT DISTINCT` (vale per tutto il vincolo).

6. **`ON DELETE`: cosa succede a chi punta alla riga cancellata.**

   | Regola | Quando |
   |---|---|
   | `RESTRICT` | le righe che puntano hanno valore proprio (`copie → libri`, `prestiti → utenti`) |
   | `CASCADE` | la cancellazione le rende inutili (`autore_libri`) |
   | `SET NULL` | il legame è facoltativo. Si contraddice con `NOT NULL` |

7. **CHECK, enum o lookup.**

   | Scelta | Quando |
   |---|---|
   | Enum | solo un'etichetta, valori stabili, gestiti dagli sviluppatori (un valore non si può togliere) |
   | Lookup | servono altre informazioni o i valori li gestisce la biblioteca: aggiungerne uno è un INSERT |
   | CHECK con lista | lista corta e stabile, modificarla è un cambio di struttura |

8. **NULL non dice perché manca un valore.** Se il motivo conta, serve una colonna apposta (`stato`).

9. **Non salvare come stato ciò che si ricava.** "In prestito" non è in `copie.stato`: lo dice `prestiti` con `data_fine` NULL.

10. **Gli stati si escludono a vicenda e ognuno cambia qualcosa.** Se due valori possono valere insieme, non stanno nella stessa colonna.

11. **Un fatto che non conosci non si salva.** Autore sconosciuto = nessuna riga in `autore_libri`, non una riga "Anonimo".

12. **Un DEFAULT deve essere vero.** `'accettazione'` lo è, `'self published'` era un dato inventato.
    Attenzione: aggiungere una colonna con DEFAULT lo scrive anche in tutte le righe vecchie.

---

## Tappa 5 — DML e DQL

### Definizioni

| Termine | Cosa vuol dire |
|---|---|
| **DML** | I comandi che cambiano i **dati**: `INSERT`, `UPDATE`, `DELETE`. |
| **DQL** | La lettura dei dati: `SELECT`. |
| `JOIN` | Tiene solo le righe che trovano corrispondenza. |
| `LEFT JOIN` | Tiene tutte le righe della tabella a sinistra. Dove manca la corrispondenza, le colonne dell'altra tabella sono NULL. |
| `GROUP BY` | Riunisce le righe in gruppi: una riga di risultato per gruppo. |
| `count(*)` / `count(colonna)` | Conta le righe / conta solo i valori non NULL di quella colonna. |
| `WHERE` / `HAVING` | Filtra le righe prima dei gruppi / filtra i gruppi dopo il conteggio. |
| **Subquery** | Una `SELECT` tra parentesi dentro un'altra query, il cui risultato viene usato come valore. |

### Regole

1. **`FROM` e `JOIN` costruiscono una tabella temporanea, `SELECT` sceglie le colonne.** Metti nel JOIN solo le tabelle che usi.

2. **Il JOIN segue le FK, colonna per colonna.** `prestiti.copia_id` si collega a `copie.id`, non a `libri.id` né a `copie.libro`.
   Due interi si confrontano senza errori anche se significano cose diverse: il risultato sbagliato non dà alcun avviso.

3. **Per trovare ciò che manca serve `LEFT JOIN`.** Con il `JOIN` normale le righe senza corrispondenza spariscono, quindi `HAVING count(...) = 0` non trova mai nulla.

4. **Ogni collegamento ha il suo JOIN.** Libri mai prestati, esclusi quelli senza copie: `JOIN` su `copie`, `LEFT JOIN` su `prestiti`.

5. **Nel `SELECT` con `GROUP BY` non può stare una colonna con più valori nel gruppo.** PostgreSQL non saprebbe quale mostrare.
   Raggruppando per PK, le altre colonne di quella tabella sono ammesse: il gruppo riguarda sempre la stessa riga.

6. **Una PK può risultare NULL in un `LEFT JOIN`.** I vincoli valgono sulle righe salvate, non sui risultati di una query. `DEFAULT` agisce solo all'`INSERT`.

7. **`LIMIT 1` nasconde i pari merito senza avvisare.** Per trovarli: trova il massimo con una subquery e confrontalo con `HAVING count(...) = (subquery)`.

8. **Ordine delle clausole:** `SELECT`, `FROM`, `JOIN`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `LIMIT`.

9. **`UPDATE` senza `WHERE` modifica tutte le righe.** Lo stesso vale per `DELETE`.
