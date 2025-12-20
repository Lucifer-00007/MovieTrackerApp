# Best free / reliable alternatives to TMDb

### 1) **OMDb (The Open Movie Database)** — simple movie metadata (free tier: 1,000 requests/day)

Pros: super-simple REST API, easy to integrate, quick lookup by title/IMDB id.
Cons: limited TV support, images/poster API is behind patron tier, single-maintainer project so features/uptime can vary. ([omdbapi.com][1])

Quick curl:

```bash
# Replace YOUR_KEY with the key from https://www.omdbapi.com/apikey.aspx
curl "http://www.omdbapi.com/?t=Inception&apikey=YOUR_KEY"
```

---

### 2) **IMDb datasets (official, downloadable TSVs)** — best if you can host data locally

Pros: official, comprehensive, updated daily; great for offline/bulk use (title.basics, ratings, name.basics, etc.).
Cons: it’s bulk files (TSV gzips) — not a live query API; you must download & query locally. ([developer.imdb.com][2])

How to get it:

* Download gzipped TSVs from `https://datasets.imdbws.com/` and load into a local DB. ([developer.imdb.com][2])

Example (download title basics):

```bash
curl -O https://datasets.imdbws.com/title.basics.tsv.gz
gunzip title.basics.tsv.gz
# then import into your DB or parse with Python/Pandas
```

---

### 3) **Trakt.tv API** — good for discovery, lists, user tracking (free with rate-limits)

Pros: solid search, trending, lists, user watch-tracking; free developer access (create an app).
Cons: rate-limits and usage limits exist; more oriented to tracking & discovery than image-heavy metadata. ([Trakt][3])

Quick curl (requires client id in header):

```bash
# set TRAKT_CLIENT_ID to your app client id
curl -H "trakt-api-key: TRAKT_CLIENT_ID" -H "trakt-api-version: 2" \
  "https://api.trakt.tv/search/movie?query=inception"
```

---

### 4) **Watchmode** — great if you need streaming availability (free API key / paid tiers)

Pros: focused on streaming availability (Netflix, Prime, Disney+, etc.), free API key available for devs, paid plans for heavy use.
Cons: more specialized (streaming data) vs general movie metadata. ([Watchmode API][4])

Quick curl:

```bash
curl "https://api.watchmode.com/v1/search/?apiKey=YOUR_KEY&search_field=name&search_value=Inception"
```

---

### 5) **JustWatch (Partner API / business)** — best streaming catalog if you can partner

Pros: very accurate streaming availability & widgets; official partner API for businesses.
Cons: partner-only for full access (i.e., commercial / paid arrangements). Unofficial wrappers exist for non-commercial experiments (use with caution). ([JustWatch][5])

If you need just streaming “where to watch” data and are building a commercial product, contact their Partnerships page. For small personal projects, community wrappers (Python/Node) are available but not officially supported.

---

### 6) **Other options / aggregator marketplaces**

* **RapidAPI** hosts several movie/streaming APIs (some free tiers) — good when you want a single onboarding flow. ([RapidAPI][6])
* **imdbapi.dev** (free community API) — unofficial, useful for quick tests but not guaranteed for production. ([imdbapi.dev][7])

---

# Quick recommendation depending on your use-case

* Need **simple movie lookups** and a quick drop-in? → **OMDb** (easy, quick). ([omdbapi.com][1])
* Need **bulk / authoritative data** and will host it yourself? → **IMDb datasets** (download & serve locally). ([developer.imdb.com][2])
* Need **user-tracking / discoverability / lists**? → **Trakt.tv** (free dev API). ([Trakt][3])
* Need **streaming availability**? → **Watchmode** or **JustWatch (partner)**. ([Watchmode API][4])

---

# Extra troubleshooting note (if you still want TMDb)

`unknown host` may be a local DNS / network / firewall issue rather than TMDb itself. Quick things to try locally:

* `ping api.themoviedb.org` or `nslookup api.themoviedb.org` to see if DNS resolves.
* Try curl from another network (phone hotspot) to rule out network/DNS blocking.
* Switch DNS to `1.1.1.1` or `8.8.8.8` and retry.
  If you want, paste the `curl` output or `nslookup` results and I’ll help interpret them.

---

[1]: https://www.omdbapi.com/?utm_source=chatgpt.com "OMDb API - The Open Movie Database"
[2]: https://developer.imdb.com/non-commercial-datasets/?utm_source=chatgpt.com "IMDb Non-Commercial Datasets"
[3]: https://trakt.tv/?utm_source=chatgpt.com "Trakt: Discover. Track. Share."
[4]: https://api.watchmode.com/?utm_source=chatgpt.com "Watchmode API"
[5]: https://www.justwatch.com/in/JustWatch-Streaming-API?utm_source=chatgpt.com "JustWatch streaming API, Widgets and data intelligence"
[6]: https://rapidapi.com/meteoric-llc-meteoric-llc-default/api/watchmode/pricing?utm_source=chatgpt.com "Watchmode"
[7]: https://imdbapi.dev/?utm_source=chatgpt.com "Free IMDb API"
