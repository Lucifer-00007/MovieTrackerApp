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
import { omdbAdapter } from './adapters/omdb-adapter';

/** Check if mock data mode is enabled */
export function useMockData(): boolean {
  const envValue = process.env.EXPO_PUBLIC_USE_MOCK_DATA;
  return envValue === 'true' || envValue === '1';
}

/** Get the configured API provider */
export function getApiProvider(): string {
  return process.env.EXPO_PUBLIC_API_PROVIDER || 'tmdb';
}

/** Validate OMDb configuration */
function validateOMDbConfig(): void {
  const apiKey = process.env.EXPO_PUBLIC_OMDB_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'OMDb API configuration error: EXPO_PUBLIC_OMDB_API_KEY is required when using OMDb provider. ' +
      'Please set your OMDb API key in the environment variables.'
    );
  }
  
  if (apiKey.length < 8) {
    throw new Error(
      'OMDb API configuration error: EXPO_PUBLIC_OMDB_API_KEY appears to be invalid. ' +
      'Please check your API key from http://www.omdbapi.com/apikey.aspx'
    );
  }
}

/** Validate configuration for the specified provider */
export function validateProviderConfig(provider: string): void {
  switch (provider) {
    case 'omdb':
      validateOMDbConfig();
      break;
    case 'tmdb':
      // TMDB validation could be added here if needed
      break;
    case 'mock':
      // No validation needed for mock adapter
      break;
    default:
      console.warn(`[API] Unknown provider "${provider}", no validation available`);
  }
}

/** Get the appropriate API adapter based on configuration */
function getAdapter(): MediaApiAdapter {
  // Mock data takes precedence
  if (useMockData()) {
    console.log('[API] Using mock data adapter');
    return mockAdapter;
  }

  const provider = getApiProvider();
  
  // Validate configuration for the selected provider
  try {
    validateProviderConfig(provider);
  } catch (error) {
    console.error(`[API] Configuration validation failed for provider "${provider}":`, error);
    throw error;
  }
  
  switch (provider) {
    case 'tmdb':
      console.log('[API] Using TMDB adapter');
      return tmdbAdapter;
    case 'omdb':
      console.log('[API] Using OMDb adapter');
      return omdbAdapter;
    case 'mock':
      console.log('[API] Using mock data adapter');
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
