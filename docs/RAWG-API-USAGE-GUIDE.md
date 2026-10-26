# RAWG API Documentation

Practical reference · REST API · cURL examples

This guide covers five endpoints from the RAWG Video Games Database API and explains how to search, filter, paginate, and retrieve game information.

Official reference: [RAWG API documentation](<https://rawg.io/apidocs?utm_source=chatgpt.com>). The API uses JSON responses and requires an API key for requests.

RAWG

+1

## 1. Base URL and authentication

All endpoints use this base URL:

text

```
https://api.rawg.io/api
```

Every request must include your API key as the `key` query parameter.

bash

```
API_KEY="YOUR_API_KEY"
BASE_URL="https://api.rawg.io/api"
```

Example:

bash

```
curl -sS -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY"
```

Keep your API key private. For a public application, avoid exposing it in client-side code.

## 2. Common query parameters

The following parameters apply primarily to `GET /games`. They do not all apply to every endpoint. For example, `search`, `genres`, `platforms`, `dates`, and `metacritic` are game-list filters, not filters for `/games/{id}`.

| Parameter | Type | Purpose |
| --- | --- | --- |
| `search` | String | Search for games by name or search term. |
| `genres` | String | Filter games by genre IDs or slugs. |
| `platforms` | String | Filter games by platform IDs. |
| `dates` | String | Filter by release-date range. |
| `ordering` | String | Sort results by a supported field. |
| `metacritic` | String | Filter by Metacritic score range. |
| `page` | Integer | Select a results page. |
| `page_size` | Integer | Set the number of results per page. |

These parameters are optional unless stated otherwise by the endpoint. The `key` parameter is required.

api.rawg.io

+1

### `search`

Search for games by title or keyword.

Example:

bash

```
curl -sS -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "search=The Witcher 3"
```

For less fuzzy matching, you can also use `search_precise=true`. The separate `search_exact=true` parameter marks the search query as exact; neither should be treated as a guarantee of one unique result.

RAWG

+1

### `genres`

Filter by genre IDs or slugs. Multiple values can be comma-separated.

text

```
genres=action
genres=action,indie
genres=4,51
```

Find valid IDs and slugs using `GET /genres`. For thematic classifications such as horror or science fiction, check `/tags` too; not every theme is a RAWG genre.

### `platforms`

Filter by platform IDs, such as PC or PlayStation.

text

```
platforms=4
platforms=4,187
```

Use `GET /platforms` to discover available platform IDs. The API's platform identifiers are not interchangeable with platform names.

### `dates`

Filter by a release-date range in `YYYY-MM-DD,YYYY-MM-DD` format.

text

```
dates=2020-01-01,2020-12-31
```

This example filters for games released between January 1 and December 31, 2020.

### `ordering`

Sort by a supported field. A leading minus sign reverses the order.

| Value | Sort order |
| --- | --- |
| `name` | Name ascending |
| `-name` | Name descending |
| `released` | Release date ascending |
| `-released` | Newest releases first |
| `rating` | Rating ascending |
| `-rating` | Highest ratings first |
| `metacritic` | Metacritic ascending |
| `-metacritic` | Highest Metacritic scores first |
| `-added` | Most added/popular by RAWG's added metric first |

The documented game-list ordering fields include `name`, `released`, `added`, `created`, `updated`, `rating`, and `metacritic`.

RAWG

+1

### `metacritic`

Filter games by Metacritic score range, generally on a 0–100 scale.

text

```
metacritic=80,100
```

This requests games with scores from 80 to 100. Games without a Metacritic score may not match.

### `page` and `page_size`

- `page=1` selects the first page.
- `page=2` selects the second page.
- `page_size=10` requests up to 10 results per page.

Example:

bash

```
curl -sS -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "page=2" \
  --data-urlencode "page_size=10"
```

Responses for list endpoints typically contain `count`, `next`, `previous`, and `results`. Follow `next` to continue through the available pages. Do not assume a page size larger than the API's supported maximum will be honored.

api.rawg.io

+1

## 3. `GET /games`

GETList and search games

Endpoint

text

```
GET https://api.rawg.io/api/games
```

Returns a paginated list of games. Each result contains summary information such as the game's ID, name, slug, release date, rating, image, Metacritic score, and platforms.

api.rawg.io

+1

### Parameters

| Parameter | Required? | Example |
| --- | --- | --- |
| `key` | Yes | `YOUR_API_KEY` |
| `search` | No | `Elden Ring` |
| `genres` | No | `action,rpg` |
| `platforms` | No | `4,187` |
| `dates` | No | `2022-01-01,2022-12-31` |
| `ordering` | No | `-rating` |
| `metacritic` | No | `80,100` |
| `page` | No | `1` |
| `page_size` | No | `20` |

### Example A: Search for a game

bash

```
curl -sS -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "search=Elden Ring" \
  --data-urlencode "page_size=10"
```

### Example B: Find highly rated PC games

bash

```
curl -sS -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "platforms=4" \
  --data-urlencode "metacritic=80,100" \
  --data-urlencode "ordering=-metacritic" \
  --data-urlencode "page=1" \
  --data-urlencode "page_size=20"
```

Here, `4` is the RAWG platform ID for PC. Verify platform IDs with `/platforms`.

### Example C: Combine several filters

bash

```
curl -sS -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "genres=action,rpg" \
  --data-urlencode "platforms=4" \
  --data-urlencode "dates=2020-01-01,2025-12-31" \
  --data-urlencode "metacritic=75,100" \
  --data-urlencode "ordering=-rating" \
  --data-urlencode "page_size=10"
```

This requests action/RPG games on PC released during the specified period, with Metacritic scores from 75 to 100, sorted by RAWG rating descending.

### Example response

A simplified response looks like this:

json

```
{
  "count": 1234,
  "next": "https://api.rawg.io/api/games?page=2",
  "previous": null,
  "results": [
    {
      "id": 3498,
      "name": "Grand Theft Auto V",
      "slug": "grand-theft-auto-v",
      "released": "2013-09-17",
      "rating": 4.47,
      "metacritic": 92,
      "background_image": "https://example.com/image.jpg"
    }
  ]
}
```

The values above illustrate the response structure; actual data and pagination URLs depend on the request.

Important: Use the returned `id` to retrieve full details from `/games/{id}`. The list endpoint is intended for discovery and summaries.

## 4. `GET /games/{id}`

GETRetrieve a game's details

Endpoint

text

```
GET https://api.rawg.io/api/games/{id}
```

Replace `{id}` with a RAWG game ID or a supported game slug. This endpoint returns a single game object with detailed metadata.

api.rawg.io

+1

### Parameters

| Parameter | Required? | Description |
| --- | --- | --- |
| `id` | Yes | Game ID or slug in the URL path. |
| `key` | Yes | Your API key in the query string. |

The game-list filters `search`, `genres`, `platforms`, `dates`, `ordering`, and `metacritic` do not serve as detail filters here.

### Example A: Retrieve a game by ID

bash

```
curl -sS -G "$BASE_URL/games/3498" \
  --data-urlencode "key=$API_KEY"
```

### Example B: Retrieve a game by slug

bash

```
curl -sS -G "$BASE_URL/games/grand-theft-auto-v" \
  --data-urlencode "key=$API_KEY"
```

### Example C: Extract selected fields with `jq`

bash

```
curl -sS -G "$BASE_URL/games/3498" \
  --data-urlencode "key=$API_KEY" |
jq '{
  id,
  name,
  slug,
  description_raw,
  released,
  rating,
  metacritic,
  website,
  background_image,
  genres,
  platforms,
  developers,
  publishers
}'
```

### Useful response fields

| Field | Description |
| --- | --- |
| `id` | Unique RAWG game ID |
| `name` | Game title |
| `slug` | URL-friendly identifier |
| `description` | Description, often containing HTML |
| `description_raw` | Plain-text description when available |
| `released` | Release date |
| `rating` | RAWG rating |
| `metacritic` | Metacritic score, if available |
| `genres` | Associated genres |
| `platforms` | Platforms and associated platform metadata |
| `developers` | Developers |
| `publishers` | Publishers |
| `website` | Official website, if available |
| `background_image` | Main image URL |
| `esrb_rating` | Age-rating information, if available |

Fields can be absent or null when the information is unavailable.

Typical workflow: Call `/games?search=...`, select the correct game from `results`, then call `/games/{id}` to populate a detail page.

## 5. `GET /games/{id}/screenshots`

GETRetrieve a game's screenshots

Endpoint

text

```
GET https://api.rawg.io/api/games/{id}/screenshots
```

Returns a paginated list of screenshots associated with a particular game.

api.rawg.io

+1

### Parameters

| Parameter | Required? | Description |
| --- | --- | --- |
| `id` | Yes | Game ID or identifier in the URL path. |
| `key` | Yes | Your API key. |
| `page` | No | Results page number. |
| `page_size` | No | Number of screenshots per page. |
| `ordering` | No | Ordering option supported by the endpoint. |

The `search`, `genres`, `platforms`, `dates`, and `metacritic` filters are not applicable to this endpoint. The screenshots endpoint has its own pagination and ordering parameters.

### Example A: Get screenshots

bash

```
curl -sS -G "$BASE_URL/games/3498/screenshots" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "page=1" \
  --data-urlencode "page_size=10"
```

### Example B: Print screenshot URLs

bash

```
curl -sS -G "$BASE_URL/games/3498/screenshots" \
  --data-urlencode "key=$API_KEY" |
jq -r '.results[] | .image'
```

### Example response

json

```
{
  "count": 120,
  "next": "https://api.rawg.io/api/games/3498/screenshots?page=2",
  "previous": null,
  "results": [
    {
      "image": "https://example.com/screenshot1.jpg",
      "hidden": false
    },
    {
      "image": "https://example.com/screenshot2.jpg",
      "hidden": false
    }
  ]
}
```

The screenshot URLs and counts are illustrative.

### Practical notes

- Use the parent game's ID from `/games` or `/games/{id}`.
- Each result can provide an `image` URL.
- Use `page` and `page_size` to retrieve more screenshots when available.
- Check the API response before assuming a game has screenshots.

## 6. `GET /genres`

GETList available game genres

Endpoint

text

```
GET https://api.rawg.io/api/genres
```

Returns a paginated list of genres, including their IDs, names, slugs, game counts, and background images.

api.rawg.io

+1

### Parameters

| Parameter | Required? | Description |
| --- | --- | --- |
| `key` | Yes | Your API key. |
| `page` | No | Results page number. |
| `page_size` | No | Number of genres per page. |
| `ordering` | No | Ordering option supported by the endpoint. |

The game-specific filters such as `search`, `genres`, `platforms`, `dates`, and `metacritic` are not filters for this list endpoint.

### Example A: Retrieve genres

bash

```
curl -sS -G "$BASE_URL/genres" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "page=1" \
  --data-urlencode "page_size=40"
```

### Example B: Display genre IDs and names

bash

```
curl -sS -G "$BASE_URL/genres" \
  --data-urlencode "key=$API_KEY" |
jq -r '.results[] | "\(.id) | \(.name) | \(.slug)"'
```

### Example response

json

```
{
  "count": 19,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 4,
      "name": "Action",
      "slug": "action",
      "games_count": 20000,
      "image_background": "https://example.com/action.jpg"
    }
  ]
}
```

This is an illustrative response, not a current count of RAWG genres.

### How to use genre IDs

First, retrieve the genres and select an ID or slug. Then filter the game list:

bash

```
curl -sS -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "genres=action" \
  --data-urlencode "ordering=-rating" \
  --data-urlencode "page_size=10"
```

Important: Genres are broad categories, not a complete list of every game theme. For categories such as horror or science fiction, query `/tags` as well.

## 7. `GET /platforms`

GETList available gaming platforms

Endpoint

text

```
GET https://api.rawg.io/api/platforms
```

Returns a paginated list of gaming platforms. Each result can include a platform ID, name, slug, game count, and background image.

RAWG

+1

### Parameters

| Parameter | Required? | Description |
| --- | --- | --- |
| `key` | Yes | Your API key. |
| `page` | No | Results page number. |
| `page_size` | No | Number of platforms per page. |
| `ordering` | No | Ordering option supported by the endpoint. |

The `search`, `genres`, `platforms`, `dates`, and `metacritic` game-list filters do not apply to `/platforms`.

### Example A: Retrieve platforms

bash

```
curl -sS -G "$BASE_URL/platforms" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "page=1" \
  --data-urlencode "page_size=40"
```

### Example B: Display platform IDs and names

bash

```
curl -sS -G "$BASE_URL/platforms" \
  --data-urlencode "key=$API_KEY" |
jq -r '.results[] | "\(.id) | \(.name) | \(.slug)"'
```

### Example response

json

```
{
  "count": 50,
  "next": "https://api.rawg.io/api/platforms?page=2",
  "previous": null,
  "results": [
    {
      "id": 4,
      "name": "PC",
      "slug": "pc",
      "games_count": 50000,
      "image_background": "https://example.com/pc.jpg"
    }
  ]
}
```

The values are illustrative; actual platform counts and response fields vary.

### How to use platform IDs

Retrieve the platform list first. Then use the IDs returned by RAWG to filter games:

bash

```
curl -sS -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "platforms=4" \
  --data-urlencode "ordering=-released" \
  --data-urlencode "page_size=10"
```

This example uses platform ID `4` for PC.

## 8. Parameter compatibility cheat sheet

Use this table when deciding which parameters to include in a request.

| Parameter | `/games` | `/games/{id}` | `/games/{id}/screenshots` | `/genres` | `/platforms` |
| --- | --- | --- | --- | --- | --- |
| `key` | Yes | Yes | Yes | Yes | Yes |
| `search` | Yes | — | — | — | — |
| `genres` | Yes | — | — | — | — |
| `platforms` | Yes | — | — | — | — |
| `dates` | Yes | — | — | — | — |
| `ordering` | Yes | — | Yes | Yes | Yes |
| `metacritic` | Yes | — | — | — | — |
| `page` | Yes | — | Yes | Yes | Yes |
| `page_size` | Yes | — | Yes | Yes | Yes |

`—` means the parameter is not documented as applicable to that endpoint. For `/games/{id}`, the identifier is supplied in the URL path rather than as a query parameter.

api.rawg.io

+1

## 9. Pagination and error handling

### Follow pagination

List endpoints commonly return a structure like:

json

```
{
  "count": 100,
  "next": "https://api.rawg.io/api/games?page=2",
  "previous": null,
  "results": []
}
```

- `count`: total matching results.
- `next`: URL for the next page, or `null` if there is no next page.
- `previous`: URL for the previous page, or `null`.
- `results`: the current page's data.

To retrieve every page, keep following `next` until it is `null`. Don't assume the first page contains every matching result.

### Check HTTP errors

Use `curl -i` to inspect HTTP status codes and response headers:

bash

```
curl -i -G "$BASE_URL/games" \
  --data-urlencode "key=$API_KEY" \
  --data-urlencode "search=Elden Ring"
```

Common cases include:

- `200 OK`: request succeeded.
- `401 Unauthorized`: authentication may be missing or invalid.
- `403 Forbidden`: access may be restricted.
- `429 Too Many Requests`: a rate limit may have been reached.
- `5xx`: a server-side error may have occurred.

Check the response body for the specific error message.

## 10. Recommended workflow

1. Discover games

Use `/games` with `search`, `genres`, `platforms`, `dates`, and other filters.

2. Retrieve full details

Use `/games/{id}` with the ID of the selected game.

3. Load screenshots

Use `/games/{id}/screenshots` to populate a gallery.

4. Build filter options

Use `/genres` and `/platforms` to retrieve valid IDs and names for your search interface.

For complete endpoint schemas and any changes to supported parameters, consult the official [RAWG API reference](<https://rawg.io/apidocs?utm_source=chatgpt.com>). Also review RAWG's terms of use for attribution, usage limits, and the permissions applicable to your project.

RAWG

+1
