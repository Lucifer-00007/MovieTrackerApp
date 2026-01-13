/**
 * TMDB API Client Core
 * Provides HTTP client with retry logic and error handling
 * 
 * Requirements: 1.1, 3.2, 4.2
 */

import { API_BASE_URLS } from '@/constants/api';
import { ANIMATION_DURATION } from '@/constants/animations';

// TMDB API Configuration
const TMDB_BASE_URL = API_BASE_URLS.TMDB;
export const TMDB_IMAGE_BASE_URL = API_BASE_URLS.TMDB_IMAGES;

// API Key should be set via environment variable
export const getApiKey = (): string => {
  return process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
};

/** Retry configuration */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: ANIMATION_DURATION.SLOW,
  maxDelayMs: ANIMATION_DURATION.API_TIMEOUT,
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
export function buildUrl(endpoint: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', getApiKey());
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
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