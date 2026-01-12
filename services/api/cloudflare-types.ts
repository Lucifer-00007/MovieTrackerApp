/**
 * Cloudflare Worker API Type Definitions
 * Based on the API contract at md-docs/info/cloudflare-api-contract.md
 */

// ============================================================================
// API Response Wrappers
// ============================================================================

/** Standard success response from Cloudflare API */
export interface CloudflareSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
  pagination?: CloudflarePagination;
}

/** Standard error response from Cloudflare API */
export interface CloudflareErrorResponse {
  success: false;
  error: string;
  requestId: string;
}

/** API response union type */
export type CloudflareResponse<T> = CloudflareSuccessResponse<T> | CloudflareErrorResponse;

/** Pagination info */
export interface CloudflarePagination {
  page: number;
  totalPages: number;
  totalResults: number;
}

// ============================================================================
// Movie Types
// ============================================================================

/** Movie result from list endpoints */
export interface CFMovieResult {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  originalLanguage: string;
  adult: boolean;
}

/** Full movie details */
export interface CFMovieDetails {
  id: number;
  title: string;
  tagline: string;
  overview: string;
  releaseDate: string;
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genres: CFGenre[];
  productionCompanies: CFProductionCompany[];
  spokenLanguages: CFLanguage[];
  homepage: string | null;
  imdbId: string | null;
  credits: CFCredits | null;
  videos: CFVideo[];
  similar: CFMovieResult[];
}

// ============================================================================
// TV Show Types
// ============================================================================

/** TV show result from list endpoints */
export interface CFTVShowResult {
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

/** Full TV show details */
export interface CFTVShowDetails {
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
  genres: CFGenre[];
  networks: CFNetwork[];
  productionCompanies: CFProductionCompany[];
  seasons: CFSeasonSummary[];
  homepage: string | null;
  inProduction: boolean;
  credits: CFCredits | null;
  videos: CFVideo[];
  similar: CFTVShowResult[];
}

/** Season summary */
export interface CFSeasonSummary {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string | null;
  airDate: string;
  episodeCount: number;
}

/** Season details with episodes */
export interface CFSeasonDetails {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string | null;
  airDate: string;
  episodes: CFEpisode[];
}

/** Episode details */
export interface CFEpisode {
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

// ============================================================================
// Supporting Types
// ============================================================================

/** Genre */
export interface CFGenre {
  id: number;
  name: string;
}

/** Cast member (max 10 returned) */
export interface CFCastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

/** Crew member (Directors, Producers, Writers only) */
export interface CFCrewMember {
  id: number;
  name: string;
  job: string;
  profilePath: string | null;
}

/** Credits container */
export interface CFCredits {
  cast: CFCastMember[];
  crew: CFCrewMember[];
}

/** Video (YouTube only, max 5) */
export interface CFVideo {
  id: string;
  key: string;
  name: string;
  type: string;
  url: string;
}

/** Network */
export interface CFNetwork {
  id: number;
  name: string;
  logoPath: string | null;
}

/** Production company */
export interface CFProductionCompany {
  id: number;
  name: string;
  logoPath: string | null;
}

/** Language */
export interface CFLanguage {
  iso_639_1: string;
  name: string;
}

/** Region filter */
export interface CFRegion {
  key: string;
  name: string;
  description: string;
  languages: string[];
}

// ============================================================================
// IMDB Types
// ============================================================================

/** IMDB upcoming movie */
export interface CFIMDBUpcomingMovie {
  title: string;
  releaseDate: string;
  imdbId: string;
  imdbUrl: string;
  posterUrl: string | null;
  genres: string[];
  directors: string[];
  cast: string[];
}

/** IMDB upcoming response data */
export interface CFIMDBUpcomingData {
  region: string;
  movies: CFIMDBUpcomingMovie[];
  scrapedAt: string;
  disclaimer: string;
  cached: boolean;
  stale: boolean;
}

/** IMDB news article */
export interface CFIMDBNewsArticle {
  title: string;
  summary: string;
  url: string;
  imageUrl: string | null;
  publishedDate: string;
  source: string;
  category: string;
}

/** IMDB news response data */
export interface CFIMDBNewsData {
  articles: CFIMDBNewsArticle[];
  scrapedAt: string;
  disclaimer: string;
  cached: boolean;
}

/** IMDB health status */
export interface CFIMDBHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  kv: {
    status: string;
    latencyMs: number;
  };
  scraping: {
    upcoming: {
      lastSuccess: string;
      parseSuccessRate: number;
      selectorSuccessRates: Record<string, number>;
      fieldExtractionRates: Record<string, number>;
      itemCount: number;
    };
    news: {
      lastSuccess: string;
      parseSuccessRate: number;
      selectorSuccessRates: Record<string, number>;
      fieldExtractionRates: Record<string, number>;
      itemCount: number;
    };
  };
  degraded: boolean;
  degradedReasons: string[];
}

// ============================================================================
// API Health Types
// ============================================================================

/** Health check response data */
export interface CFHealthData {
  name: string;
  version: string;
  documentation: string;
  cache: { kv: string };
  endpoints: string[];
}

// ============================================================================
// Discover Options
// ============================================================================

/** Movie discover options */
export interface CFDiscoverMovieOptions {
  page?: number;
  genre?: number;
  year?: number;
  min_rating?: number;
  sort_by?: CFSortOption;
  region?: string;
  language?: string;
}

/** TV discover options */
export interface CFDiscoverTVOptions extends CFDiscoverMovieOptions {
  network?: number;
}

/** Sort options */
export type CFSortOption =
  | 'popularity.desc'
  | 'popularity.asc'
  | 'vote_average.desc'
  | 'vote_average.asc'
  | 'release_date.desc'
  | 'release_date.asc'
  | 'revenue.desc'
  | 'revenue.asc';
