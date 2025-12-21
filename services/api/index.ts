/**
 * Unified Media API Service
 * Automatically switches between mock data and real API based on environment config
 * 
 * Usage:
 *   import { mediaApi, getImageUrl } from '@/services/api';
 *   const trending = await mediaApi.getTrending('all', 'week', 1);
 */

import type { MediaApiAdapter } from './types';
import { tmdbAdapter } from './adapters/tmdb-adapter';
import { mockAdapter } from './adapters/mock-adapter';

/** Check if mock data mode is enabled */
export function useMockData(): boolean {
  const envValue = process.env.EXPO_PUBLIC_USE_MOCK_DATA;
  return envValue === 'true' || envValue === '1';
}

/** Get the configured API provider */
export function getApiProvider(): string {
  return process.env.EXPO_PUBLIC_API_PROVIDER || 'tmdb';
}

/** Get the appropriate API adapter based on configuration */
function getAdapter(): MediaApiAdapter {
  // Mock data takes precedence
  if (useMockData()) {
    console.log('[API] Using mock data adapter');
    return mockAdapter;
  }

  const provider = getApiProvider();
  
  switch (provider) {
    case 'tmdb':
      return tmdbAdapter;
    case 'mock':
      return mockAdapter;
    default:
      console.warn(`[API] Unknown provider "${provider}", falling back to TMDB`);
      return tmdbAdapter;
  }
}

/** The active media API adapter */
export const mediaApi: MediaApiAdapter = getAdapter();

// Re-export convenience functions that use the active adapter
export const getTrending = mediaApi.getTrending.bind(mediaApi);
export const getMovieDetails = mediaApi.getMovieDetails.bind(mediaApi);
export const getTvDetails = mediaApi.getTvDetails.bind(mediaApi);
export const searchMulti = mediaApi.searchMulti.bind(mediaApi);
export const getMovieCredits = mediaApi.getMovieCredits.bind(mediaApi);
export const getTvCredits = mediaApi.getTvCredits.bind(mediaApi);
export const getWatchProviders = mediaApi.getWatchProviders.bind(mediaApi);
export const getRecommendations = mediaApi.getRecommendations.bind(mediaApi);
export const discoverByCountry = mediaApi.discoverByCountry.bind(mediaApi);
export const getTrailerKey = mediaApi.getTrailerKey.bind(mediaApi);
export const getImageUrl = mediaApi.getImageUrl.bind(mediaApi);

// Re-export types
export type { MediaApiAdapter, PaginatedResponse, ApiConfig } from './types';

// Re-export retry utilities from tmdb for analytics service compatibility
export { calculateBackoffDelay, type RetryConfig } from './tmdb';
