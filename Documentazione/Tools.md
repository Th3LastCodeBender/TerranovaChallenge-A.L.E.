# Tool di sviluppo

Ogni tool sta in una sottocartella di `scripts/` con il suo `Makefile`.
Il `Makefile` di `scripts/` lancia lo stesso target in tutti i tool:

```bash
cd scripts
make install                  # installa tutti i tool
make uninstall                # li rimuove
make install TOOLS="commit"   # solo i tool indicati
make list                     # elenca i tool trovati
```

## Script di commit (`scripts/commit/`)

Comando `commit` che crea commit nel formato `KEYWORD [SECONDA KEYWORD] | messaggio | file1, file2, file3...` e fa il push.
Ci piace usare git da terminale, ma a volte diventa verbonso, questo script ci da la possibilità di avere un pochino di automazione con un discreto controllo.

### Installazione

```bash
cd scripts/commit
make install     # installa 'commit' in ~/.local/bin
make uninstall   # lo rimuove
```

### Utilizzo

```bash
commit                 # menu interattivo, stage di tutta la repo (git add -A)
commit 1 3 file1 file2 # FEATURE: WORK IN PROGRESS, solo i file indicati
commit 13              # equivalente a "commit 1 3"
commit --add           # aggiunge una nuova keyword o un nuovo stato
commit -h              # aiuto
```

`commit --add` permette di aggiungere una keyword personalizzata
Massimo 9 keyword e 9 stati per keyword... (Facciamocele bastare su)

| # | Keyword     | Stati                                                       |
|---|-------------|-------------------------------------------------------------|
| 1 | FEATURE     | 1 NEW · 2 UPDATE · 3 WORK IN PROGRESS · 4 DONE              |
| 2 | BUG         | 1 FOUND · 2 FIX IN PROGRESS · 3 SOLVED                      |
| 3 | REFACTORING | —                                                           |
| 4 | CLEANING    | —                                                           |
| 5 | PERFORMANCE | —                                                           |
| 6 | TEST        | —                                                           |
| 7 | WORKFLOW    | —                                                           |
| 8 | MERGE       | —                                                           |

Note: lo script si rifiuta di partire se ci sono già modifiche in stage.
Se il push non va a buon fine lo script ti avverte cosi che tu possa fixare il problema e fare `git push` manualmente
