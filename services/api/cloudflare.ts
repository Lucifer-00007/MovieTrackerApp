/**
 * Cloudflare Worker API Client
 * REST API for movies and TV shows powered by TMDB and IMDB data
 * 
 * Base URL: https://movie-api-worker.movie-tracker-api.workers.dev/
 * API Version: 1.0.0
 */

import type {
  CloudflareResponse,
  CloudflareSuccessResponse,
  CFMovieResult,
  CFMovieDetails,
  CFTVShowResult,
  CFTVShowDetails,
  CFSeasonDetails,
  CFEpisode,
  CFGenre,
  CFRegion,
  CFIMDBUpcomingData,
  CFIMDBNewsData,
  CFIMDBHealthData,
  CFHealthData,
  CFDiscoverMovieOptions,
  CFDiscoverTVOptions,
} from './cloudflare-types';

import { API_BASE_URLS } from '@/constants/api';

// ============================================================================
// Configuration
// ============================================================================

const CF_BASE_URL = API_BASE_URLS.CLOUDFLARE;

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

// ============================================================================
// Error Handling
// ============================================================================

/** Cloudflare API Error */
export class CloudflareApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public requestId?: string,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'CloudflareApiError';
  }
}

/** Calculate exponential backoff delay */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/** Sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check if error is retryable */
function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

// ============================================================================
// Core Fetch Logic
// ============================================================================

/**
 * Execute fetch with retry logic and exponential backoff
 */
async function fetchWithRetry<T>(
  url: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<CloudflareSuccessResponse<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as CloudflareResponse<T>;

      if (!response.ok || !data.success) {
        const errorMessage = !data.success ? data.error : `HTTP ${response.status}`;
        const requestId = 'requestId' in data ? data.requestId : undefined;
        
        throw new CloudflareApiError(
          errorMessage,
          response.status,
          requestId,
          isRetryableStatus(response.status)
        );
      }

      return data as CloudflareSuccessResponse<T>;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        error instanceof CloudflareApiError
          ? error.isRetryable
          : error instanceof TypeError;

      if (attempt === config.maxAttempts - 1 || !isRetryable) {
        throw lastError;
      }

      const delay = calculateBackoffDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Unknown error during fetch');
}

/**
 * Build URL with query parameters
 */
function buildUrl(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {}
): string {
  const url = new URL(`${CF_BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

// ============================================================================
// Health & Documentation
// ============================================================================

/** Health check */
export async function getHealth(): Promise<CFHealthData> {
  const response = await fetchWithRetry<CFHealthData>(buildUrl('/health'));
  return response.data;
}

// ============================================================================
// Movie Endpoints
// ============================================================================

/** Search movies by title */
export async function searchMovies(
  query: string,
  page: number = 1
): Promise<{ data: CFMovieResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFMovieResult[]>(
    buildUrl('/search', { query, page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get movie details */
export async function getMovieDetails(
  id: number,
  append: string = 'credits,videos,similar'
): Promise<CFMovieDetails> {
  const response = await fetchWithRetry<CFMovieDetails>(
    buildUrl(`/movie/${id}`, { append })
  );
  return response.data;
}

/** Get trending movies */
export async function getTrendingMovies(
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<{ data: CFMovieResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFMovieResult[]>(
    buildUrl(`/trending/${timeWindow}`, { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get popular movies */
export async function getPopularMovies(
  page: number = 1
): Promise<{ data: CFMovieResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFMovieResult[]>(
    buildUrl('/popular', { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get top-rated movies */
export async function getTopRatedMovies(
  page: number = 1
): Promise<{ data: CFMovieResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFMovieResult[]>(
    buildUrl('/top-rated', { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get now playing movies */
export async function getNowPlayingMovies(
  page: number = 1
): Promise<{ data: CFMovieResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFMovieResult[]>(
    buildUrl('/now-playing', { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get upcoming movies */
export async function getUpcomingMovies(
  page: number = 1
): Promise<{ data: CFMovieResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFMovieResult[]>(
    buildUrl('/upcoming', { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get movie genres */
export async function getMovieGenres(): Promise<CFGenre[]> {
  const response = await fetchWithRetry<CFGenre[]>(buildUrl('/genres'));
  return response.data;
}

/** Discover movies with filters */
export async function discoverMovies(
  options: CFDiscoverMovieOptions = {}
): Promise<{ data: CFMovieResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFMovieResult[]>(
    buildUrl('/discover', options as Record<string, string | number | undefined>)
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get available regions */
export async function getRegions(): Promise<CFRegion[]> {
  const response = await fetchWithRetry<CFRegion[]>(buildUrl('/regions'));
  return response.data;
}

// ============================================================================
// TV Show Endpoints
// ============================================================================

/** Search TV shows */
export async function searchTVShows(
  query: string,
  page: number = 1
): Promise<{ data: CFTVShowResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFTVShowResult[]>(
    buildUrl('/tv/search', { query, page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get TV show details */
export async function getTVShowDetails(
  id: number,
  append: string = 'credits,videos,similar'
): Promise<CFTVShowDetails> {
  const response = await fetchWithRetry<CFTVShowDetails>(
    buildUrl(`/tv/${id}`, { append })
  );
  return response.data;
}

/** Get season details */
export async function getSeasonDetails(
  tvId: number,
  seasonNumber: number
): Promise<CFSeasonDetails> {
  const response = await fetchWithRetry<CFSeasonDetails>(
    buildUrl(`/tv/${tvId}/season/${seasonNumber}`)
  );
  return response.data;
}

/** Get episode details */
export async function getEpisodeDetails(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<CFEpisode> {
  const response = await fetchWithRetry<CFEpisode>(
    buildUrl(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`)
  );
  return response.data;
}

/** Get trending TV shows */
export async function getTrendingTVShows(
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<{ data: CFTVShowResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFTVShowResult[]>(
    buildUrl(`/tv/trending/${timeWindow}`, { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get popular TV shows */
export async function getPopularTVShows(
  page: number = 1
): Promise<{ data: CFTVShowResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFTVShowResult[]>(
    buildUrl('/tv/popular', { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get top-rated TV shows */
export async function getTopRatedTVShows(
  page: number = 1
): Promise<{ data: CFTVShowResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFTVShowResult[]>(
    buildUrl('/tv/top-rated', { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get TV shows airing today */
export async function getAiringTodayTVShows(
  page: number = 1
): Promise<{ data: CFTVShowResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFTVShowResult[]>(
    buildUrl('/tv/airing-today', { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get TV shows on the air */
export async function getOnTheAirTVShows(
  page: number = 1
): Promise<{ data: CFTVShowResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFTVShowResult[]>(
    buildUrl('/tv/on-the-air', { page })
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

/** Get TV genres */
export async function getTVGenres(): Promise<CFGenre[]> {
  const response = await fetchWithRetry<CFGenre[]>(buildUrl('/tv/genres'));
  return response.data;
}

/** Discover TV shows with filters */
export async function discoverTVShows(
  options: CFDiscoverTVOptions = {}
): Promise<{ data: CFTVShowResult[]; totalPages: number; totalResults: number }> {
  const response = await fetchWithRetry<CFTVShowResult[]>(
    buildUrl('/tv/discover', options as Record<string, string | number | undefined>)
  );
  return {
    data: response.data,
    totalPages: response.pagination?.totalPages ?? 1,
    totalResults: response.pagination?.totalResults ?? response.data.length,
  };
}

// ============================================================================
// IMDB Endpoints
// ============================================================================

/** Get upcoming movies from IMDB */
export async function getIMDBUpcoming(
  region: string = 'US',
  refresh: boolean = false
): Promise<CFIMDBUpcomingData> {
  const response = await fetchWithRetry<CFIMDBUpcomingData>(
    buildUrl('/imdb/upcoming', { region, refresh })
  );
  return response.data;
}

/** Get IMDB news */
export async function getIMDBNews(
  limit: number = 10,
  refresh: boolean = false
): Promise<CFIMDBNewsData> {
  const response = await fetchWithRetry<CFIMDBNewsData>(
    buildUrl('/imdb/news', { limit, refresh })
  );
  return response.data;
}

/** Get IMDB health status */
export async function getIMDBHealth(): Promise<CFIMDBHealthData> {
  const response = await fetchWithRetry<CFIMDBHealthData>(
    buildUrl('/imdb/health')
  );
  return response.data;
}
