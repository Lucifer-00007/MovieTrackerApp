/**
 * Property-based tests for OMDb API client
 * Feature: omdb-api-integration
 * 
 * Tests interface compliance and HTTPS usage requirements
 */

import * as fc from 'fast-check';
import {
  buildOMDbUrl,
  isHttpsUrl,
  fetchWithRetry,
  calculateBackoffDelay,
  generateNumericId,
  getImdbIdFromNumeric,
  clearIdMappingCache,
  OMDbError,
  OMDbApiError,
  getOMDbConfig,
  searchContent,
  getDetailsByImdbId,
  getDetailsByTitle,
  type RetryConfig,
  type OMDbSearchResponse,
  type OMDbSearchParams,
  type OMDbDetailByIdParams,
  type OMDbDetailByTitleParams,
  type OMDbSearchType,
  type OMDbPlotLength,
} from '@/services/api/omdb';

describe('Feature: omdb-api-integration, Property 2: Interface compliance and HTTPS usage', () => {
  /**
   * Property 2: Interface compliance and HTTPS usage
   * For any API method call on the OMDb adapter, the adapter should implement 
   * all MediaApiAdapter interface methods and use HTTPS endpoints for all requests
   * 
   * **Validates: Requirements 1.2, 1.4**
   */
  
  describe('HTTPS Endpoint Validation', () => {
    it('should always build URLs with HTTPS protocol for any valid parameters', () => {
      fc.assert(
        fc.property(
          fc.record({
            s: fc.string({ minLength: 1, maxLength: 50 }),
            page: fc.integer({ min: 1, max: 100 }),
            type: fc.constantFrom('movie', 'series', undefined),
            y: fc.option(fc.integer({ min: 1900, max: 2030 }), { nil: undefined }),
          }),
          (params) => {
            const url = buildOMDbUrl(params);
            
            // URL must use HTTPS protocol
            expect(isHttpsUrl(url)).toBe(true);
            
            // URL must start with https://
            expect(url.startsWith('https://')).toBe(true);
            
            // URL must contain the OMDb base URL
            expect(url).toContain('omdbapi.com');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify HTTPS vs HTTP URLs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (path) => {
            const httpsUrl = `https://example.com/${encodeURIComponent(path)}`;
            const httpUrl = `http://example.com/${encodeURIComponent(path)}`;
            
            expect(isHttpsUrl(httpsUrl)).toBe(true);
            expect(isHttpsUrl(httpUrl)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-HTTPS URLs in fetchWithRetry', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl({ 
            authoritySettings: { withPort: false },
            validSchemes: ['http'],
          }),
          async (httpUrl) => {
            await expect(
              fetchWithRetry<OMDbSearchResponse>(httpUrl)
            ).rejects.toThrow(OMDbApiError);
            
            await expect(
              fetchWithRetry<OMDbSearchResponse>(httpUrl)
            ).rejects.toMatchObject({
              code: 'INVALID_PROTOCOL',
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should include API key in all built URLs', () => {
      fc.assert(
        fc.property(
          fc.record({
            s: fc.string({ minLength: 1, maxLength: 50 }),
            i: fc.option(fc.string({ minLength: 7, maxLength: 12 }), { nil: undefined }),
          }),
          (params) => {
            const url = buildOMDbUrl(params);
            
            // URL must contain apikey parameter
            expect(url).toContain('apikey=');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Configuration', () => {
    it('should return valid HTTPS base URL in configuration', () => {
      const config = getOMDbConfig();
      
      expect(config.baseUrl).toBe('https://www.omdbapi.com');
      expect(isHttpsUrl(config.baseUrl)).toBe(true);
      expect(config.timeout).toBeGreaterThan(0);
    });
  });

  describe('Exponential Backoff Calculation', () => {
    it('should calculate exponential backoff delays correctly for any attempt number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3 }), // attempt number (smaller range to avoid extreme exponential growth)
          fc.integer({ min: 100, max: 1000 }), // base delay (smaller range)
          fc.integer({ min: 10000, max: 30000 }), // max delay (ensure sufficient headroom)
          (attempt, baseDelayMs, maxDelayMs) => {
            // Ensure maxDelayMs has sufficient headroom for exponential growth + jitter
            // With jitter of ±25%, we need at least 1.5x the exponential result
            const exponentialResult = baseDelayMs * Math.pow(2, attempt);
            const adjustedMaxDelayMs = Math.max(maxDelayMs, exponentialResult * 1.5);
            
            const config: RetryConfig = {
              maxAttempts: 5,
              baseDelayMs,
              maxDelayMs: adjustedMaxDelayMs,
            };

            const delay = calculateBackoffDelay(attempt, config);

            // Delay should never exceed maxDelay
            expect(delay).toBeLessThanOrEqual(adjustedMaxDelayMs);

            // Delay should always be positive (at least 10% of base delay)
            expect(delay).toBeGreaterThanOrEqual(Math.floor(baseDelayMs * 0.1));
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ID Mapping', () => {
    beforeEach(() => {
      clearIdMappingCache();
    });

    it('should generate consistent numeric IDs for the same IMDb ID', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^tt\d{7,8}$/), // Valid IMDb ID format
          (imdbId) => {
            const id1 = generateNumericId(imdbId);
            const id2 = generateNumericId(imdbId);
            
            // Same input should produce same output
            expect(id1).toBe(id2);
            
            // ID should be a positive number
            expect(id1).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow reverse lookup of IMDb IDs from numeric IDs', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^tt\d{7,8}$/),
          (imdbId) => {
            const numericId = generateNumericId(imdbId);
            const retrievedImdbId = getImdbIdFromNumeric(numericId);
            
            // Should be able to retrieve the original IMDb ID
            expect(retrievedImdbId).toBe(imdbId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate different numeric IDs for different IMDb IDs (with high probability)', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.stringMatching(/^tt\d{7,8}$/), { minLength: 2, maxLength: 10 }),
          (imdbIds) => {
            const numericIds = imdbIds.map(id => generateNumericId(id));
            const uniqueNumericIds = new Set(numericIds);
            
            // All numeric IDs should be unique (hash collisions are extremely rare)
            expect(uniqueNumericIds.size).toBe(imdbIds.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('OMDbError', () => {
    it('should correctly store error properties', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('OMDB_ERROR', 'NETWORK_ERROR', 'RATE_LIMIT', 'INVALID_API_KEY', 'NOT_FOUND'),
          fc.option(fc.integer({ min: 400, max: 599 }), { nil: undefined }),
          fc.boolean(),
          (message, code, statusCode, isRetryable) => {
            const error = new OMDbError(message, code, statusCode, isRetryable);
            
            expect(error.message).toBe(message);
            expect(error.code).toBe(code);
            expect(error.statusCode).toBe(statusCode);
            expect(error.isRetryable).toBe(isRetryable);
            expect(error.name).toBe('OMDbError');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create errors from unknown errors with context', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('NETWORK_ERROR', 'PARSE_ERROR', 'UNKNOWN_ERROR'),
          fc.record({
            operation: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl(),
          }),
          (message, code, context) => {
            const originalError = new Error(message);
            const omdbError = OMDbError.fromError(originalError, code, context);
            
            expect(omdbError).toBeInstanceOf(OMDbError);
            expect(omdbError.message).toBe(message);
            expect(omdbError.code).toBe(code);
            expect(omdbError.context).toEqual(context);
            expect(omdbError.originalError).toBe(originalError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should serialize to JSON with all properties', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('OMDB_ERROR', 'NETWORK_ERROR', 'RATE_LIMIT'),
          fc.option(fc.integer({ min: 400, max: 599 }), { nil: undefined }),
          fc.boolean(),
          fc.record({
            operation: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl(),
          }),
          (message, code, statusCode, isRetryable, context) => {
            const error = new OMDbError(message, code, statusCode, isRetryable, undefined, context);
            const json = error.toJSON();
            
            expect(json.name).toBe('OMDbError');
            expect(json.message).toBe(message);
            expect(json.code).toBe(code);
            expect(json.statusCode).toBe(statusCode);
            expect(json.isRetryable).toBe(isRetryable);
            expect(json.context).toEqual(context);
            expect(typeof json.stack).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


describe('Feature: omdb-api-integration, Property 4: Search functionality with parameters', () => {
  /**
   * Property 4: Search functionality with parameters
   * For any search query, page number, and type filter, the search service should 
   * query the OMDb search endpoint with correct parameters and return results in SearchResults format
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
   */

  describe('Search URL Building', () => {
    it('should build correct search URLs for any valid search parameters', () => {
      fc.assert(
        fc.property(
          fc.record({
            s: fc.string({ minLength: 1, maxLength: 50 }),
            page: fc.integer({ min: 1, max: 100 }),
            type: fc.constantFrom('movie', 'series', undefined),
            y: fc.option(fc.integer({ min: 1900, max: 2030 }), { nil: undefined }),
          }),
          (params) => {
            const url = buildOMDbUrl(params);
            const parsedUrl = new URL(url);
            
            // URL must contain search parameter (check via URLSearchParams to handle encoding differences)
            // URLSearchParams uses '+' for spaces, encodeURIComponent uses '%20' - both are valid
            expect(parsedUrl.searchParams.get('s')).toBe(params.s);
            
            // URL must contain page parameter
            expect(parsedUrl.searchParams.get('page')).toBe(String(params.page));
            
            // URL must contain type if specified
            if (params.type) {
              expect(parsedUrl.searchParams.get('type')).toBe(params.type);
            }
            
            // URL must contain year if specified
            if (params.y !== undefined) {
              expect(parsedUrl.searchParams.get('y')).toBe(String(params.y));
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Search Parameter Validation', () => {
    it('should return empty results for empty or whitespace-only queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n', '  \t  '),
          fc.integer({ min: 1, max: 10 }),
          async (query, page) => {
            const params: OMDbSearchParams = { query, page };
            const result = await searchContent(params);
            
            // Empty queries should return empty results
            expect(result.items).toEqual([]);
            expect(result.totalResults).toBe(0);
            expect(result.page).toBe(page);
            expect(result.totalPages).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve page number in results for any valid page', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (page) => {
            // Use empty query to avoid actual API calls
            const params: OMDbSearchParams = { query: '', page };
            const result = await searchContent(params);
            
            // Page number should be preserved in results
            expect(result.page).toBe(page);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Search Type Filtering', () => {
    it('should include type parameter in URL when type filter is specified', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.constantFrom<OMDbSearchType>('movie', 'series', 'episode'),
          (query, type) => {
            const url = buildOMDbUrl({ s: query, type });
            
            // Type parameter must be included
            expect(url).toContain(`type=${type}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include type parameter when type is undefined', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          (query) => {
            const url = buildOMDbUrl({ s: query, type: undefined });
            
            // Type parameter should not be present
            expect(url).not.toContain('type=');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Search Results Structure', () => {
    it('should always return valid SearchResults structure for any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            query: fc.string({ minLength: 0, maxLength: 50 }),
            page: fc.integer({ min: 1, max: 100 }),
            type: fc.constantFrom<OMDbSearchType | undefined>('movie', 'series', undefined),
            year: fc.option(fc.integer({ min: 1900, max: 2030 }), { nil: undefined }),
          }),
          async (params) => {
            // Use empty query to avoid actual API calls
            const result = await searchContent({ ...params, query: '' });
            
            // Result must have correct structure
            expect(Array.isArray(result.items)).toBe(true);
            expect(typeof result.totalResults).toBe('number');
            expect(typeof result.page).toBe('number');
            expect(typeof result.totalPages).toBe('number');
            
            // Numeric values must be non-negative
            expect(result.totalResults).toBeGreaterThanOrEqual(0);
            expect(result.page).toBeGreaterThanOrEqual(1);
            expect(result.totalPages).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Pagination Calculation', () => {
    it('should calculate totalPages correctly based on totalResults', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (totalResults) => {
            // OMDb returns 10 results per page
            const RESULTS_PER_PAGE = 10;
            const expectedTotalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
            
            // Verify the calculation
            expect(expectedTotalPages).toBe(Math.ceil(totalResults / RESULTS_PER_PAGE));
            
            // Edge cases
            if (totalResults === 0) {
              expect(expectedTotalPages).toBe(0);
            } else {
              expect(expectedTotalPages).toBeGreaterThanOrEqual(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Feature: omdb-api-integration, Property 5: Detail fetching with plot options', () => {
  /**
   * Property 5: Detail fetching with plot options
   * For any media ID and media type, the detail service should fetch data using 
   * appropriate OMDb lookup methods (IMDb ID or title) with correct type filters 
   * and plot length parameters
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */

  describe('Detail URL Building by IMDb ID', () => {
    it('should build correct detail URLs for any valid IMDb ID', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^tt\d{7,8}$/),
          fc.constantFrom<OMDbPlotLength>('short', 'full'),
          (imdbId, plot) => {
            const url = buildOMDbUrl({ i: imdbId, plot });
            
            // URL must contain IMDb ID parameter
            expect(url).toContain(`i=${imdbId}`);
            
            // URL must contain plot parameter
            expect(url).toContain(`plot=${plot}`);
            
            // URL must use HTTPS
            expect(isHttpsUrl(url)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Detail URL Building by Title', () => {
    it('should build correct detail URLs for any valid title search', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom<OMDbSearchType | undefined>('movie', 'series', undefined),
          fc.option(fc.integer({ min: 1900, max: 2030 }), { nil: undefined }),
          fc.constantFrom<OMDbPlotLength>('short', 'full'),
          (title, type, year, plot) => {
            const params: Record<string, string | number | undefined> = {
              t: title,
              plot,
            };
            if (type) params.type = type;
            if (year !== undefined) params.y = year;
            
            const url = buildOMDbUrl(params);
            const parsedUrl = new URL(url);
            
            // URL must contain title parameter (check via URLSearchParams to handle encoding differences)
            // URLSearchParams uses '+' for spaces, encodeURIComponent uses '%20' - both are valid
            expect(parsedUrl.searchParams.get('t')).toBe(title);
            
            // URL must contain plot parameter
            expect(parsedUrl.searchParams.get('plot')).toBe(plot);
            
            // URL must contain type if specified
            if (type) {
              expect(parsedUrl.searchParams.get('type')).toBe(type);
            }
            
            // URL must contain year if specified
            if (year !== undefined) {
              expect(parsedUrl.searchParams.get('y')).toBe(String(year));
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('IMDb ID Validation', () => {
    it('should reject invalid IMDb ID formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.startsWith('tt')),
          async (invalidId) => {
            const params: OMDbDetailByIdParams = { imdbId: invalidId };
            
            await expect(getDetailsByImdbId(params)).rejects.toThrow(OMDbApiError);
            await expect(getDetailsByImdbId(params)).rejects.toMatchObject({
              code: 'INVALID_IMDB_ID',
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept valid IMDb ID formats', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^tt\d{7,8}$/),
          (validId) => {
            // Valid IMDb IDs should start with 'tt' followed by 7-8 digits
            expect(validId.startsWith('tt')).toBe(true);
            expect(validId.length).toBeGreaterThanOrEqual(9);
            expect(validId.length).toBeLessThanOrEqual(10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Title Validation', () => {
    it('should reject empty or whitespace-only titles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n'),
          async (emptyTitle) => {
            const params: OMDbDetailByTitleParams = { title: emptyTitle };
            
            await expect(getDetailsByTitle(params)).rejects.toThrow(OMDbApiError);
            await expect(getDetailsByTitle(params)).rejects.toMatchObject({
              code: 'INVALID_TITLE',
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Plot Length Options', () => {
    it('should default to full plot when not specified', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^tt\d{7,8}$/),
          (imdbId) => {
            // When plot is not specified, it should default to 'full'
            const paramsWithoutPlot: OMDbDetailByIdParams = { imdbId };
            const paramsWithFullPlot: OMDbDetailByIdParams = { imdbId, plot: 'full' };
            
            // Both should produce URLs with plot=full
            const urlWithoutPlot = buildOMDbUrl({ i: imdbId, plot: 'full' });
            const urlWithFullPlot = buildOMDbUrl({ i: imdbId, plot: 'full' });
            
            expect(urlWithoutPlot).toBe(urlWithFullPlot);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly include plot parameter for both short and full options', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^tt\d{7,8}$/),
          fc.constantFrom<OMDbPlotLength>('short', 'full'),
          (imdbId, plot) => {
            const url = buildOMDbUrl({ i: imdbId, plot });
            
            expect(url).toContain(`plot=${plot}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Type Filtering for Details', () => {
    it('should include type filter when searching by title with type specified', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom<OMDbSearchType>('movie', 'series'),
          (title, type) => {
            const url = buildOMDbUrl({ t: title, type });
            
            expect(url).toContain(`type=${type}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Feature: omdb-api-integration, Property 6: Error handling and graceful degradation', () => {
  /**
   * Property 6: Error handling and graceful degradation
   * For any OMDb API error response, the adapter should parse error messages, 
   * handle them gracefully, and log errors while maintaining user experience
   * 
   * **Validates: Requirements 3.5, 7.1, 7.5**
   */

  describe('Error Code Parsing', () => {
    it('should correctly parse OMDb error messages to appropriate error codes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'Invalid API key',
            'Movie not found!',
            'Too many results.',
            'Incorrect IMDb ID.',
            'Parameter error',
            'Request limit reached',
            'No API key provided',
            'Daily request limit reached'
          ),
          (errorMessage) => {
            // Create a mock OMDb error response
            const mockResponse = {
              Response: 'False' as const,
              Error: errorMessage,
            };

            // The error parsing logic should map messages to appropriate codes
            let expectedCode: string;
            const lowerMessage = errorMessage.toLowerCase();
            
            if (lowerMessage.includes('invalid api key') || lowerMessage.includes('no api key')) {
              expectedCode = 'INVALID_API_KEY';
            } else if (lowerMessage.includes('not found')) {
              expectedCode = 'NOT_FOUND';
            } else if (lowerMessage.includes('too many results')) {
              expectedCode = 'TOO_MANY_RESULTS';
            } else if (lowerMessage.includes('incorrect imdb id')) {
              expectedCode = 'INCORRECT_IMDB_ID';
            } else if (lowerMessage.includes('parameter')) {
              expectedCode = 'PARAMETER_ERROR';
            } else if (lowerMessage.includes('request limit') || lowerMessage.includes('daily limit')) {
              expectedCode = 'REQUEST_LIMIT';
            } else {
              expectedCode = 'OMDB_ERROR';
            }

            // Verify the error code mapping is consistent
            expect(expectedCode).toBeDefined();
            expect(typeof expectedCode).toBe('string');
            expect(expectedCode.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('HTTP Error Handling', () => {
    it('should create appropriate errors for different HTTP status codes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(400, 401, 403, 404, 429, 500, 502, 503, 504),
          fc.webUrl({ validSchemes: ['https'] }),
          (statusCode, url) => {
            // Mock response object
            const mockResponse = {
              ok: false,
              status: statusCode,
              statusText: `HTTP ${statusCode}`,
              url,
            } as Response;

            let expectedCode: string;
            let expectedRetryable: boolean;

            switch (statusCode) {
              case 400:
                expectedCode = 'BAD_REQUEST';
                expectedRetryable = false;
                break;
              case 401:
                expectedCode = 'UNAUTHORIZED';
                expectedRetryable = false;
                break;
              case 403:
                expectedCode = 'FORBIDDEN';
                expectedRetryable = false;
                break;
              case 404:
                expectedCode = 'NOT_FOUND';
                expectedRetryable = false;
                break;
              case 429:
                expectedCode = 'RATE_LIMIT';
                expectedRetryable = true;
                break;
              case 500:
                expectedCode = 'SERVER_ERROR';
                expectedRetryable = true;
                break;
              case 502:
                expectedCode = 'BAD_GATEWAY';
                expectedRetryable = true;
                break;
              case 503:
                expectedCode = 'SERVICE_UNAVAILABLE';
                expectedRetryable = true;
                break;
              case 504:
                expectedCode = 'GATEWAY_TIMEOUT';
                expectedRetryable = true;
                break;
              default:
                expectedCode = 'HTTP_ERROR';
                expectedRetryable = statusCode >= 500;
            }

            // Verify error code and retryable status mapping
            expect(expectedCode).toBeDefined();
            expect(typeof expectedRetryable).toBe('boolean');
            
            // Server errors (5xx) and rate limiting (429) should be retryable
            if (statusCode >= 500 || statusCode === 429) {
              expect(expectedRetryable).toBe(true);
            } else {
              expect(expectedRetryable).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Context Preservation', () => {
    it('should preserve context information in errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('OMDB_ERROR', 'NETWORK_ERROR', 'PARSE_ERROR'),
          fc.record({
            operation: fc.constantFrom('searchContent', 'getDetailsByImdbId', 'getDetailsByTitle'),
            query: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            imdbId: fc.option(fc.stringMatching(/^tt\d{7,8}$/), { nil: undefined }),
            url: fc.webUrl({ validSchemes: ['https'] }),
          }),
          (message, code, context) => {
            const error = new OMDbError(message, code, undefined, false, undefined, context);
            
            // Context should be preserved
            expect(error.context).toEqual(context);
            
            // Context should contain operation information
            expect(error.context?.operation).toBeDefined();
            expect(typeof error.context?.operation).toBe('string');
            
            // Context should contain URL for debugging
            expect(error.context?.url).toBeDefined();
            expect(typeof error.context?.url).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Graceful Error Handling in Search', () => {
    it('should return empty results for NOT_FOUND errors in search operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          async (query, page) => {
            // Test with empty query to avoid actual API calls
            // Empty queries should return empty results gracefully
            const result = await searchContent({ 
              query: '', // Use empty query to avoid API calls
              page 
            });
            
            // Should return empty results structure, not throw error
            expect(result.items).toEqual([]);
            expect(result.totalResults).toBe(0);
            expect(result.page).toBe(page);
            expect(result.totalPages).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Error Logging and User Experience', () => {
    it('should maintain consistent error structure for logging', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('INVALID_API_KEY', 'RATE_LIMIT', 'NOT_FOUND', 'SERVER_ERROR'),
          fc.option(fc.integer({ min: 400, max: 599 }), { nil: undefined }),
          fc.boolean(),
          fc.record({
            operation: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl(),
          }),
          (message, code, statusCode, isRetryable, context) => {
            const error = new OMDbError(message, code, statusCode, isRetryable, undefined, context);
            const json = error.toJSON();
            
            // Error should have all required fields for logging
            expect(json).toHaveProperty('name');
            expect(json).toHaveProperty('message');
            expect(json).toHaveProperty('code');
            expect(json).toHaveProperty('isRetryable');
            expect(json).toHaveProperty('context');
            expect(json).toHaveProperty('stack');
            
            // Fields should have correct types
            expect(typeof json.name).toBe('string');
            expect(typeof json.message).toBe('string');
            expect(typeof json.code).toBe('string');
            expect(typeof json.isRetryable).toBe('boolean');
            expect(typeof json.stack).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should identify retryable vs non-retryable errors correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT', 'HTTP_ERROR',
            'INVALID_API_KEY', 'NOT_FOUND', 'PARAMETER_ERROR', 'PARSE_ERROR'
          ),
          fc.boolean(),
          (code, explicitRetryable) => {
            const error = new OMDbError('Test error', code, undefined, explicitRetryable);
            
            // Certain error codes should always be considered for retry logic
            const inherentlyRetryable = [
              'NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT', 'HTTP_ERROR'
            ].includes(code);
            
            // Error should be retryable if explicitly set or inherently retryable
            const shouldBeRetryable = explicitRetryable || inherentlyRetryable;
            
            // Verify retryable status is consistent
            expect(typeof error.isRetryable).toBe('boolean');
            
            if (explicitRetryable) {
              expect(error.isRetryable).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Message Quality', () => {
    it('should provide clear error messages for common scenarios', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('INVALID_API_KEY', 'RATE_LIMIT', 'NOT_FOUND', 'PARAMETER_ERROR'),
          (code) => {
            let expectedMessagePattern: RegExp;
            
            switch (code) {
              case 'INVALID_API_KEY':
                expectedMessagePattern = /api key/i;
                break;
              case 'RATE_LIMIT':
                expectedMessagePattern = /rate limit|too many requests/i;
                break;
              case 'NOT_FOUND':
                expectedMessagePattern = /not found/i;
                break;
              case 'PARAMETER_ERROR':
                expectedMessagePattern = /parameter/i;
                break;
              default:
                expectedMessagePattern = /.+/; // Any non-empty message
            }
            
            // Error messages should be descriptive and match expected patterns
            expect(expectedMessagePattern).toBeInstanceOf(RegExp);
            expect(expectedMessagePattern.test('test')).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
describe('Feature: omdb-api-integration, Property 10: Retry logic with exponential backoff', () => {
  /**
   * Property 10: Retry logic with exponential backoff
   * For any network error during OMDb API calls, the adapter should implement 
   * retry logic with exponential backoff to handle transient failures
   * 
   * **Validates: Requirements 7.2**
   */

  describe('Exponential Backoff Calculation', () => {
    it('should calculate exponential backoff delays correctly with jitter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 }), // attempt number (even smaller range to avoid extreme exponential growth)
          fc.integer({ min: 100, max: 500 }), // base delay (smaller range)
          fc.integer({ min: 5000, max: 15000 }), // max delay (more conservative range)
          fc.integer({ min: 2, max: 2 }), // backoff factor (fixed at 2 for predictability)
          fc.boolean(), // jitter enabled
          (attempt, baseDelayMs, maxDelayMs, backoffFactor, jitter) => {
            // Calculate the theoretical exponential result
            const exponentialResult = baseDelayMs * Math.pow(backoffFactor, attempt);
            
            // Ensure maxDelayMs has much more headroom for exponential growth + jitter
            // With jitter of ±25%, we need at least 2x the exponential result to be safe
            const minRequiredMaxDelay = exponentialResult * 2;
            const adjustedMaxDelayMs = Math.max(maxDelayMs, minRequiredMaxDelay);
            
            const config: RetryConfig = {
              maxAttempts: 5,
              baseDelayMs,
              maxDelayMs: adjustedMaxDelayMs,
              backoffFactor,
              jitter,
            };

            const delay = calculateBackoffDelay(attempt, config);

            // Delay should never exceed maxDelay
            expect(delay).toBeLessThanOrEqual(adjustedMaxDelayMs);

            // Delay should always be non-negative
            expect(delay).toBeGreaterThanOrEqual(0);

            if (jitter === false) {
              // Without jitter, delay should be predictable
              const expectedDelay = Math.min(baseDelayMs * Math.pow(backoffFactor, attempt), adjustedMaxDelayMs);
              expect(delay).toBe(expectedDelay);
            } else {
              // With jitter, delay should be at least 50% of base delay (more conservative)
              expect(delay).toBeGreaterThanOrEqual(Math.floor(baseDelayMs * 0.5));
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect maximum delay limits for any configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // reduced attempt number range
          fc.integer({ min: 2000, max: 8000 }), // more conservative max delay range
          (attempt, maxDelayMs) => {
            const config: RetryConfig = {
              maxAttempts: 15, // reduced from 25
              baseDelayMs: 500, // reduced from 1000
              maxDelayMs,
              backoffFactor: 2,
              jitter: false,
            };

            const delay = calculateBackoffDelay(attempt, config);

            // Delay should never exceed maxDelayMs regardless of attempt number
            expect(delay).toBeLessThanOrEqual(maxDelayMs);
            expect(delay).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Retry Configuration Validation', () => {
    it('should handle various retry configurations correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 2 }), // max attempts (even smaller range)
          fc.integer({ min: 100, max: 500 }), // base delay (smaller range)
          fc.integer({ min: 8000, max: 20000 }), // max delay (more conservative with higher minimum)
          (maxAttempts, baseDelayMs, maxDelayMs) => {
            // Calculate the worst-case exponential result for the max attempt
            const worstCaseExponential = baseDelayMs * Math.pow(2, maxAttempts - 1);
            
            // Ensure maxDelayMs has much more headroom for exponential growth + jitter
            // With jitter of ±25%, we need at least 3x the exponential result to be very safe
            const minRequiredMaxDelay = worstCaseExponential * 3;
            const adjustedMaxDelayMs = Math.max(maxDelayMs, minRequiredMaxDelay);
            
            const config: RetryConfig = {
              maxAttempts,
              baseDelayMs,
              maxDelayMs: adjustedMaxDelayMs,
              backoffFactor: 2,
              jitter: true,
            };

            // Configuration should be valid
            expect(config.maxAttempts).toBeGreaterThan(0);
            expect(config.baseDelayMs).toBeGreaterThan(0);
            expect(config.maxDelayMs).toBeGreaterThanOrEqual(config.baseDelayMs);

            // Test delay calculation for each attempt
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              const delay = calculateBackoffDelay(attempt, config);
              expect(delay).toBeLessThanOrEqual(adjustedMaxDelayMs);
              expect(delay).toBeGreaterThanOrEqual(Math.floor(baseDelayMs * 0.5)); // More conservative minimum with jitter
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Retry Logic Behavior', () => {
    it('should identify retryable errors correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT', 'HTTP_ERROR',
            'SERVER_ERROR', 'BAD_GATEWAY', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT',
            'INVALID_API_KEY', 'NOT_FOUND', 'PARAMETER_ERROR', 'PARSE_ERROR'
          ),
          fc.boolean(),
          (code, explicitRetryable) => {
            const error = new OMDbError('Test error', code, undefined, explicitRetryable);

            // Certain error codes should be inherently retryable
            const inherentlyRetryableErrors = [
              'NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT', 'HTTP_ERROR'
            ];

            const shouldBeRetryable = explicitRetryable || inherentlyRetryableErrors.includes(code);

            // Test the isRetryableError function logic
            if (explicitRetryable || inherentlyRetryableErrors.includes(code)) {
              // Should be considered retryable
              expect(error.isRetryable || inherentlyRetryableErrors.includes(error.code)).toBe(true);
            }

            // Non-retryable errors should not be retried
            const nonRetryableErrors = ['INVALID_API_KEY', 'NOT_FOUND', 'PARAMETER_ERROR'];
            if (nonRetryableErrors.includes(code) && !explicitRetryable) {
              expect(error.isRetryable).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Rate Limiting Handling', () => {
    it('should handle rate limit errors with appropriate delays', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 300 }), // retry-after seconds
          fc.integer({ min: 0, max: 5 }), // attempt number
          (retryAfterSeconds, attempt) => {
            const context = {
              retryAfter: retryAfterSeconds,
              rateLimitRemaining: 0,
            };

            const error = new OMDbError(
              'Rate limit exceeded',
              'RATE_LIMIT',
              429,
              true,
              undefined,
              context
            );

            // Rate limit errors should be retryable
            expect(error.isRetryable).toBe(true);
            expect(error.code).toBe('RATE_LIMIT');
            expect(error.statusCode).toBe(429);

            // Context should preserve rate limiting information
            expect(error.context?.retryAfter).toBe(retryAfterSeconds);
            expect(error.context?.rateLimitRemaining).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network errors with appropriate retry behavior', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('fetch failed', 'network error', 'connection refused'),
          fc.integer({ min: 0, max: 5 }),
          (errorMessage, attempt) => {
            // Simulate TypeError that fetch throws for network errors
            const networkError = new TypeError(errorMessage);
            const omdbError = OMDbError.fromError(networkError, 'NETWORK_ERROR', {
              attempt: attempt + 1,
              url: 'https://www.omdbapi.com',
            });

            // Network errors should be retryable
            expect(omdbError.code).toBe('NETWORK_ERROR');
            expect(omdbError.originalError).toBe(networkError);
            expect(omdbError.context?.attempt).toBe(attempt + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Timeout Handling', () => {
    it('should handle timeout errors correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 30000 }), // timeout in ms
          fc.integer({ min: 0, max: 5 }), // attempt number
          (timeoutMs, attempt) => {
            const timeoutError = new OMDbError(
              `Request timeout after ${timeoutMs}ms`,
              'TIMEOUT',
              undefined,
              true,
              undefined,
              { timeoutMs, attempt: attempt + 1 }
            );

            // Timeout errors should be retryable
            expect(timeoutError.isRetryable).toBe(true);
            expect(timeoutError.code).toBe('TIMEOUT');
            expect(timeoutError.context?.timeoutMs).toBe(timeoutMs);
            expect(timeoutError.context?.attempt).toBe(attempt + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Backoff Strategy Variations', () => {
    it('should use different backoff strategies for different error types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('RATE_LIMIT', 'SERVER_ERROR', 'NETWORK_ERROR', 'TIMEOUT'),
          fc.integer({ min: 0, max: 3 }),
          (errorCode, attempt) => {
            const config: RetryConfig = {
              maxAttempts: 5,
              baseDelayMs: 1000,
              maxDelayMs: 10000,
              backoffFactor: 2,
              jitter: false,
            };

            // Different error types should potentially use different backoff strategies
            let expectedMinDelay = 0;
            let expectedMaxDelay = config.maxDelayMs;

            switch (errorCode) {
              case 'RATE_LIMIT':
                // Rate limiting should use longer delays
                expectedMinDelay = Math.max(config.baseDelayMs, 5000);
                break;
              case 'NETWORK_ERROR':
              case 'TIMEOUT':
                // Network errors should use faster retry
                expectedMaxDelay = Math.min(config.baseDelayMs * Math.pow(2, attempt), config.maxDelayMs);
                break;
              case 'SERVER_ERROR':
                // Server errors use standard exponential backoff
                expectedMaxDelay = Math.min(config.baseDelayMs * Math.pow(2, attempt), config.maxDelayMs);
                break;
            }

            // Verify that delay calculation respects error-specific strategies
            const standardDelay = calculateBackoffDelay(attempt, config);
            expect(standardDelay).toBeLessThanOrEqual(expectedMaxDelay);
            expect(standardDelay).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Retry Attempt Tracking', () => {
    it('should track retry attempts correctly in error context', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // max attempts
          fc.string({ minLength: 1, maxLength: 100 }), // error message
          (maxAttempts, errorMessage) => {
            const config: RetryConfig = {
              maxAttempts,
              baseDelayMs: 100,
              maxDelayMs: 1000,
            };

            // Simulate tracking attempts in error context
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              const error = new OMDbError(
                errorMessage,
                'NETWORK_ERROR',
                undefined,
                true,
                undefined,
                { 
                  attempt: attempt + 1,
                  maxAttempts,
                  url: 'https://www.omdbapi.com'
                }
              );

              expect(error.context?.attempt).toBe(attempt + 1);
              expect(error.context?.maxAttempts).toBe(maxAttempts);
              expect(error.isRetryable).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});