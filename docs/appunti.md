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
