/**
 * Property-based tests for Country Hub
 * Feature: moviestream-mvp
 * 
 * Properties tested:
 * - Property 5: Country Hub Content Filtering
 * - Property 6: Country Hub Rank Badges
 * - Property 7: Country Hub Header Display
 * 
 * Validates: Requirements 3.3, 3.4, 3.5, 3.6
 */

import * as fc from 'fast-check';
import {
  filterByContentType,
  filterByGenre,
  filterByYear,
  applyFilters,
  shouldShowRankBadge,
  assignRanks,
  mergeAndRankContent,
  getCountryByCode,
  getCountryHeaderDisplay,
  validateFilteredContent,
  validateRankBadges,
  type ContentTypeFilter,
  type CountryHubFilters,
} from '../../components/country/country-hub-utils';
import { SUPPORTED_COUNTRIES, type TrendingItem } from '../../types/media';

// Arbitraries for generating test data
const contentTypeArb = fc.constantFrom<ContentTypeFilter>('all', 'movie', 'tv');

const mediaTypeArb = fc.constantFrom<'movie' | 'tv'>('movie', 'tv');

const genreIdArb = fc.constantFrom(28, 35, 18, 27, 10749, 878, 53, 16, 99);

const yearArb = fc.integer({ min: 2015, max: 2025 });

const countryCodeArb = fc.constantFrom(...SUPPORTED_COUNTRIES.map(c => c.code));

// Generate a valid date string in YYYY-MM-DD format
const releaseDateArb = fc.tuple(
  fc.integer({ min: 2015, max: 2025 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 })
).map(([year, month, day]) => 
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

const trendingItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  originalTitle: fc.string({ minLength: 1, maxLength: 200 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}.jpg`), { nil: null }),
  backdropPath: fc.option(fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}.jpg`), { nil: null }),
  overview: fc.string({ minLength: 0, maxLength: 500 }),
  releaseDate: releaseDateArb,
  voteAverage: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }), { nil: null }),
  voteCount: fc.integer({ min: 0, max: 100000 }),
  mediaType: mediaTypeArb,
  genreIds: fc.array(genreIdArb, { minLength: 1, maxLength: 5 }),
  rank: fc.integer({ min: 1, max: 100 }),
});

const trendingItemsArb = fc.array(trendingItemArb, { minLength: 1, maxLength: 30 });

const filtersArb = fc.record({
  contentType: contentTypeArb,
  genre: fc.option(genreIdArb, { nil: null }),
  year: fc.option(yearArb, { nil: null }),
});

describe('Country Hub Property Tests', () => {
  /**
   * Property 5: Country Hub Content Filtering
   * For any Country_Hub and any combination of Content_Type, genre, and year filters,
   * all displayed items SHALL match all active filter criteria.
   * **Validates: Requirements 3.4, 3.5**
   */
  describe('Property 5: Country Hub Content Filtering', () => {
    it('for any items and filters, all filtered items match all active filter criteria', () => {
      fc.assert(
        fc.property(
          trendingItemsArb,
          filtersArb,
          (items, filters) => {
            const filtered = applyFilters(items, filters);
            
            // Validate that all filtered items match all filter criteria
            const isValid = validateFilteredContent(filtered, filters);
            expect(isValid).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('content type filter correctly filters by media type', () => {
      fc.assert(
        fc.property(
          trendingItemsArb,
          contentTypeArb,
          (items, contentType) => {
            const filtered = filterByContentType(items, contentType);
            
            if (contentType === 'all') {
              // All items should be returned
              expect(filtered.length).toBe(items.length);
            } else {
              // Only items matching the content type should be returned
              filtered.forEach(item => {
                expect(item.mediaType).toBe(contentType);
              });
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('genre filter correctly filters by genre ID', () => {
      fc.assert(
        fc.property(
          trendingItemsArb,
          fc.option(genreIdArb, { nil: null }),
          (items, genreId) => {
            const filtered = filterByGenre(items, genreId);
            
            if (genreId === null) {
              // All items should be returned
              expect(filtered.length).toBe(items.length);
            } else {
              // Only items containing the genre should be returned
              filtered.forEach(item => {
                expect(item.genreIds).toContain(genreId);
              });
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('year filter correctly filters by release year', () => {
      fc.assert(
        fc.property(
          trendingItemsArb,
          fc.option(yearArb, { nil: null }),
          (items, year) => {
            const filtered = filterByYear(items, year);
            
            if (year === null) {
              // All items should be returned
              expect(filtered.length).toBe(items.length);
            } else {
              // Only items from the specified year should be returned
              filtered.forEach(item => {
                const itemYear = new Date(item.releaseDate).getFullYear();
                expect(itemYear).toBe(year);
              });
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('combined filters are applied conjunctively (AND logic)', () => {
      fc.assert(
        fc.property(
          trendingItemsArb,
          filtersArb,
          (items, filters) => {
            const filtered = applyFilters(items, filters);
            
            // Each filtered item must satisfy ALL active filters
            filtered.forEach(item => {
              // Content type check
              if (filters.contentType !== 'all') {
                expect(item.mediaType).toBe(filters.contentType);
              }
              
              // Genre check
              if (filters.genre !== null) {
                expect(item.genreIds).toContain(filters.genre);
              }
              
              // Year check
              if (filters.year !== null) {
                const itemYear = new Date(item.releaseDate).getFullYear();
                expect(itemYear).toBe(filters.year);
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtering never adds items not in original list', () => {
      fc.assert(
        fc.property(
          trendingItemsArb,
          filtersArb,
          (items, filters) => {
            const filtered = applyFilters(items, filters);
            const originalIds = new Set(items.map(i => i.id));
            
            // All filtered items must be from the original list
            filtered.forEach(item => {
              expect(originalIds.has(item.id)).toBe(true);
            });
            
            // Filtered list cannot be longer than original
            expect(filtered.length).toBeLessThanOrEqual(items.length);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Country Hub Rank Badges
   * For any Country_Hub content list, items with rank values 1-10 SHALL display rank badges,
   * and items with rank > 10 SHALL not display badges.
   * **Validates: Requirements 3.3**
   */
  describe('Property 6: Country Hub Rank Badges', () => {
    it('for any rank 1-10, rank badge should be displayed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (rank) => {
            expect(shouldShowRankBadge(rank)).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any rank > 10, rank badge should not be displayed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 11, max: 1000 }),
          (rank) => {
            expect(shouldShowRankBadge(rank)).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any rank <= 0, rank badge should not be displayed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 0 }),
          (rank) => {
            expect(shouldShowRankBadge(rank)).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any list of items, rank badges are correctly assigned', () => {
      fc.assert(
        fc.property(
          trendingItemsArb,
          (items) => {
            const rankedItems = assignRanks(items);
            const validation = validateRankBadges(rankedItems);
            
            expect(validation.isValid).toBe(true);
            
            // Items with rank 1-10 should have badges
            validation.itemsWithBadges.forEach(item => {
              expect(item.rank).toBeGreaterThanOrEqual(1);
              expect(item.rank).toBeLessThanOrEqual(10);
            });
            
            // Items with rank > 10 should not have badges
            validation.itemsWithoutBadges.forEach(item => {
              expect(item.rank).toBeGreaterThan(10);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('assignRanks produces sequential ranks starting from 1', () => {
      fc.assert(
        fc.property(
          trendingItemsArb,
          (items) => {
            const rankedItems = assignRanks(items);
            
            // Ranks should be sequential starting from 1
            rankedItems.forEach((item, index) => {
              expect(item.rank).toBe(index + 1);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mergeAndRankContent produces correct sequential ranks', () => {
      fc.assert(
        fc.property(
          fc.array(trendingItemArb.map(i => ({ ...i, mediaType: 'movie' as const })), { minLength: 0, maxLength: 15 }),
          fc.array(trendingItemArb.map(i => ({ ...i, mediaType: 'tv' as const })), { minLength: 0, maxLength: 15 }),
          (movies, tvShows) => {
            const merged = mergeAndRankContent(movies, tvShows);
            
            // Total items should be sum of both arrays
            expect(merged.length).toBe(movies.length + tvShows.length);
            
            // Ranks should be sequential starting from 1
            merged.forEach((item, index) => {
              expect(item.rank).toBe(index + 1);
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Country Hub Header Display
   * For any country code in SUPPORTED_COUNTRIES, the Country_Hub header SHALL display
   * the corresponding flag emoji and country name.
   * **Validates: Requirements 3.6**
   */
  describe('Property 7: Country Hub Header Display', () => {
    it('for any supported country code, header displays correct flag and name', () => {
      fc.assert(
        fc.property(
          countryCodeArb,
          (code) => {
            const country = getCountryByCode(code);
            
            // Country should be found
            expect(country).toBeDefined();
            
            if (country) {
              const headerDisplay = getCountryHeaderDisplay(country);
              
              // Flag should be present and non-empty
              expect(headerDisplay.flag).toBeDefined();
              expect(headerDisplay.flag.length).toBeGreaterThan(0);
              
              // Name should be present and non-empty
              expect(headerDisplay.name).toBeDefined();
              expect(headerDisplay.name.length).toBeGreaterThan(0);
              
              // Flag should match the country's flag
              expect(headerDisplay.flag).toBe(country.flag);
              
              // Name should match the country's name
              expect(headerDisplay.name).toBe(country.name);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all supported countries have valid flag emojis', () => {
      SUPPORTED_COUNTRIES.forEach(country => {
        const headerDisplay = getCountryHeaderDisplay(country);
        
        // Flag should be a non-empty string (emoji)
        expect(typeof headerDisplay.flag).toBe('string');
        expect(headerDisplay.flag.length).toBeGreaterThan(0);
        
        // Name should be a non-empty string
        expect(typeof headerDisplay.name).toBe('string');
        expect(headerDisplay.name.length).toBeGreaterThan(0);
      });
    });

    it('all 7 supported countries are accessible', () => {
      const expectedCountries = ['US', 'JP', 'IN', 'CN', 'RU', 'ES', 'DE'];
      
      expectedCountries.forEach(code => {
        const country = getCountryByCode(code);
        expect(country).toBeDefined();
        expect(country?.code).toBe(code);
      });
      
      expect(SUPPORTED_COUNTRIES.length).toBe(7);
    });

    it('unsupported country codes return undefined', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 2 }).filter(
            code => !SUPPORTED_COUNTRIES.some(c => c.code === code)
          ),
          (code) => {
            const country = getCountryByCode(code);
            expect(country).toBeUndefined();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
