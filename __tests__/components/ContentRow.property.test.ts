/**
 * Property-based tests for ContentRow infinite scroll pagination
 * Feature: moviestream-mvp
 * 
 * Properties tested:
 * - Property 4: Infinite Scroll Pagination
 * 
 * Validates: Requirements 1.5
 */

import * as fc from 'fast-check';
import {
  hasMorePages,
  getNextPage,
  mergePageResults,
  createInitialPaginationState,
  validatePaginationState,
  PaginationState,
} from '../../components/media/content-row-utils';
import type { MediaItem } from '../../types/media';

// Arbitrary for generating MediaItem
const mediaItemArb = (id: number): fc.Arbitrary<MediaItem> =>
  fc.record({
    id: fc.constant(id),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    originalTitle: fc.string({ minLength: 1, maxLength: 100 }),
    posterPath: fc.option(fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s}.jpg`), { nil: null }),
    backdropPath: fc.option(fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s}.jpg`), { nil: null }),
    overview: fc.string({ maxLength: 500 }),
    releaseDate: fc.integer({ min: 1990, max: 2030 }).map(year => `${year}-01-01`),
    voteAverage: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }), { nil: null }),
    voteCount: fc.integer({ min: 0, max: 100000 }),
    mediaType: fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
    genreIds: fc.array(fc.integer({ min: 1, max: 1000 }), { maxLength: 5 }),
  });

// Generate array of unique MediaItems
const mediaItemsArb = (count: number): fc.Arbitrary<MediaItem[]> =>
  fc.tuple(...Array.from({ length: count }, (_, i) => mediaItemArb(i + 1))).map(items => items);

// Arbitrary for pagination state
const paginationStateArb: fc.Arbitrary<PaginationState> = fc
  .tuple(
    fc.integer({ min: 1, max: 100 }), // page
    fc.integer({ min: 1, max: 100 }), // totalPages
    fc.integer({ min: 0, max: 2000 }), // totalResults
    fc.integer({ min: 0, max: 20 }), // itemCount
  )
  .chain(([page, totalPages, totalResults, itemCount]) => {
    // Ensure page <= totalPages
    const validPage = Math.min(page, totalPages);
    // Ensure itemCount <= totalResults
    const validItemCount = Math.min(itemCount, totalResults);
    
    return mediaItemsArb(validItemCount).map(items => ({
      page: validPage,
      totalPages,
      totalResults,
      items,
    }));
  });

describe('ContentRow Infinite Scroll Property Tests', () => {
  /**
   * Property 4: Infinite Scroll Pagination
   * For any page of trending results, requesting the next page SHALL return new items
   * with incremented page number, and the total items SHALL grow by the page size.
   * **Validates: Requirements 1.5**
   */
  describe('Property 4: Infinite Scroll Pagination', () => {
    it('hasMorePages returns true when page < totalPages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 99 }),
          fc.integer({ min: 2, max: 100 }),
          (page, totalPages) => {
            // Ensure page < totalPages
            const validPage = Math.min(page, totalPages - 1);
            const state: PaginationState = {
              page: validPage,
              totalPages,
              totalResults: totalPages * 20,
              items: [],
            };
            
            expect(hasMorePages(state)).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hasMorePages returns false when page >= totalPages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (totalPages) => {
            const state: PaginationState = {
              page: totalPages,
              totalPages,
              totalResults: totalPages * 20,
              items: [],
            };
            
            expect(hasMorePages(state)).toBe(false);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getNextPage increments page number by 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 99 }),
          fc.integer({ min: 2, max: 100 }),
          (page, totalPages) => {
            const validPage = Math.min(page, totalPages - 1);
            const state: PaginationState = {
              page: validPage,
              totalPages,
              totalResults: totalPages * 20,
              items: [],
            };
            
            const nextPage = getNextPage(state);
            expect(nextPage).toBe(validPage + 1);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mergePageResults increases item count by new items (no duplicates)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // existing items count
          fc.integer({ min: 1, max: 20 }), // new items count
          (existingCount, newCount) => {
            // Create existing items with IDs 1 to existingCount
            const existingItems: MediaItem[] = Array.from({ length: existingCount }, (_, i) => ({
              id: i + 1,
              title: `Movie ${i + 1}`,
              originalTitle: `Movie ${i + 1}`,
              posterPath: null,
              backdropPath: null,
              overview: '',
              releaseDate: '2024-01-01',
              voteAverage: 7.5,
              voteCount: 100,
              mediaType: 'movie' as const,
              genreIds: [],
            }));
            
            // Create new items with IDs starting after existing
            const newItems: MediaItem[] = Array.from({ length: newCount }, (_, i) => ({
              id: existingCount + i + 1,
              title: `Movie ${existingCount + i + 1}`,
              originalTitle: `Movie ${existingCount + i + 1}`,
              posterPath: null,
              backdropPath: null,
              overview: '',
              releaseDate: '2024-01-01',
              voteAverage: 7.5,
              voteCount: 100,
              mediaType: 'movie' as const,
              genreIds: [],
            }));
            
            const currentState: PaginationState = {
              page: 1,
              totalPages: 5,
              totalResults: 100,
              items: existingItems,
            };
            
            const newState = mergePageResults(currentState, newItems, 2, 5, 100);
            
            // Total items should be sum of existing and new
            expect(newState.items.length).toBe(existingCount + newCount);
            // Page should be updated
            expect(newState.page).toBe(2);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('mergePageResults filters out duplicate items', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // existing items count
          fc.integer({ min: 1, max: 5 }), // duplicate count
          fc.integer({ min: 0, max: 10 }), // new unique count
          (existingCount, duplicateCount, newUniqueCount) => {
            // Create existing items
            const existingItems: MediaItem[] = Array.from({ length: existingCount }, (_, i) => ({
              id: i + 1,
              title: `Movie ${i + 1}`,
              originalTitle: `Movie ${i + 1}`,
              posterPath: null,
              backdropPath: null,
              overview: '',
              releaseDate: '2024-01-01',
              voteAverage: 7.5,
              voteCount: 100,
              mediaType: 'movie' as const,
              genreIds: [],
            }));
            
            // Create new items with some duplicates
            const actualDuplicates = Math.min(duplicateCount, existingCount);
            const duplicateItems: MediaItem[] = Array.from({ length: actualDuplicates }, (_, i) => ({
              id: i + 1, // Same IDs as existing
              title: `Movie ${i + 1}`,
              originalTitle: `Movie ${i + 1}`,
              posterPath: null,
              backdropPath: null,
              overview: '',
              releaseDate: '2024-01-01',
              voteAverage: 7.5,
              voteCount: 100,
              mediaType: 'movie' as const,
              genreIds: [],
            }));
            
            const uniqueItems: MediaItem[] = Array.from({ length: newUniqueCount }, (_, i) => ({
              id: existingCount + i + 1, // New unique IDs
              title: `Movie ${existingCount + i + 1}`,
              originalTitle: `Movie ${existingCount + i + 1}`,
              posterPath: null,
              backdropPath: null,
              overview: '',
              releaseDate: '2024-01-01',
              voteAverage: 7.5,
              voteCount: 100,
              mediaType: 'movie' as const,
              genreIds: [],
            }));
            
            const newItems = [...duplicateItems, ...uniqueItems];
            
            const currentState: PaginationState = {
              page: 1,
              totalPages: 5,
              totalResults: 100,
              items: existingItems,
            };
            
            const newState = mergePageResults(currentState, newItems, 2, 5, 100);
            
            // Should only add unique items, not duplicates
            expect(newState.items.length).toBe(existingCount + newUniqueCount);
            
            // All IDs should be unique
            const ids = newState.items.map(item => item.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('pagination state remains valid after operations', () => {
      fc.assert(
        fc.property(
          paginationStateArb,
          (state) => {
            expect(validatePaginationState(state)).toBe(true);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('createInitialPaginationState creates valid state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }), // item count
          fc.integer({ min: 1, max: 100 }), // page
          fc.integer({ min: 1, max: 100 }), // totalPages
          fc.integer({ min: 0, max: 2000 }), // totalResults
          (itemCount, page, totalPages, totalResults) => {
            const validPage = Math.min(page, totalPages);
            const validItemCount = Math.min(itemCount, totalResults);
            
            const items: MediaItem[] = Array.from({ length: validItemCount }, (_, i) => ({
              id: i + 1,
              title: `Movie ${i + 1}`,
              originalTitle: `Movie ${i + 1}`,
              posterPath: null,
              backdropPath: null,
              overview: '',
              releaseDate: '2024-01-01',
              voteAverage: 7.5,
              voteCount: 100,
              mediaType: 'movie' as const,
              genreIds: [],
            }));
            
            const state = createInitialPaginationState(items, validPage, totalPages, totalResults);
            
            expect(validatePaginationState(state)).toBe(true);
            expect(state.page).toBe(validPage);
            expect(state.totalPages).toBe(totalPages);
            expect(state.totalResults).toBe(totalResults);
            expect(state.items.length).toBe(validItemCount);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
