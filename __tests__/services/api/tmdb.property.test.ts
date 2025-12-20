/**
 * Property-based tests for TMDB API client
 * Feature: moviestream-mvp, Property 40: Network Retry Logic
 * 
 * Validates: Requirements 16.7
 * For any failed network request, the app SHALL retry up to 3 times 
 * with exponential backoff before showing an error.
 */

import * as fc from 'fast-check';
import { 
  fetchWithRetry, 
  calculateBackoffDelay, 
  TMDBApiError,
  type RetryConfig 
} from '@/services/api/tmdb';

describe('Feature: moviestream-mvp, Property 40: Network Retry Logic', () => {
  /**
   * Property 40: Network Retry Logic
   * For any failed network request, the app SHALL retry up to 3 times 
   * with exponential backoff before showing an error.
   * 
   * **Validates: Requirements 16.7**
   */
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

    it('should produce increasing delays for consecutive attempts until max is reached', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 2000 }), // base delay
          fc.integer({ min: 5000, max: 20000 }), // max delay
          (baseDelayMs, maxDelayMs) => {
            const config: RetryConfig = {
              maxAttempts: 3,
              baseDelayMs,
              maxDelayMs,
            };

            const delays = [0, 1, 2, 3, 4].map(attempt => 
              calculateBackoffDelay(attempt, config)
            );

            // Each delay should be >= previous delay (monotonically increasing until cap)
            for (let i = 1; i < delays.length; i++) {
              expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
            }

            // First delay should equal base delay
            expect(delays[0]).toBe(baseDelayMs);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Retry Behavior', () => {
    // Mock fetch for testing retry behavior
    let originalFetch: typeof global.fetch;
    let fetchCallCount: number;

    beforeEach(() => {
      originalFetch = global.fetch;
      fetchCallCount = 0;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should retry exactly maxAttempts times for retryable errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // max attempts
          async (maxAttempts) => {
            fetchCallCount = 0;

            // Mock fetch to always fail with a retryable error (5xx)
            global.fetch = jest.fn().mockImplementation(() => {
              fetchCallCount++;
              return Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
              });
            });

            const config: RetryConfig = {
              maxAttempts,
              baseDelayMs: 1, // Use minimal delay for tests
              maxDelayMs: 10,
            };

            await expect(
              fetchWithRetry('https://api.example.com/test', {}, config)
            ).rejects.toThrow(TMDBApiError);

            // Should have attempted exactly maxAttempts times
            expect(fetchCallCount).toBe(maxAttempts);
          }
        ),
        { numRuns: 20 } // Reduced runs for async tests
      );
    });

    it('should not retry for non-retryable errors (4xx)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 400, max: 499 }), // 4xx status codes
          async (statusCode) => {
            fetchCallCount = 0;

            global.fetch = jest.fn().mockImplementation(() => {
              fetchCallCount++;
              return Promise.resolve({
                ok: false,
                status: statusCode,
                statusText: 'Client Error',
              });
            });

            const config: RetryConfig = {
              maxAttempts: 3,
              baseDelayMs: 1,
              maxDelayMs: 10,
            };

            await expect(
              fetchWithRetry('https://api.example.com/test', {}, config)
            ).rejects.toThrow(TMDBApiError);

            // Should only attempt once for non-retryable errors
            expect(fetchCallCount).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should retry for 5xx server errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 500, max: 599 }), // 5xx status codes
          async (statusCode) => {
            fetchCallCount = 0;

            global.fetch = jest.fn().mockImplementation(() => {
              fetchCallCount++;
              return Promise.resolve({
                ok: false,
                status: statusCode,
                statusText: 'Server Error',
              });
            });

            const config: RetryConfig = {
              maxAttempts: 3,
              baseDelayMs: 1,
              maxDelayMs: 10,
            };

            await expect(
              fetchWithRetry('https://api.example.com/test', {}, config)
            ).rejects.toThrow(TMDBApiError);

            // Should attempt all 3 times for retryable errors
            expect(fetchCallCount).toBe(3);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should succeed immediately on first successful response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            data: fc.string(),
            id: fc.integer(),
          }),
          async (responseData) => {
            fetchCallCount = 0;

            global.fetch = jest.fn().mockImplementation(() => {
              fetchCallCount++;
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(responseData),
              });
            });

            const config: RetryConfig = {
              maxAttempts: 3,
              baseDelayMs: 1,
              maxDelayMs: 10,
            };

            const result = await fetchWithRetry('https://api.example.com/test', {}, config);

            // Should only call fetch once on success
            expect(fetchCallCount).toBe(1);
            expect(result).toEqual(responseData);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should succeed after retries if a later attempt succeeds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 2 }), // fail count before success
          fc.record({ data: fc.string() }),
          async (failCount, responseData) => {
            fetchCallCount = 0;

            global.fetch = jest.fn().mockImplementation(() => {
              fetchCallCount++;
              if (fetchCallCount <= failCount) {
                return Promise.resolve({
                  ok: false,
                  status: 500,
                  statusText: 'Server Error',
                });
              }
              return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(responseData),
              });
            });

            const config: RetryConfig = {
              maxAttempts: 3,
              baseDelayMs: 1,
              maxDelayMs: 10,
            };

            const result = await fetchWithRetry('https://api.example.com/test', {}, config);

            // Should have called fetch failCount + 1 times
            expect(fetchCallCount).toBe(failCount + 1);
            expect(result).toEqual(responseData);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should retry for rate limiting (429) errors', async () => {
      fetchCallCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        });
      });

      const config: RetryConfig = {
        maxAttempts: 3,
        baseDelayMs: 1,
        maxDelayMs: 10,
      };

      await expect(
        fetchWithRetry('https://api.example.com/test', {}, config)
      ).rejects.toThrow(TMDBApiError);

      // Should attempt all 3 times for rate limiting
      expect(fetchCallCount).toBe(3);
    });
  });

  describe('TMDBApiError', () => {
    it('should correctly identify retryable status codes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 500, max: 599 }),
          (statusCode) => {
            const error = new TMDBApiError('Server Error', statusCode, true);
            expect(error.isRetryable).toBe(true);
            expect(error.statusCode).toBe(statusCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify non-retryable status codes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 499 }),
          (statusCode) => {
            const error = new TMDBApiError('Client Error', statusCode, false);
            expect(error.isRetryable).toBe(false);
            expect(error.statusCode).toBe(statusCode);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
