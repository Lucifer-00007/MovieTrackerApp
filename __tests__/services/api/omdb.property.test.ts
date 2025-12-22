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
  type RetryConfig,
  type OMDbSearchResponse,
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
