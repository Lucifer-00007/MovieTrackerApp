/**
 * OMDb API Client for MovieStream MVP
 * Provides methods for fetching movie and TV show data from the Open Movie Database
 * Implements retry logic with exponential backoff
 * 
 * Requirements: 1.3, 1.4, 8.1
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/** OMDb API Configuration */
export interface OMDbConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

/** Default OMDb API configuration - uses HTTPS endpoint */
const OMDB_BASE_URL = 'https://www.omdbapi.com';

/** Get API key from environment variable */
export const getOMDbApiKey = (): string => {
  return process.env.EXPO_PUBLIC_OMDB_API_KEY || '';
};

/** Get OMDb configuration */
export const getOMDbConfig = (): OMDbConfig => ({
  baseUrl: OMDB_BASE_URL,
  apiKey: getOMDbApiKey(),
  timeout: 10000,
});

// ============================================================================
// OMDB API RESPONSE TYPES
// ============================================================================

/** OMDb search result item */
export interface OMDbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}

/** OMDb search response */
export interface OMDbSearchResponse {
  Search?: OMDbSearchItem[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

/** OMDb rating from various sources */
export interface OMDbRating {
  Source: string;
  Value: string;
}

/** OMDb detailed response for a single item */
export interface OMDbDetailResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: OMDbRating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  totalSeasons?: string;
  Response: 'True' | 'False';
  Error?: string;
}

/** OMDb error response */
export interface OMDbErrorResponse {
  Response: 'False';
  Error: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/** OMDb API Error class for API-specific errors */
export class OMDbError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public isRetryable: boolean = false,
    public originalError?: unknown,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OMDbError';
    
    // Ensure stack trace is captured
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OMDbError);
    }
  }

  /**
   * Create an OMDbError from an unknown error
   */
  static fromError(error: unknown, code: string = 'UNKNOWN_ERROR', context?: Record<string, unknown>): OMDbError {
    if (error instanceof OMDbError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new OMDbError(
        error.message,
        code,
        undefined,
        false,
        error,
        context
      );
    }
    
    return new OMDbError(
      String(error),
      code,
      undefined,
      false,
      error,
      context
    );
  }

  /**
   * Convert error to a plain object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      context: this.context,
      stack: this.stack,
    };
  }
}

/** Legacy alias for backward compatibility */
export const OMDbApiError = OMDbError;

/** Retry configuration */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor?: number;
  jitter?: boolean;
}

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitter: true,
};

/** Retryable error codes */
const RETRYABLE_ERROR_CODES = ['NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT', 'HTTP_ERROR'];

/** Error code mappings for common OMDb API errors */
const OMDB_ERROR_CODES = {
  INVALID_API_KEY: 'Invalid API key',
  NOT_FOUND: 'not found',
  TOO_MANY_RESULTS: 'Too many results',
  INCORRECT_IMDB_ID: 'Incorrect IMDb ID',
  PARAMETER_ERROR: 'Parameter',
  REQUEST_LIMIT: 'Request limit',
} as const;

/**
 * Parse OMDb API error message and determine appropriate error code
 */
function parseOMDbErrorCode(errorMessage: string): string {
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
function logError(error: OMDbError, context?: Record<string, unknown>): void {
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
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
function getRetryDelay(error: OMDbError, attempt: number, config: RetryConfig): number {
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
      baseDelayMs: Math.max(config.baseDelayMs, 5000), // Minimum 5 seconds for rate limits
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
      baseDelayMs: Math.min(config.baseDelayMs, 2000), // Faster retry for network issues
    };
    return calculateBackoffDelay(attempt, networkConfig);
  }
  
  // Default exponential backoff
  return calculateBackoffDelay(attempt, config);
}

/**
 * Create appropriate error from HTTP response
 */
function createHttpError(response: Response): OMDbError {
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
  const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
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
      message = 'Bad gateway - server temporarily unavailable';
      break;
    case 503:
      code = 'SERVICE_UNAVAILABLE';
      message = 'Service unavailable - server temporarily down';
      break;
    case 504:
      code = 'GATEWAY_TIMEOUT';
      message = 'Gateway timeout - server took too long to respond';
      break;
  }
  
  return new OMDbError(
    message,
    code,
    response.status,
    isRetryable,
    undefined,
    context
  );
}

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

// ============================================================================
// HTTP CLIENT WITH RETRY
// ============================================================================

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
  timeoutMs: number = 10000
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

      // Log retry attempt
      if (lastError instanceof OMDbError) {
        console.warn(`[OMDb] Retry attempt ${attempt + 1}/${config.maxAttempts} after error:`, {
          code: lastError.code,
          message: lastError.message,
          isRetryable: lastError.isRetryable,
        });
      } else {
        console.warn(`[OMDb] Retry attempt ${attempt + 1}/${config.maxAttempts} after error:`, lastError.message);
      }

      // Wait before retrying with exponential backoff
      const delay = getRetryDelay(lastError as OMDbError, attempt, config);
      await sleep(delay);
    }
  }

  throw lastError || new OMDbError('Unknown error during fetch', 'UNKNOWN_ERROR');
}

// ============================================================================
// ID MAPPING UTILITIES
// ============================================================================

/** Cache for ID mappings (numeric ID -> IMDb ID) */
const idMappingCache = new Map<number, string>();

/**
 * Generate a numeric ID from an IMDb ID string
 * Uses a hash function to convert IMDb IDs (e.g., "tt0133093") to numbers
 */
export function generateNumericId(imdbId: string): number {
  let hash = 0;
  for (let i = 0; i < imdbId.length; i++) {
    const char = imdbId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const numericId = Math.abs(hash);
  
  // Store mapping for reverse lookup
  idMappingCache.set(numericId, imdbId);
  
  return numericId;
}

/**
 * Get IMDb ID from numeric ID (reverse lookup)
 */
export function getImdbIdFromNumeric(numericId: number): string | undefined {
  return idMappingCache.get(numericId);
}

/**
 * Clear the ID mapping cache
 */
export function clearIdMappingCache(): void {
  idMappingCache.clear();
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

/** Search type filter options */
export type OMDbSearchType = 'movie' | 'series' | 'episode';

/** Search parameters for OMDb API */
export interface OMDbSearchParams {
  query: string;
  page?: number;
  type?: OMDbSearchType;
  year?: number;
}

/** Parsed search results with pagination info */
export interface OMDbSearchResults {
  items: OMDbSearchItem[];
  totalResults: number;
  page: number;
  totalPages: number;
}

/** OMDb returns 10 results per page */
const OMDB_RESULTS_PER_PAGE = 10;

/**
 * Search for content using OMDb API
 * Handles pagination and type filtering
 * 
 * Requirements: 2.1, 2.2, 2.3
 * 
 * @param params - Search parameters
 * @returns Parsed search results with pagination info
 */
export async function searchContent(params: OMDbSearchParams): Promise<OMDbSearchResults> {
  const { query, page = 1, type, year } = params;
  
  // Validate query
  if (!query || query.trim().length === 0) {
    return {
      items: [],
      totalResults: 0,
      page,
      totalPages: 0,
    };
  }
  
  // Build URL with search parameters
  const url = buildOMDbUrl({
    s: query.trim(),
    page,
    type,
    y: year,
  });
  
  try {
    const response = await fetchWithRetry<OMDbSearchResponse>(url);
    
    // Handle successful response
    const items = response.Search || [];
    const totalResults = parseInt(response.totalResults || '0', 10);
    const totalPages = Math.ceil(totalResults / OMDB_RESULTS_PER_PAGE);
    
    return {
      items,
      totalResults,
      page,
      totalPages,
    };
  } catch (error) {
    // Handle "Movie not found" as empty results, not an error
    if (error instanceof OMDbError && error.code === 'NOT_FOUND') {
      return {
        items: [],
        totalResults: 0,
        page,
        totalPages: 0,
      };
    }
    
    // Handle "Too many results" error
    if (error instanceof OMDbError && error.code === 'TOO_MANY_RESULTS') {
      console.warn('[OMDb] Search query too broad, returning empty results');
      return {
        items: [],
        totalResults: 0,
        page,
        totalPages: 0,
      };
    }
    
    // Re-throw other errors with additional context
    if (error instanceof OMDbError) {
      throw new OMDbError(
        error.message,
        error.code,
        error.statusCode,
        error.isRetryable,
        error.originalError,
        { ...error.context, operation: 'searchContent', query, page, type, year }
      );
    }
    
    throw error;
  }
}

// ============================================================================
// DETAIL FETCHING
// ============================================================================

/** Plot length options for detail requests */
export type OMDbPlotLength = 'short' | 'full';

/** Parameters for fetching details by IMDb ID */
export interface OMDbDetailByIdParams {
  imdbId: string;
  plot?: OMDbPlotLength;
}

/** Parameters for fetching details by title */
export interface OMDbDetailByTitleParams {
  title: string;
  type?: OMDbSearchType;
  year?: number;
  plot?: OMDbPlotLength;
}

/**
 * Get detailed information by IMDb ID
 * 
 * Requirements: 3.1, 3.2, 3.3
 * 
 * @param params - Parameters including IMDb ID and plot length
 * @returns Detailed OMDb response
 */
export async function getDetailsByImdbId(params: OMDbDetailByIdParams): Promise<OMDbDetailResponse> {
  const { imdbId, plot = 'full' } = params;
  
  // Validate IMDb ID format
  if (!imdbId || !imdbId.startsWith('tt')) {
    throw new OMDbError(
      'Invalid IMDb ID format. Must start with "tt"',
      'INVALID_IMDB_ID',
      undefined,
      false,
      undefined,
      { imdbId }
    );
  }
  
  const url = buildOMDbUrl({
    i: imdbId,
    plot,
  });
  
  try {
    return await fetchWithRetry<OMDbDetailResponse>(url);
  } catch (error) {
    // Add context to the error
    if (error instanceof OMDbError) {
      throw new OMDbError(
        error.message,
        error.code,
        error.statusCode,
        error.isRetryable,
        error.originalError,
        { ...error.context, operation: 'getDetailsByImdbId', imdbId, plot }
      );
    }
    throw error;
  }
}

/**
 * Get detailed information by title
 * Supports type filtering and year specification
 * 
 * Requirements: 3.1, 3.2, 3.3
 * 
 * @param params - Parameters including title, type, year, and plot length
 * @returns Detailed OMDb response
 */
export async function getDetailsByTitle(params: OMDbDetailByTitleParams): Promise<OMDbDetailResponse> {
  const { title, type, year, plot = 'full' } = params;
  
  // Validate title
  if (!title || title.trim().length === 0) {
    throw new OMDbError(
      'Title is required for detail lookup',
      'INVALID_TITLE',
      undefined,
      false,
      undefined,
      { title }
    );
  }
  
  const url = buildOMDbUrl({
    t: title.trim(),
    type,
    y: year,
    plot,
  });
  
  try {
    return await fetchWithRetry<OMDbDetailResponse>(url);
  } catch (error) {
    // Add context to the error
    if (error instanceof OMDbError) {
      throw new OMDbError(
        error.message,
        error.code,
        error.statusCode,
        error.isRetryable,
        error.originalError,
        { ...error.context, operation: 'getDetailsByTitle', title, type, year, plot }
      );
    }
    throw error;
  }
}
