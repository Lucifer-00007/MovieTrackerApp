/**
 * TMDB API Main Module
 * Provides the main TMDB API functions and utilities
 * 
 * Requirements: 1.1, 3.2, 4.2, 6.2, 16.7
 */

// Re-export all API functions
export {
  getTrending,
  getMovieDetails,
  getTvDetails,
  searchMulti,
  getMovieCredits,
  getTvCredits,
  getWatchProviders,
  getRecommendations,
  discoverByCountry,
  getTrailerKey,
} from './endpoints';

// Re-export client utilities
export {
  fetchWithRetry,
  buildUrl,
  getImageUrl,
  getApiKey,
  calculateBackoffDelay,
  TMDBApiError,
  type RetryConfig,
  DEFAULT_RETRY_CONFIG,
  TMDB_IMAGE_BASE_URL,
} from './client';

// Re-export types
export type {
  TMDBPaginatedResponse,
  TMDBMovieResult,
  TMDBTVResult,
  TMDBMultiResult,
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBCreditsResponse,
  TMDBWatchProvidersResponse,
  TMDBVideosResponse,
} from './types';

// Re-export transformers
export {
  transformMovieToMediaItem,
  transformTVToMediaItem,
  transformMultiToMediaItem,
  transformMovieDetails,
  transformTVDetails,
  transformCredits,
  transformWatchProviders,
} from './transformers';