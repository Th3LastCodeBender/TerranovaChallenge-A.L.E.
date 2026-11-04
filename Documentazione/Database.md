# Database

Lo schema è deciso da Identity, abbiam poco tempo usiamo quello che già esiste.

## Tabelle

| Tabella | Creatore | Contenuto |
| --- | --- | --- |
| `AspNetUsers` | Identity | Account degli utenti |
| Altre `AspNet*` (6) | Identity | Ruoli, claim, login esterni e token: per ora non le usiamo |
| `Favorites` | Noi | Giochi preferiti di ogni utente |
| `__EFMigrationsHistory` | EF Core | Migrations già applicate |

Le tabelle si creano con le migrations di EF Core.

## AspNetUsers

L'utente fornisce nome utente, email e password. La password viene salvata solo come hash.

L'indice su `NormalizedEmail` non è `UNIQUE`: l'unicità dell'email va attivata nel backend con `RequireUniqueEmail = true`.

## Favorites

Esempio sql:

```sql
CREATE TABLE "Favorites" (
    "UserId"     text        NOT NULL REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    "RawgGameId" integer     NOT NULL CHECK ("RawgGameId" > 0),
    "CreatedAt"  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("UserId", "RawgGameId")
);
```

| UserId | RawgGameId | CreatedAt |
| --- | --- | --- |
| `3f2a8c1e-...` | 3498 | 2026-11-04 15:30:00+00 |
| `3f2a8c1e-...` | 4200 | 2026-11-04 15:42:00+00 |

- **Aggiungere o rimuovere preferiti** costa poco, sono 2 chiavi su poche colonne.
- **Stesso gioco aggiunto due volte:** la chiave primaria `("UserId", "RawgGameId")` lo impedisce, anche con richieste simultanee.
- **Account cancellato:** `ON DELETE CASCADE` cancella anche i suoi preferiti, perché senza utente non hanno senso e sono dati personali.
- **Dati del gioco:** salviamo solo l'id RAWG. Nome e immagini restano su RAWG, e il backend verifica che il gioco esista.

## Ci starebbero molto

Specifiche del PC, statistiche personali e wishlist.
