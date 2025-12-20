/**
 * Property-based tests for Error State components
 * Feature: moviestream-mvp
 * 
 * Properties tested:
 * - Property 38: Offline Banner Display
 * - Property 39: Server Error Display
 * - Property 42: Empty Filter Results Handling
 * 
 * Validates: Requirements 16.1, 16.2, 17.2
 */

import * as fc from 'fast-check';
import {
  shouldShowOfflineBanner,
  shouldShowServerError,
  getErrorConfig,
  getErrorTypeFromStatusCode,
  shouldShowFilterSuggestions,
  generateFilterSuggestions,
  validateErrorConfig,
  ErrorType,
  FilterResultState,
} from '../../components/ui/error-state-utils';

// Arbitraries
const errorTypeArb = fc.constantFrom<ErrorType>(
  'network_offline',
  'server_error',
  'not_found',
  'timeout',
  'unknown'
);

const httpStatusCodeArb = fc.integer({ min: 100, max: 599 });

const filterNamesArb = fc.constantFrom('year', 'genre', 'country', 'contentType');

const appliedFiltersArb = fc.array(filterNamesArb, { minLength: 0, maxLength: 4 });

const filterResultStateArb = fc.record({
  hasResults: fc.boolean(),
  totalResults: fc.integer({ min: 0, max: 1000 }),
  appliedFilters: appliedFiltersArb,
});

describe('Error State Property Tests', () => {
  /**
   * Property 38: Offline Banner Display
   * For any network state where connectivity is unavailable,
   * an offline banner with retry button SHALL be displayed.
   * **Validates: Requirements 16.1**
   */
  describe('Property 38: Offline Banner Display', () => {
    it('offline banner is shown when isOffline is true', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          (isOffline) => {
            const shouldShow = shouldShowOfflineBanner(isOffline);
            expect(shouldShow).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('offline banner is hidden when isOffline is false', () => {
      fc.assert(
        fc.property(
          fc.constant(false),
          (isOffline) => {
            const shouldShow = shouldShowOfflineBanner(isOffline);
            expect(shouldShow).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('offline banner visibility is determined solely by isOffline boolean', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isOffline) => {
            const shouldShow = shouldShowOfflineBanner(isOffline);
            expect(shouldShow).toBe(isOffline);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('offline error config has retry capability', () => {
      const config = getErrorConfig('network_offline');
      expect(config.canRetry).toBe(true);
      expect(config.title.length).toBeGreaterThan(0);
      expect(config.message.length).toBeGreaterThan(0);
    });
  });

  /**
   * Property 39: Server Error Display
   * For any API request that returns a server error,
   * an error message with retry option SHALL be displayed.
   * **Validates: Requirements 16.2**
   */
  describe('Property 39: Server Error Display', () => {
    it('server error is shown for 5xx status codes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 500, max: 599 }),
          (statusCode) => {
            const shouldShow = shouldShowServerError(statusCode, true);
            expect(shouldShow).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('server error is not shown for non-5xx status codes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 499 }),
          (statusCode) => {
            const shouldShow = shouldShowServerError(statusCode, true);
            expect(shouldShow).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('server error is not shown when hasError is false', () => {
      fc.assert(
        fc.property(
          httpStatusCodeArb,
          (statusCode) => {
            const shouldShow = shouldShowServerError(statusCode, false);
            expect(shouldShow).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('server error config has retry capability', () => {
      const config = getErrorConfig('server_error');
      expect(config.canRetry).toBe(true);
      expect(config.title.length).toBeGreaterThan(0);
      expect(config.message.length).toBeGreaterThan(0);
    });

    it('error type is correctly determined from status code', () => {
      fc.assert(
        fc.property(
          httpStatusCodeArb,
          (statusCode) => {
            const errorType = getErrorTypeFromStatusCode(statusCode);
            
            if (statusCode >= 500) {
              expect(errorType).toBe('server_error');
            } else if (statusCode === 404) {
              expect(errorType).toBe('not_found');
            } else if (statusCode === 408) {
              expect(errorType).toBe('timeout');
            } else {
              expect(errorType).toBe('unknown');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('null status code indicates network offline', () => {
      const errorType = getErrorTypeFromStatusCode(null);
      expect(errorType).toBe('network_offline');
    });
  });

  /**
   * Property 42: Empty Filter Results Handling
   * For any Country_Hub filter combination that returns no results,
   * an empty state with filter suggestions SHALL be displayed.
   * **Validates: Requirements 17.2**
   */
  describe('Property 42: Empty Filter Results Handling', () => {
    it('filter suggestions are shown when no results and filters applied', () => {
      fc.assert(
        fc.property(
          fc.array(filterNamesArb, { minLength: 1, maxLength: 4 }),
          (appliedFilters) => {
            const state: FilterResultState = {
              hasResults: false,
              totalResults: 0,
              appliedFilters,
            };
            
            const shouldShow = shouldShowFilterSuggestions(state);
            expect(shouldShow).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filter suggestions are not shown when results exist', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          appliedFiltersArb,
          (totalResults, appliedFilters) => {
            const state: FilterResultState = {
              hasResults: true,
              totalResults,
              appliedFilters,
            };
            
            const shouldShow = shouldShowFilterSuggestions(state);
            expect(shouldShow).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filter suggestions are not shown when no filters applied', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.integer({ min: 0, max: 1000 }),
          (hasResults, totalResults) => {
            const state: FilterResultState = {
              hasResults,
              totalResults,
              appliedFilters: [],
            };
            
            const shouldShow = shouldShowFilterSuggestions(state);
            expect(shouldShow).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generated suggestions are non-empty when filters are applied', () => {
      fc.assert(
        fc.property(
          fc.array(filterNamesArb, { minLength: 1, maxLength: 4 }),
          (appliedFilters) => {
            const suggestions = generateFilterSuggestions(appliedFilters);
            expect(suggestions.length).toBeGreaterThan(0);
            
            // All suggestions should be non-empty strings
            suggestions.forEach(suggestion => {
              expect(typeof suggestion).toBe('string');
              expect(suggestion.length).toBeGreaterThan(0);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('no suggestions generated when no filters applied', () => {
      const suggestions = generateFilterSuggestions([]);
      expect(suggestions.length).toBe(0);
    });

    it('multiple filters suggest removing some filters', () => {
      fc.assert(
        fc.property(
          fc.array(filterNamesArb, { minLength: 2, maxLength: 4 }),
          (appliedFilters) => {
            const suggestions = generateFilterSuggestions(appliedFilters);
            const hasRemoveSuggestion = suggestions.some(s => 
              s.toLowerCase().includes('removing')
            );
            expect(hasRemoveSuggestion).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Config Validation', () => {
    it('all error types have valid configurations', () => {
      fc.assert(
        fc.property(
          errorTypeArb,
          (errorType) => {
            const config = getErrorConfig(errorType);
            expect(validateErrorConfig(config)).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('error configs have appropriate retry settings', () => {
      // Network errors should be retryable
      expect(getErrorConfig('network_offline').canRetry).toBe(true);
      expect(getErrorConfig('server_error').canRetry).toBe(true);
      expect(getErrorConfig('timeout').canRetry).toBe(true);
      
      // Not found should not be retryable
      expect(getErrorConfig('not_found').canRetry).toBe(false);
    });
  });
});
