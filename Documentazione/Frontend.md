# Risposte IGDB: cosa arriva al frontend

Il backend inoltra le risposte di IGDB senza modificarle.
I tipi stanno in `src/app/models/igdb.model.ts`.

## 1. Arrivano solo i campi richiesti

Il backend sceglie quali campi chiedere a IGDB. Un campo che non è stato chiesto, oppure
che è vuoto, **non compare proprio nel JSON** (non arriva come `null`).
Per questo nei tipi quasi tutto ha il `?`, e va gestito con `?.` e un valore di riserva:

```ts
game.genres?.map(g => g.name).join(', ') ?? 'N/D'
```

## 2. Relazioni: ID oppure oggetto

Uno stesso campo può arrivare in due forme, a seconda della query:

```json
"genres": [12, 31]                                  // chiesto: fields genres;
"genres": [{ "id": 12, "name": "Role-playing (RPG)" }] // chiesto: fields genres.name;
```

I tipi assumono la seconda forma. Se ti arrivano dei numeri, chiedi al backend di
espandere quel campo.

## 3. Date e immagini

- `first_release_date` e `release_dates[].date` sono timestamp Unix **in secondi**:
  `new Date(game.first_release_date * 1000)`
- Le immagini non hanno un URL: arriva solo `image_id`. L'URL lo costruisce
  `igdbImageUrl(image_id, 'cover_big')`. Le dimensioni disponibili sono in `IgdbImageSize`.
- `videos[].video_id` è un ID YouTube.

## Esempio di risposta (valori illustrativi)

```json
[
  {
    "id": 119133,
    "name": "Elden Ring",
    "slug": "elden-ring",
    "summary": "...",
    "cover": { "id": 1001, "image_id": "abc123xyz" },
    "first_release_date": 1645747200,
    "genres": [{ "id": 12, "name": "Role-playing (RPG)" }],
    "platforms": [{ "id": 6, "name": "PC (Microsoft Windows)", "abbreviation": "PC" }],
    "involved_companies": [
      { "id": 5001, "company": { "id": 1012, "name": "FromSoftware" },
        "developer": true, "publisher": false, "porting": false, "supporting": false }
    ],
    "total_rating": 94.3,
    "total_rating_count": 1200
  }
]
```

- `/games` restituisce **sempre un array**, anche quando si chiede un solo gioco.
- Valutazioni (`rating`, `aggregated_rating`, `total_rating`): sono **da 0 a 100**, con decimali.

## Home page (multiquery)

Se il backend usa `/multiquery`, la risposta è un array di blocchi con un nome:

```json
[
  { "name": "Top rated", "result": [ /* IgdbGame[] */ ] },
  { "name": "Upcoming",  "result": [ /* IgdbGame[] */ ] }
]
```

Tipo: `IgdbMultiqueryResult<IgdbGame>[]`.

## Nota

I modelli attuali in `models/` (`game.model.ts`, `genre.model.ts`, ecc.) hanno la forma
di RAWG e verranno sostituiti da `igdb.model.ts`.
