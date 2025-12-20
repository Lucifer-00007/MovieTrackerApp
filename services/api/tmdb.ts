/**
 * TMDB API Client for MovieStream MVP
 * Provides methods for fetching trending content, movie/TV details, search, and more
 * Implements retry logic with exponential backoff (3 attempts)
 * 
 * Requirements: 1.1, 3.2, 4.2, 6.2, 16.7
 */

import type {
  MediaItem,
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
  Genre,
  Country,
  Language,
} from '@/types/media';
import type { SearchResults, SearchFilters } from '@/types/user';

// TMDB API Configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// API Key should be set via environment variable
// For development, you can set this directly (not recommended for production)
const getApiKey = (): string => {
  // In a real app, this would come from environment variables
  // process.env.EXPO_PUBLIC_TMDB_API_KEY
  return process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
};

/** Retry configuration */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/** API Error with status code */
export class TMDBApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'TMDBApiError';
  }
}

/**
 * Calculate delay for exponential backoff
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof TMDBApiError) {
    return error.isRetryable;
  }
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  return false;
}

/**
 * Execute a fetch request with retry logic and exponential backoff
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Response data
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const isRetryable = response.status >= 500 || response.status === 429;
        throw new TMDBApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          isRetryable
        );
      }

      return await response.json() as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === config.maxAttempts - 1 || !isRetryableError(error)) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const delay = calculateBackoffDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Unknown error during fetch');
}

/**
 * Build TMDB API URL with query parameters
 */
function buildUrl(endpoint: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', getApiKey());
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

/** TMDB API response types */
interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface TMDBMovieResult {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
}

interface TMDBTVResult {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

interface TMDBMultiResult extends TMDBMovieResult, TMDBTVResult {
  media_type: 'movie' | 'tv' | 'person';
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number | null;
  tagline: string;
  status: string;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string; english_name: string }>;
  budget: number;
  revenue: number;
}

interface TMDBTVDetails {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  episode_run_time: number[];
  tagline: string;
  status: string;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string; english_name: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
}

interface TMDBCreditsResponse {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
}

interface TMDBWatchProvidersResponse {
  id: number;
  results: Record<string, {
    link: string;
    flatrate?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
    rent?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
    buy?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
  }>;
}

interface TMDBVideosResponse {
  id: number;
  results: Array<{
    key: string;
    site: string;
    type: string;
    official: boolean;
  }>;
}

/**
 * Transform TMDB movie result to MediaItem
 */
function transformMovieToMediaItem(movie: TMDBMovieResult, rank?: number): MediaItem | TrendingItem {
  const base: MediaItem = {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    overview: movie.overview,
    releaseDate: movie.release_date || '',
    voteAverage: movie.vote_average || null,
    voteCount: movie.vote_count,
    mediaType: 'movie',
    genreIds: movie.genre_ids,
  };

  if (rank !== undefined) {
    return { ...base, rank } as TrendingItem;
  }
  return base;
}

/**
 * Transform TMDB TV result to MediaItem
 */
function transformTVToMediaItem(tv: TMDBTVResult, rank?: number): MediaItem | TrendingItem {
  const base: MediaItem = {
    id: tv.id,
    title: tv.name,
    originalTitle: tv.original_name,
    posterPath: tv.poster_path,
    backdropPath: tv.backdrop_path,
    overview: tv.overview,
    releaseDate: tv.first_air_date || '',
    voteAverage: tv.vote_average || null,
    voteCount: tv.vote_count,
    mediaType: 'tv',
    genreIds: tv.genre_ids,
  };

  if (rank !== undefined) {
    return { ...base, rank } as TrendingItem;
  }
  return base;
}

/**
 * Transform TMDB multi result to MediaItem
 */
function transformMultiToMediaItem(item: TMDBMultiResult): MediaItem | null {
  if (item.media_type === 'movie') {
    return transformMovieToMediaItem(item);
  }
  if (item.media_type === 'tv') {
    return transformTVToMediaItem(item);
  }
  return null; // Skip person results
}

// ============================================================================
// PUBLIC API METHODS
// ============================================================================

/**
 * Get trending movies and TV shows
 * @param mediaType - 'all', 'movie', or 'tv'
 * @param timeWindow - 'day' or 'week'
 * @param page - Page number (default 1)
 * @returns Array of trending items with rank
 */
export async function getTrending(
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<{ items: TrendingItem[]; totalPages: number; totalResults: number }> {
  const url = buildUrl(`/trending/${mediaType}/${timeWindow}`, { page });
  const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBMultiResult>>(url);

  const items = response.results
    .map((item, index) => {
      const rank = (page - 1) * 20 + index + 1;
      if (item.media_type === 'movie') {
        return transformMovieToMediaItem(item as TMDBMovieResult, rank) as TrendingItem;
      }
      if (item.media_type === 'tv') {
        return transformTVToMediaItem(item as TMDBTVResult, rank) as TrendingItem;
      }
      return null;
    })
    .filter((item): item is TrendingItem => item !== null);

  return {
    items,
    totalPages: response.total_pages,
    totalResults: response.total_results,
  };
}

/**
 * Get movie details by ID
 * @param movieId - TMDB movie ID
 * @returns Full movie details
 */
export async function getMovieDetails(movieId: number): Promise<MediaDetails> {
  const url = buildUrl(`/movie/${movieId}`);
  const response = await fetchWithRetry<TMDBMovieDetails>(url);

  return {
    id: response.id,
    title: response.title,
    originalTitle: response.original_title,
    posterPath: response.poster_path,
    backdropPath: response.backdrop_path,
    overview: response.overview,
    releaseDate: response.release_date || '',
    voteAverage: response.vote_average || null,
    voteCount: response.vote_count,
    mediaType: 'movie',
    genreIds: response.genres.map(g => g.id),
    runtime: response.runtime,
    genres: response.genres.map(g => ({ id: g.id, name: g.name })),
    tagline: response.tagline || '',
    status: response.status,
    productionCountries: response.production_countries.map(c => ({
      iso_3166_1: c.iso_3166_1,
      name: c.name,
    })),
    spokenLanguages: response.spoken_languages.map(l => ({
      iso_639_1: l.iso_639_1,
      name: l.name,
      englishName: l.english_name,
    })),
    budget: response.budget,
    revenue: response.revenue,
  };
}

/**
 * Get TV series details by ID
 * @param tvId - TMDB TV series ID
 * @returns Full TV series details
 */
export async function getTvDetails(tvId: number): Promise<MediaDetails> {
  const url = buildUrl(`/tv/${tvId}`);
  const response = await fetchWithRetry<TMDBTVDetails>(url);

  return {
    id: response.id,
    title: response.name,
    originalTitle: response.original_name,
    posterPath: response.poster_path,
    backdropPath: response.backdrop_path,
    overview: response.overview,
    releaseDate: response.first_air_date || '',
    voteAverage: response.vote_average || null,
    voteCount: response.vote_count,
    mediaType: 'tv',
    genreIds: response.genres.map(g => g.id),
    runtime: response.episode_run_time[0] || null,
    genres: response.genres.map(g => ({ id: g.id, name: g.name })),
    tagline: response.tagline || '',
    status: response.status,
    productionCountries: response.production_countries.map(c => ({
      iso_3166_1: c.iso_3166_1,
      name: c.name,
    })),
    spokenLanguages: response.spoken_languages.map(l => ({
      iso_639_1: l.iso_639_1,
      name: l.name,
      englishName: l.english_name,
    })),
    numberOfSeasons: response.number_of_seasons,
    numberOfEpisodes: response.number_of_episodes,
  };
}

/**
 * Search for movies and TV shows
 * @param query - Search query string
 * @param page - Page number (default 1)
 * @returns Search results grouped by type
 */
export async function searchMulti(
  query: string,
  page: number = 1
): Promise<SearchResults> {
  if (!query.trim()) {
    return {
      movies: [],
      tvShows: [],
      totalResults: 0,
      page: 1,
      totalPages: 0,
    };
  }

  const url = buildUrl('/search/multi', { query: encodeURIComponent(query), page });
  const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBMultiResult>>(url);

  const movies: MediaItem[] = [];
  const tvShows: MediaItem[] = [];

  response.results.forEach(item => {
    if (item.media_type === 'movie') {
      movies.push(transformMovieToMediaItem(item as TMDBMovieResult));
    } else if (item.media_type === 'tv') {
      tvShows.push(transformTVToMediaItem(item as TMDBTVResult));
    }
  });

  return {
    movies,
    tvShows,
    totalResults: response.total_results,
    page: response.page,
    totalPages: response.total_pages,
  };
}

/**
 * Get movie credits (cast)
 * @param movieId - TMDB movie ID
 * @returns Array of cast members
 */
export async function getMovieCredits(movieId: number): Promise<CastMember[]> {
  const url = buildUrl(`/movie/${movieId}/credits`);
  const response = await fetchWithRetry<TMDBCreditsResponse>(url);

  return response.cast.map(member => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profilePath: member.profile_path,
    order: member.order,
  }));
}

/**
 * Get TV series credits (cast)
 * @param tvId - TMDB TV series ID
 * @returns Array of cast members
 */
export async function getTvCredits(tvId: number): Promise<CastMember[]> {
  const url = buildUrl(`/tv/${tvId}/credits`);
  const response = await fetchWithRetry<TMDBCreditsResponse>(url);

  return response.cast.map(member => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profilePath: member.profile_path,
    order: member.order,
  }));
}

/**
 * Get watch providers for a movie or TV show
 * @param mediaType - 'movie' or 'tv'
 * @param mediaId - TMDB media ID
 * @param countryCode - ISO 3166-1 country code (default 'US')
 * @returns Array of streaming providers
 */
export async function getWatchProviders(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  countryCode: string = 'US'
): Promise<StreamingProvider[]> {
  const url = buildUrl(`/${mediaType}/${mediaId}/watch/providers`);
  const response = await fetchWithRetry<TMDBWatchProvidersResponse>(url);

  const countryData = response.results[countryCode];
  if (!countryData) {
    return [];
  }

  const providers: StreamingProvider[] = [];
  const link = countryData.link;

  // Add flatrate (subscription) providers
  countryData.flatrate?.forEach(p => {
    providers.push({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path,
      link,
      type: 'flatrate',
      isAvailable: true,
    });
  });

  // Add rent providers
  countryData.rent?.forEach(p => {
    providers.push({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path,
      link,
      type: 'rent',
      isAvailable: true,
    });
  });

  // Add buy providers
  countryData.buy?.forEach(p => {
    providers.push({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path,
      link,
      type: 'buy',
      isAvailable: true,
    });
  });

  return providers;
}

/**
 * Get recommendations for a movie or TV show
 * @param mediaType - 'movie' or 'tv'
 * @param mediaId - TMDB media ID
 * @param page - Page number (default 1)
 * @returns Array of recommended media items
 */
export async function getRecommendations(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  page: number = 1
): Promise<{ items: MediaItem[]; totalPages: number }> {
  const url = buildUrl(`/${mediaType}/${mediaId}/recommendations`, { page });
  
  if (mediaType === 'movie') {
    const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBMovieResult>>(url);
    return {
      items: response.results.map(item => transformMovieToMediaItem(item)),
      totalPages: response.total_pages,
    };
  } else {
    const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBTVResult>>(url);
    return {
      items: response.results.map(item => transformTVToMediaItem(item)),
      totalPages: response.total_pages,
    };
  }
}

/**
 * Discover content by country
 * @param mediaType - 'movie' or 'tv'
 * @param countryCode - ISO 3166-1 country code
 * @param options - Additional filter options
 * @returns Array of media items with rank
 */
export async function discoverByCountry(
  mediaType: 'movie' | 'tv',
  countryCode: string,
  options: {
    page?: number;
    genre?: number;
    year?: number;
    sortBy?: string;
  } = {}
): Promise<{ items: TrendingItem[]; totalPages: number; totalResults: number }> {
  const { page = 1, genre, year, sortBy = 'popularity.desc' } = options;

  const params: Record<string, string | number | undefined> = {
    page,
    sort_by: sortBy,
    with_origin_country: countryCode,
    with_genres: genre,
  };

  if (mediaType === 'movie') {
    if (year) {
      params.primary_release_year = year;
    }
    const url = buildUrl('/discover/movie', params);
    const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBMovieResult>>(url);
    
    return {
      items: response.results.map((item, index) => 
        transformMovieToMediaItem(item, (page - 1) * 20 + index + 1) as TrendingItem
      ),
      totalPages: response.total_pages,
      totalResults: response.total_results,
    };
  } else {
    if (year) {
      params.first_air_date_year = year;
    }
    const url = buildUrl('/discover/tv', params);
    const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBTVResult>>(url);
    
    return {
      items: response.results.map((item, index) => 
        transformTVToMediaItem(item, (page - 1) * 20 + index + 1) as TrendingItem
      ),
      totalPages: response.total_pages,
      totalResults: response.total_results,
    };
  }
}

/**
 * Get trailer key for a movie or TV show
 * @param mediaType - 'movie' or 'tv'
 * @param mediaId - TMDB media ID
 * @returns YouTube video key or null if not available
 */
export async function getTrailerKey(
  mediaType: 'movie' | 'tv',
  mediaId: number
): Promise<string | null> {
  const url = buildUrl(`/${mediaType}/${mediaId}/videos`);
  const response = await fetchWithRetry<TMDBVideosResponse>(url);

  // Find official YouTube trailer
  const trailer = response.results.find(
    video => video.site === 'YouTube' && video.type === 'Trailer' && video.official
  ) || response.results.find(
    video => video.site === 'YouTube' && video.type === 'Trailer'
  ) || response.results.find(
    video => video.site === 'YouTube'
  );

  return trailer?.key || null;
}

/**
 * Get image URL from TMDB
 * @param path - Image path from TMDB
 * @param size - Image size (w92, w154, w185, w342, w500, w780, original)
 * @returns Full image URL
 */
export function getImageUrl(path: string | null, size: string = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

// Types are already exported at their definition
