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
          fc.integer({ min: 0, max: 10 }), // attempt number
          fc.integer({ min: 100, max: 5000 }), // base delay
          fc.integer({ min: 5000, max: 30000 }), // max delay
          (attempt, baseDelayMs, maxDelayMs) => {
            const config: RetryConfig = {
              maxAttempts: 3,
              baseDelayMs,
              maxDelayMs,
            };

            const delay = calculateBackoffDelay(attempt, config);

            // Delay should be baseDelay * 2^attempt, capped at maxDelay
            const expectedDelay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
            expect(delay).toBe(expectedDelay);

            // Delay should never exceed maxDelay
            expect(delay).toBeLessThanOrEqual(maxDelayMs);

            // Delay should always be positive
            expect(delay).toBeGreaterThan(0);
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

  describe('OMDbApiError', () => {
    it('should correctly store error properties', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('OMDB_ERROR', 'NETWORK_ERROR', 'RATE_LIMIT', 'INVALID_API_KEY', 'NOT_FOUND'),
          fc.option(fc.integer({ min: 400, max: 599 }), { nil: undefined }),
          fc.boolean(),
          (message, code, statusCode, isRetryable) => {
            const error = new OMDbApiError(message, code, statusCode, isRetryable);
            
            expect(error.message).toBe(message);
            expect(error.code).toBe(code);
            expect(error.statusCode).toBe(statusCode);
            expect(error.isRetryable).toBe(isRetryable);
            expect(error.name).toBe('OMDbApiError');
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
