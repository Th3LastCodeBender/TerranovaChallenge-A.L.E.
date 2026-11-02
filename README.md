# TerranovaChallenge-A.L.E.
Progetto della Challenge Terranova da parte del gruppo A.L.E

## Tool di sviluppo

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

Comando `commit` che crea commit nel formato `KEYWORD[: STATO] | messaggio | file1, file2, file3...` e fa il push.
Pensato per lo sviluppo e non per la produzione.

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

`commit --add` chiede se aggiungere una keyword (con eventuali stati) o uno stato a una keyword esistente,
e salva il risultato direttamente nel blocco `# >>> keyword >>>` di `scripts/commit/commit.sh`: committalo per condividerlo col gruppo.
Massimo 9 keyword e 9 stati per keyword, così i codici combinati (es. `13`) restano a due cifre.

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
