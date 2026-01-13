/**
 * OMDb API Utilities
 * Utility functions for OMDb API operations
 */

import { OMDbError, RETRYABLE_ERROR_CODES } from './errors';
import { DEFAULT_RETRY_CONFIG } from './config';
import { ANIMATION_DURATION } from '@/constants/animations';
import { API_HEADERS } from '@/constants/api';
import type { RetryConfig } from './types';

/**
 * Parse OMDb API error message and determine appropriate error code
 */
export function parseOMDbErrorCode(errorMessage: string): string {
  const message = errorMessage.toLowerCase();
  
  if (message.includes('invalid api key') || message.includes('no api key')) {
    return 'INVALID_API_KEY';
  }
  if (message.includes('not found') || message.includes('movie not found')) {
    return 'NOT_FOUND';
  }
  if (message.includes('too many results')) {
    return 'TOO_MANY_RESULTS';
  }
  if (message.includes('incorrect imdb id')) {
    return 'INCORRECT_IMDB_ID';
  }
  if (message.includes('parameter')) {
    return 'PARAMETER_ERROR';
  }
  if (message.includes('request limit') || message.includes('daily limit')) {
    return 'REQUEST_LIMIT';
  }
  
  return 'OMDB_ERROR';
}

/**
 * Log error with appropriate level and context
 */
export function logError(error: OMDbError, context?: Record<string, unknown>): void {
  const logContext = {
    ...context,
    errorCode: error.code,
    statusCode: error.statusCode,
    isRetryable: error.isRetryable,
  };
  
  // Use different log levels based on error severity
  if (error.isRetryable || error.code === 'NOT_FOUND') {
    console.warn('[OMDb API] Recoverable error:', error.message, logContext);
  } else if (error.code === 'INVALID_API_KEY' || error.code === 'REQUEST_LIMIT') {
    console.error('[OMDb API] Configuration error:', error.message, logContext);
  } else {
    console.error('[OMDb API] Error:', error.message, logContext);
  }
}

/**
 * Calculate delay for exponential backoff with optional jitter
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const backoffFactor = config.backoffFactor || 2;
  const baseDelay = config.baseDelayMs * Math.pow(backoffFactor, attempt);
  
  let delay = Math.min(baseDelay, config.maxDelayMs);
  
  // Add jitter to prevent thundering herd problem
  if (config.jitter !== false) {
    // Add random jitter of ±25%
    const jitterRange = delay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    delay = Math.max(config.baseDelayMs * 0.1, delay + jitter); // Ensure minimum delay
  }
  
  return Math.floor(delay);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof OMDbError) {
    return error.isRetryable || RETRYABLE_ERROR_CODES.includes(error.code);
  }
  
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Timeout errors are retryable
  if (error instanceof Error && (error.message.includes('timeout') || error.name === 'AbortError')) {
    return true;
  }
  
  return false;
}

/**
 * Determine retry delay based on error type and rate limiting headers
 */
export function getRetryDelay(error: OMDbError, attempt: number, config: RetryConfig): number {
  // For rate limiting, use longer delays
  if (error.code === 'RATE_LIMIT') {
    // Check for Retry-After header in context
    const retryAfter = error.context?.retryAfter as number | undefined;
    if (retryAfter && retryAfter > 0) {
      // Use server-suggested delay, but cap it at maxDelayMs
      return Math.min(retryAfter * 1000, config.maxDelayMs);
    }
    
    // Use longer exponential backoff for rate limiting
    const rateLimitConfig: RetryConfig = {
      ...config,
      baseDelayMs: Math.max(config.baseDelayMs, ANIMATION_DURATION.HERO_CAROUSEL), // Minimum 5 seconds for rate limits
      backoffFactor: 3, // More aggressive backoff
    };
    return calculateBackoffDelay(attempt, rateLimitConfig);
  }
  
  // For server errors, use standard exponential backoff
  if (error.code === 'SERVER_ERROR' || error.code === 'BAD_GATEWAY' || error.code === 'SERVICE_UNAVAILABLE') {
    return calculateBackoffDelay(attempt, config);
  }
  
  // For network/timeout errors, use faster retry
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
    const networkConfig: RetryConfig = {
      ...config,
      baseDelayMs: Math.min(config.baseDelayMs, ANIMATION_DURATION.OMDB_RETRY_DELAY), // Faster retry for network issues
    };
    return calculateBackoffDelay(attempt, networkConfig);
  }
  
  // Default exponential backoff
  return calculateBackoffDelay(attempt, config);
}

/**
 * Create appropriate error from HTTP response
 */
export function createHttpError(response: Response): OMDbError {
  const isRetryable = response.status >= 500 || response.status === 429;
  let code = 'HTTP_ERROR';
  let message = `HTTP ${response.status}: ${response.statusText}`;
  
  // Extract rate limiting information
  const context: Record<string, unknown> = { 
    url: response.url, 
    status: response.status, 
    statusText: response.statusText 
  };
  
  // Check for Retry-After header
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    context.retryAfter = parseInt(retryAfter, 10);
  }
  
  // Check for rate limit headers
  const rateLimitRemaining = response.headers.get(API_HEADERS.RATE_LIMIT_REMAINING);
  const rateLimitReset = response.headers.get('X-RateLimit-Reset');
  if (rateLimitRemaining !== null) {
    context.rateLimitRemaining = parseInt(rateLimitRemaining, 10);
  }
  if (rateLimitReset !== null) {
    context.rateLimitReset = parseInt(rateLimitReset, 10);
  }

  switch (response.status) {
    case 400:
      code = 'BAD_REQUEST';
      message = 'Bad request - invalid parameters';
      break;
    case 401:
      code = 'UNAUTHORIZED';
      message = 'Unauthorized - check API key';
      break;
    case 403:
      code = 'FORBIDDEN';
      message = 'Forbidden - API key may be invalid or expired';
      break;
    case 404:
      code = 'NOT_FOUND';
      message = 'Resource not found';
      break;
    case 429:
      code = 'RATE_LIMIT';
      message = 'Rate limit exceeded - too many requests';
      if (retryAfter) {
        message += ` (retry after ${retryAfter} seconds)`;
      }
      break;
    case 500:
      code = 'SERVER_ERROR';
      message = 'Internal server error';
      break;
    case 502:
      code = 'BAD_GATEWAY';
      message = 'Bad gateway';
      break;
    case 503:
      code = 'SERVICE_UNAVAILABLE';
      message = 'Service temporarily unavailable';
      break;
    case 504:
      code = 'GATEWAY_TIMEOUT';
      message = 'Gateway timeout';
      break;
  }
  
  return new OMDbError(message, code, response.status, isRetryable, undefined, context);
}