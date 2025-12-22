# OMDb API

---

> Replace `YOUR_KEY` with your OMDb API key.

### Basic usage / base request

```bash
# Basic GET (title lookup, JSON)
curl "http://www.omdbapi.com/?apikey=YOUR_KEY&t=Inception"
```

### Use HTTPS (recommended)

```bash
# HTTPS title lookup
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&t=The%20Matrix"
```

### Lookup by IMDb ID

```bash
# Lookup by IMDb ID (tt0133093 is The Matrix)
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&i=tt0133093"
```

### Search (by title, returns list)

```bash
# Search for "Batman" (page 1)
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&s=Batman"
```

### Search with pagination

```bash
# Search Batman, page 2
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&s=Batman&page=2"
```

### Type filter (movie, series, episode)

```bash
# Search only movies named "Fargo"
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&s=Fargo&type=movie"

# Search only series named "Fargo"
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&s=Fargo&type=series"
```

### Year filter

```bash
# Search for "Batman" from year 2008
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&s=Batman&y=2008"
```

### Plot length (short / full)

```bash
# Title lookup with full plot
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&t=Inception&plot=full"

# Title lookup with short plot (default)
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&t=Inception&plot=short"
```

### Response format: JSON (default) or XML

```bash
# JSON (explicit)
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&t=Inception&r=json"

# XML
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&t=Inception&r=xml"
```

### JSONP callback (if you need JSONP)

```bash
# Example JSONP callback wrapper
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&t=Inception&callback=myJsCallback"
```

### Season + Episode queries (series)

```bash
# Get season info for Game of Thrones, Season 1 (returns list of episodes)
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&t=Game%20of%20Thrones&Season=1"

# Get specific episode by IMDb ID + Season/ Episode (if applicable)
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&i=tt0944947&Season=1&Episode=1"
```

### Poster API (image) — note: poster API is patron-only per docs

```bash
# Poster by IMDb ID (returns image URL / redirects to image)
curl -I "http://img.omdbapi.com/?apikey=YOUR_KEY&i=tt0133093"
# or to fetch image bytes:
curl "http://img.omdbapi.com/?apikey=YOUR_KEY&i=tt0133093" -o poster.jpg
```

### Example: combining multiple useful params

```bash
# Search for a title named 'The Office' (series), return JSON, first page, year 2005
curl "https://www.omdbapi.com/?apikey=YOUR_KEY&s=The%20Office&type=series&y=2005&page=1&r=json"
```

---

### Notes & tips

* Use URL quoting or URL-encode spaces (`%20`) in titles.
* `r=json` is default; `r=xml` returns XML.
* Poster API endpoint is `http://img.omdbapi.com/?apikey=[yourkey]&...` and (per docs) access to the Poster API may require patron status. ([omdbapi.com][1])
* If you prefer `curl` with `--get` and `--data-urlencode` to avoid manual encoding, here’s an example:

```bash
curl --get "https://www.omdbapi.com/" \
  --data-urlencode "apikey=YOUR_KEY" \
  --data-urlencode "t=Game of Thrones" \
  --data-urlencode "Season=1"
```

If you want, I can:

* generate a small Node.js / bash wrapper script that accepts title/ID and prints a nicely formatted output, or
* produce these same examples as a ready-to-run shell script with argument parsing.

Which one do you want next?

[1]: https://www.omdbapi.com/ "OMDb API - The Open Movie Database"
