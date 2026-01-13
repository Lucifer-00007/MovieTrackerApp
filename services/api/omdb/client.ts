/**
 * OMDb API Client
 * Main HTTP client with retry logic and error handling
 */

import { OMDbError } from './errors';
import { getOMDbConfig, DEFAULT_RETRY_CONFIG } from './config';
import { parseOMDbErrorCode, logError, isRetryableError, getRetryDelay, createHttpError, sleep } from './utils';
import { ANIMATION_DURATION } from '@/constants/animations';
import type { RetryConfig } from './types';

/**
 * Build OMDb API URL with query parameters
 * Always uses HTTPS endpoint as per requirement 1.4
 */
export function buildOMDbUrl(params: Record<string, string | number | undefined>): string {
  const config = getOMDbConfig();
  const url = new URL(config.baseUrl);
  
  // Add API key
  url.searchParams.set('apikey', config.apiKey);
  
  // Add other parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Validate that a URL uses HTTPS protocol
 */
export function isHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Handle OMDb API response and check for errors
 * Provides comprehensive error parsing and graceful error handling
 */
async function handleOMDbResponse<T extends { Response: string; Error?: string }>(
  response: Response
): Promise<T> {
  // Handle HTTP errors
  if (!response.ok) {
    const httpError = createHttpError(response);
    logError(httpError, { url: response.url });
    throw httpError;
  }
  
  let data: T;
  try {
    data = await response.json() as T;
  } catch (parseError) {
    const error = new OMDbError(
      'Failed to parse JSON response',
      'PARSE_ERROR',
      response.status,
      false,
      parseError,
      { url: response.url }
    );
    logError(error);
    throw error;
  }
  
  // OMDb returns Response: "False" for API-level errors
  if (data.Response === 'False') {
    const errorMessage = data.Error || 'Unknown OMDb error';
    const code = parseOMDbErrorCode(errorMessage);
    
    const error = new OMDbError(
      errorMessage,
      code,
      undefined,
      false,
      undefined,
      { url: response.url, omdbResponse: data }
    );
    
    // Log error with appropriate level
    logError(error);
    throw error;
  }
  
  return data;
}

/**
 * Execute a fetch request with retry logic and exponential backoff
 * Handles network errors, rate limiting, and timeout scenarios
 * @param url - URL to fetch (must be HTTPS)
 * @param config - Retry configuration
 * @param timeoutMs - Request timeout in milliseconds
 * @returns Response data
 */
export async function fetchWithRetry<T extends { Response: string; Error?: string }>(
  url: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  timeoutMs: number = ANIMATION_DURATION.API_TIMEOUT
): Promise<T> {
  // Validate HTTPS usage (Requirement 1.4)
  if (!isHttpsUrl(url)) {
    throw new OMDbError(
      'OMDb API requests must use HTTPS',
      'INVALID_PROTOCOL',
      undefined,
      false,
      undefined,
      { url }
    );
  }
  
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MovieTracker/1.0',
        },
        signal: controller.signal,
      });

      // Clear timeout if request completes
      clearTimeout(timeoutId);

      return await handleOMDbResponse<T>(response);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Handle AbortError (timeout)
      if (lastError.name === 'AbortError') {
        lastError = new OMDbError(
          `Request timeout after ${timeoutMs}ms`,
          'TIMEOUT',
          undefined,
          true,
          lastError,
          { url, timeoutMs, attempt: attempt + 1 }
        );
      }

      // Handle network errors
      if (lastError instanceof TypeError && lastError.message.includes('fetch')) {
        lastError = new OMDbError(
          'Network error occurred',
          'NETWORK_ERROR',
          undefined,
          true,
          lastError,
          { url, attempt: attempt + 1 }
        );
      }

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === config.maxAttempts - 1 || !isRetryableError(lastError)) {
        // Log final failure
        if (lastError instanceof OMDbError) {
          logError(lastError, { finalAttempt: true, totalAttempts: config.maxAttempts });
        }
        throw lastError;
      }

      // Calculate delay for next attempt
      const delay = lastError instanceof OMDbError 
        ? getRetryDelay(lastError, attempt, config)
        : config.baseDelayMs * Math.pow(2, attempt);

      // Log retry attempt
      if (lastError instanceof OMDbError) {
        logError(lastError, { 
          retrying: true, 
          attempt: attempt + 1, 
          maxAttempts: config.maxAttempts,
          delayMs: delay 
        });
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new OMDbError('Unknown error occurred', 'UNKNOWN_ERROR');
}