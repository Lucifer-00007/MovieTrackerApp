# Movie & TV API Contract

> Version: 1.0.0  
> Base URL: `https://movie-api-worker.movie-tracker-api.workers.dev/`  
> Last Updated: January 2026

## Overview

REST API for movies and TV shows powered by TMDB and IMDB data. Designed for mobile and web applications with consistent response formats, pagination, and caching.

---

## Authentication & Headers

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Origin` | No | For CORS - all origins allowed |

### Response Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `Cache-Control` | `public, max-age={ttl}` |
| `Access-Control-Allow-Origin` | `*` |
| `X-Cache-Status` | IMDB endpoints only: `HIT`, `MISS`, `STALE`, `REVALIDATED` |

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "requestId": "uuid-string",
  "pagination": {
    "page": 1,
    "totalPages": 100,
    "totalResults": 2000
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "requestId": "uuid-string"
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid parameters |
| `404` | Not Found |
| `405` | Method Not Allowed (only GET supported) |
| `429` | Rate Limit Exceeded |
| `500` | Internal Server Error |
| `502` | Bad Gateway (IMDB parse failure) |
| `503` | Service Unavailable (IMDB temporarily blocked) |
| `504` | Gateway Timeout |

---

## Data Types

### MovieResult

```typescript
{
  id: number;
  title: string;
  overview: string;
  releaseDate: string;           // "YYYY-MM-DD"
  posterPath: string | null;     // Full URL
  backdropPath: string | null;   // Full URL
  voteAverage: number;           // 0-10
  voteCount: number;
  popularity: number;
  genreIds: number[];
  originalLanguage: string;      // ISO 639-1
  adult: boolean;
}
```


### MovieDetails

```typescript
{
  id: number;
  title: string;
  tagline: string;
  overview: string;
  releaseDate: string;
  runtime: number;               // Minutes
  budget: number;
  revenue: number;
  status: string;                // "Released", "Post Production", etc.
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genres: Genre[];
  productionCompanies: ProductionCompany[];
  spokenLanguages: Language[];
  homepage: string | null;
  imdbId: string | null;
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  } | null;
  videos: Video[];
  similar: MovieResult[];        // Max 6 items
}
```

### TVShowResult

```typescript
{
  id: number;
  name: string;
  overview: string;
  firstAirDate: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  originalLanguage: string;
  originCountry: string[];
}
```

### TVShowDetails

```typescript
{
  id: number;
  name: string;
  tagline: string;
  overview: string;
  firstAirDate: string;
  lastAirDate: string;
  status: string;
  type: string;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  episodeRunTime: number[];
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genres: Genre[];
  networks: Network[];
  productionCompanies: ProductionCompany[];
  seasons: SeasonSummary[];
  homepage: string | null;
  inProduction: boolean;
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  } | null;
  videos: Video[];
  similar: TVShowResult[];
}
```

### SeasonSummary

```typescript
{
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string | null;
  airDate: string;
  episodeCount: number;
}
```

### SeasonDetails

```typescript
{
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string | null;
  airDate: string;
  episodes: Episode[];
}
```

### Episode

```typescript
{
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  airDate: string;
  stillPath: string | null;
  voteAverage: number;
  voteCount: number;
  runtime: number | null;
}
```

### Supporting Types

```typescript
// Genre
{ id: number; name: string; }

// CastMember (max 10 returned)
{ id: number; name: string; character: string; profilePath: string | null; }

// CrewMember (Directors, Producers, Writers only)
{ id: number; name: string; job: string; profilePath: string | null; }

// Video (YouTube only, max 5)
{ id: string; key: string; name: string; type: string; url: string; }

// Network
{ id: number; name: string; logoPath: string | null; }

// ProductionCompany
{ id: number; name: string; logoPath: string | null; }

// Language
{ iso_639_1: string; name: string; }
```

---

## Endpoints

### Health & Documentation

#### `GET /` or `GET /health`
Health check and API info.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Movie & TV API Worker",
    "version": "1.0.0",
    "documentation": "/docs",
    "cache": { "kv": "connected" },
    "endpoints": [...]
  }
}
```

#### `GET /docs`
Swagger UI documentation.

#### `GET /openapi.json`
OpenAPI 3.0 specification.

---

### Movie Endpoints

#### `GET /search`
Search movies by title.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search term (max 100 chars) |
| `page` | number | No | 1 | Page number (1-500) |

**Example:** `/search?query=inception&page=1`

**Response:** Paginated `MovieResult[]`

---

#### `GET /movie/{id}`
Get movie details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | number | Yes | - | TMDB movie ID |
| `append` | string | No | `credits,videos,similar` | Additional data to include |

**Example:** `/movie/550?append=credits,videos`

**Response:** `MovieDetails`

---

#### `GET /trending/{timeWindow}`
Get trending movies.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeWindow` | string | No | `week` | `day` or `week` |
| `page` | number | No | 1 | Page number (1-500) |

**Example:** `/trending/day?page=1`

**Response:** Paginated `MovieResult[]`

---

#### `GET /popular`
Get popular movies.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-500) |

**Response:** Paginated `MovieResult[]`

---

#### `GET /top-rated`
Get top-rated movies.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-500) |

**Response:** Paginated `MovieResult[]`

---

#### `GET /now-playing`
Get movies currently in theaters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-500) |

**Response:** Paginated `MovieResult[]`

---

#### `GET /upcoming`
Get upcoming movie releases.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-500) |

**Response:** Paginated `MovieResult[]`

---

#### `GET /genres`
Get all movie genres.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 28, "name": "Action" },
    { "id": 12, "name": "Adventure" }
  ]
}
```

**Cache TTL:** 24 hours

---

#### `GET /discover`
Discover movies with filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-500) |
| `genre` | number | No | - | Genre ID |
| `year` | number | No | - | Release year |
| `min_rating` | number | No | - | Minimum vote average (0-10) |
| `sort_by` | string | No | `popularity.desc` | Sort order |
| `region` | string | No | - | Region filter (see Regions) |
| `language` | string | No | - | ISO 639-1 language code |

**Sort Options:**
- `popularity.desc` / `popularity.asc`
- `vote_average.desc` / `vote_average.asc`
- `release_date.desc` / `release_date.asc`
- `revenue.desc` / `revenue.asc`

**Example:** `/discover?genre=28&year=2024&min_rating=7&sort_by=vote_average.desc&region=bollywood`

**Response:** Paginated `MovieResult[]`


---

#### `GET /regions`
Get available region filters for discover endpoints.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "bollywood",
      "name": "Bollywood",
      "description": "Hindi-language Indian cinema",
      "languages": ["hi"]
    },
    {
      "key": "hollywood",
      "name": "Hollywood",
      "description": "English-language cinema",
      "languages": ["en"]
    }
  ]
}
```

**Available Regions:**

| Key | Name | Languages |
|-----|------|-----------|
| `bollywood` | Bollywood | Hindi |
| `indian` | Indian Cinema | Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali |
| `tollywood` | Tollywood | Telugu |
| `kollywood` | Kollywood | Tamil |
| `hollywood` | Hollywood | English |
| `korean` | Korean | Korean |
| `japanese` | Japanese | Japanese |
| `anime` | Anime | Japanese |
| `chinese` | Chinese | Mandarin, Cantonese |
| `french` | French | French |
| `german` | German | German |
| `spanish` | Spanish | Spanish |
| `italian` | Italian | Italian |
| `portuguese` | Portuguese | Portuguese |
| `russian` | Russian | Russian |
| `turkish` | Turkish | Turkish |
| `arabic` | Arabic | Arabic |
| `thai` | Thai | Thai |
| `scandinavian` | Scandinavian | Swedish, Norwegian, Danish, Finnish |

---

### TV Show Endpoints

#### `GET /tv/search`
Search TV shows by name.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search term (max 100 chars) |
| `page` | number | No | 1 | Page number (1-500) |

**Response:** Paginated `TVShowResult[]`

---

#### `GET /tv/{id}`
Get TV show details.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | number | Yes | - | TMDB TV show ID |
| `append` | string | No | `credits,videos,similar` | Additional data |

**Response:** `TVShowDetails`

---

#### `GET /tv/{id}/season/{seasonNumber}`
Get season details with all episodes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | TMDB TV show ID |
| `seasonNumber` | number | Yes | Season number (0 for specials) |

**Response:** `SeasonDetails`

---

#### `GET /tv/{id}/season/{seasonNumber}/episode/{episodeNumber}`
Get single episode details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | TMDB TV show ID |
| `seasonNumber` | number | Yes | Season number |
| `episodeNumber` | number | Yes | Episode number (starts at 1) |

**Response:** `Episode`

---

#### `GET /tv/trending/{timeWindow}`
Get trending TV shows.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `timeWindow` | string | No | `week` | `day` or `week` |
| `page` | number | No | 1 | Page number |

**Response:** Paginated `TVShowResult[]`

---

#### `GET /tv/popular`
Get popular TV shows.

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `page` | number | No | 1 |

**Response:** Paginated `TVShowResult[]`

---

#### `GET /tv/top-rated`
Get top-rated TV shows.

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `page` | number | No | 1 |

**Response:** Paginated `TVShowResult[]`

---

#### `GET /tv/airing-today`
Get TV shows airing today.

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `page` | number | No | 1 |

**Response:** Paginated `TVShowResult[]`

---

#### `GET /tv/on-the-air`
Get TV shows currently on air (within 7 days).

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `page` | number | No | 1 |

**Response:** Paginated `TVShowResult[]`

---

#### `GET /tv/genres`
Get all TV genres.

**Response:** `Genre[]`

**Cache TTL:** 1 hour

---

#### `GET /tv/discover`
Discover TV shows with filters.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `genre` | number | No | - | Genre ID |
| `year` | number | No | - | First air date year |
| `min_rating` | number | No | - | Minimum vote average |
| `sort_by` | string | No | `popularity.desc` | Sort order |
| `region` | string | No | - | Region filter |
| `language` | string | No | - | ISO 639-1 code |
| `network` | number | No | - | Network ID |

**Response:** Paginated `TVShowResult[]`


---

### IMDB Endpoints

> ⚠️ Data sourced via web scraping. May be delayed or incomplete.

#### `GET /imdb/upcoming`
Get upcoming movies from IMDB.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `region` | string | No | `US` | ISO country code (2 or 3 letter) |
| `refresh` | boolean | No | `false` | Bypass cache |

**Supported Regions:** US, IN, GB, AU, CA, DE, FR, JP, BR, MX, IT, ES, NL, SE, NO, DK, FI, BE, AT, CH, IE, NZ, ZA, KR, CN, RU, PL, CZ, HU, GR, PT, TR, IL, EG, SA, AE, TH, SG, MY, ID, PH, VN, AR, CL, CO, PE, VE, UY

**Response:**
```json
{
  "success": true,
  "data": {
    "region": "US",
    "movies": [
      {
        "title": "Movie Title",
        "releaseDate": "2026-02-14",
        "imdbId": "tt1234567",
        "imdbUrl": "https://www.imdb.com/title/tt1234567/",
        "posterUrl": "https://...",
        "genres": ["Action", "Thriller"],
        "directors": ["Director Name"],
        "cast": ["Actor 1", "Actor 2"]
      }
    ],
    "scrapedAt": "2026-01-12T10:00:00Z",
    "disclaimer": "Data sourced from IMDB via web scraping...",
    "cached": true,
    "stale": false
  }
}
```

**Cache TTL:** 6 hours (fresh), 1 minute (stale)

---

#### `GET /imdb/upcoming/{region}`
Convenience route for upcoming movies by region.

**Example:** `/imdb/upcoming/IN`

---

#### `GET /imdb/news`
Get top entertainment news from IMDB.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Articles to return (1-50) |
| `refresh` | boolean | No | `false` | Bypass cache |

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "title": "Article Title",
        "summary": "Article summary...",
        "url": "https://www.imdb.com/news/...",
        "imageUrl": "https://...",
        "publishedDate": "2026-01-12",
        "source": "IMDb",
        "category": "Celebrity News"
      }
    ],
    "scrapedAt": "2026-01-12T10:00:00Z",
    "disclaimer": "...",
    "cached": true
  }
}
```

**Cache TTL:** 30 minutes

---

#### `GET /imdb/health`
IMDB scraping health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-12T10:00:00Z",
    "kv": {
      "status": "connected",
      "latencyMs": 15
    },
    "scraping": {
      "upcoming": {
        "lastSuccess": "2026-01-12T09:00:00Z",
        "parseSuccessRate": 0.98,
        "selectorSuccessRates": {...},
        "fieldExtractionRates": {...},
        "itemCount": 25
      },
      "news": {...}
    },
    "degraded": false,
    "degradedReasons": []
  }
}
```

**Status Values:** `healthy`, `degraded`, `unhealthy`

---

## Rate Limiting

- Rate limits are applied per client IP
- When exceeded, returns `429 Too Many Requests`
- Retry after the cooldown period

---

## Caching

| Endpoint Type | Default TTL |
|---------------|-------------|
| Health check | 60 seconds |
| Movie/TV lists | 5 minutes |
| Movie/TV details | 10 minutes |
| Genres | 24 hours (movies), 1 hour (TV) |
| Regions | 1 hour |
| IMDB upcoming | 6 hours |
| IMDB news | 30 minutes |

---

## Error Handling

### Validation Errors (400)

```json
{
  "success": false,
  "error": "Query parameter is required",
  "requestId": "..."
}
```

Common validation errors:
- `Query parameter is required`
- `Query too long (max 100 characters)`
- `Page must be between 1 and 500`
- `Invalid movie ID`
- `Time window must be "day" or "week"`
- `Invalid region code`
- `Invalid limit. Must be a number between 1 and 50`

### IMDB-Specific Errors

| Status | Error | Description |
|--------|-------|-------------|
| 502 | Unable to parse IMDB data | HTML structure changed |
| 503 | IMDB temporarily unavailable | Rate limited by IMDB |
| 504 | Request timeout | IMDB response too slow |

---

## Best Practices for Frontend Integration

### 1. Handle Pagination
```javascript
const fetchMovies = async (page = 1) => {
  const res = await fetch(`/popular?page=${page}`);
  const { data, pagination } = await res.json();
  return { movies: data, hasMore: pagination.page < pagination.totalPages };
};
```

### 2. Cache Responses Client-Side
Use response `Cache-Control` headers or implement local caching for frequently accessed data like genres.

### 3. Handle Null Image Paths
```javascript
const posterUrl = movie.posterPath || '/placeholder-poster.png';
```

### 4. Use Request IDs for Debugging
Log `requestId` from responses for support requests.

### 5. Implement Retry Logic for IMDB
```javascript
const fetchWithRetry = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.status !== 503) return res;
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error('Service unavailable');
};
```

### 6. Check X-Cache-Status Header
For IMDB endpoints, check if data is stale and show appropriate UI indicators.

---

## Image URLs

All image paths are returned as full URLs:

| Type | Size | Example |
|------|------|---------|
| Poster | w500 | `https://image.tmdb.org/t/p/w500/abc.jpg` |
| Backdrop | original | `https://image.tmdb.org/t/p/original/xyz.jpg` |
| Profile | w185 | `https://image.tmdb.org/t/p/w185/def.jpg` |
| Still | w300 | `https://image.tmdb.org/t/p/w300/ghi.jpg` |
| Network Logo | w92 | `https://image.tmdb.org/t/p/w92/jkl.jpg` |

---

## Changelog

### v1.0.0
- Initial release
- Movie endpoints: search, details, trending, popular, top-rated, now-playing, upcoming, genres, discover
- TV endpoints: search, details, seasons, episodes, trending, popular, top-rated, airing-today, on-the-air, genres, discover
- IMDB endpoints: upcoming movies, news, health check
- Region-based filtering for discover endpoints
