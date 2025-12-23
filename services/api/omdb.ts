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

/** OMDb API Error class */
export class OMDbApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public isRetryable: boolean = false,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'OMDbApiError';
  }
}

/** Retry configuration */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/** Retryable error codes */
const RETRYABLE_ERROR_CODES = ['NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate delay for exponential backoff
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
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
  if (error instanceof OMDbApiError) {
    return error.isRetryable || RETRYABLE_ERROR_CODES.includes(error.code);
  }
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  return false;
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
 */
async function handleOMDbResponse<T extends { Response: string; Error?: string }>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    const isRetryable = response.status >= 500 || response.status === 429;
    const code = response.status === 429 ? 'RATE_LIMIT' : 'HTTP_ERROR';
    
    throw new OMDbApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      code,
      response.status,
      isRetryable
    );
  }
  
  const data = await response.json() as T;
  
  // OMDb returns Response: "False" for API-level errors
  if (data.Response === 'False') {
    const errorMessage = data.Error || 'Unknown OMDb error';
    
    // Determine error code based on message
    let code = 'OMDB_ERROR';
    if (errorMessage.includes('Invalid API key')) {
      code = 'INVALID_API_KEY';
    } else if (errorMessage.includes('not found')) {
      code = 'NOT_FOUND';
    } else if (errorMessage.includes('Too many results')) {
      code = 'TOO_MANY_RESULTS';
    }
    
    throw new OMDbApiError(errorMessage, code, undefined, false);
  }
  
  return data;
}

/**
 * Execute a fetch request with retry logic and exponential backoff
 * @param url - URL to fetch (must be HTTPS)
 * @param config - Retry configuration
 * @returns Response data
 */
export async function fetchWithRetry<T extends { Response: string; Error?: string }>(
  url: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  // Validate HTTPS usage (Requirement 1.4)
  if (!isHttpsUrl(url)) {
    throw new OMDbApiError(
      'OMDb API requests must use HTTPS',
      'INVALID_PROTOCOL',
      undefined,
      false
    );
  }
  
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      return await handleOMDbResponse<T>(response);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === config.maxAttempts - 1 || !isRetryableError(error)) {
        throw lastError;
      }

      // Log retry attempt
      console.warn(`[OMDb] Retry attempt ${attempt + 1}/${config.maxAttempts} after error:`, lastError.message);

      // Wait before retrying with exponential backoff
      const delay = calculateBackoffDelay(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Unknown error during fetch');
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
    if (error instanceof OMDbApiError && error.code === 'NOT_FOUND') {
      return {
        items: [],
        totalResults: 0,
        page,
        totalPages: 0,
      };
    }
    
    // Handle "Too many results" error
    if (error instanceof OMDbApiError && error.code === 'TOO_MANY_RESULTS') {
      console.warn('[OMDb] Search query too broad, returning empty results');
      return {
        items: [],
        totalResults: 0,
        page,
        totalPages: 0,
      };
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
    throw new OMDbApiError(
      'Invalid IMDb ID format. Must start with "tt"',
      'INVALID_IMDB_ID',
      undefined,
      false
    );
  }
  
  const url = buildOMDbUrl({
    i: imdbId,
    plot,
  });
  
  return fetchWithRetry<OMDbDetailResponse>(url);
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
    throw new OMDbApiError(
      'Title is required for detail lookup',
      'INVALID_TITLE',
      undefined,
      false
    );
  }
  
  const url = buildOMDbUrl({
    t: title.trim(),
    type,
    y: year,
    plot,
  });
  
  return fetchWithRetry<OMDbDetailResponse>(url);
}
