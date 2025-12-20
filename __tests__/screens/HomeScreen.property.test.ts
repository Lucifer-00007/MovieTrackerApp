/**
 * Property-based tests for Home Screen Personalization Rows
 * Feature: moviestream-mvp
 * 
 * Property 35: Recently Viewed Row Visibility
 * For any Recently_Viewed list, the row SHALL be visible if and only if 
 * the list is non-empty.
 * 
 * Property 36: Recommendations Based on Watchlist
 * For any non-empty Watchlist, a "Recommended for You" row SHALL be displayed 
 * with titles matching watchlist genres.
 * 
 * **Validates: Requirements 14.2, 14.4**
 */

import * as fc from 'fast-check';
import type { MediaItem } from '@/types/media';
import type { WatchlistItem } from '@/types/watchlist';
import type { RecentlyViewedItem } from '@/types/user';

// ============================================================================
// Helper Functions for Testing Home Screen Logic
// ============================================================================

/**
 * Determines if the Recently Viewed row should be visible
 * Based on Property 35: Row is visible if and only if list is non-empty
 */
export function shouldShowRecentlyViewedRow(items: RecentlyViewedItem[]): boolean {
  return items.length > 0;
}

/**
 * Determines if the Recommendations row should be visible
 * Based on Property 36: Row is visible when watchlist is non-empty AND recommendations exist
 */
export function shouldShowRecommendationsRow(
  watchlistItems: WatchlistItem[],
  recommendations: MediaItem[]
): boolean {
  return watchlistItems.length > 0 && recommendations.length > 0;
}

/**
 * Filters recommendations to match watchlist genres
 * Returns recommendations that share at least one genre with watchlist items
 */
export function filterRecommendationsByWatchlistGenres(
  recommendations: MediaItem[],
  watchlistItems: WatchlistItem[]
): MediaItem[] {
  // Extract all genre IDs from watchlist items
  const watchlistGenreIds = new Set<number>();
  watchlistItems.forEach(item => {
    // In real implementation, we'd need to fetch genre IDs for watchlist items
    // For testing, we assume watchlist items have genreIds
    if ('genreIds' in item && Array.isArray((item as any).genreIds)) {
      (item as any).genreIds.forEach((id: number) => watchlistGenreIds.add(id));
    }
  });

  // If no genres in watchlist, return all recommendations
  if (watchlistGenreIds.size === 0) {
    return recommendations;
  }

  // Filter recommendations that share at least one genre
  return recommendations.filter(rec =>
    rec.genreIds.some(genreId => watchlistGenreIds.has(genreId))
  );
}

/**
 * Converts recently viewed items to MediaItem format for display
 */
export function recentlyViewedToMediaItems(
  items: RecentlyViewedItem[]
): MediaItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    originalTitle: item.title,
    posterPath: item.posterPath,
    backdropPath: null,
    overview: '',
    releaseDate: '',
    voteAverage: null,
    voteCount: 0,
    mediaType: item.mediaType,
    genreIds: [],
  }));
}

// ============================================================================
// Arbitraries for Test Data Generation
// ============================================================================

const mediaTypeArb = fc.constantFrom('movie' as const, 'tv' as const);

const recentlyViewedItemArb: fc.Arbitrary<RecentlyViewedItem> = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  mediaType: mediaTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  viewedAt: fc.integer({ 
    min: new Date('2020-01-01').getTime(), 
    max: new Date('2030-12-31').getTime() 
  }).map(ts => new Date(ts).toISOString()),
});

const watchlistItemArb: fc.Arbitrary<WatchlistItem> = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  mediaType: mediaTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  addedAt: fc.integer({ 
    min: new Date('2020-01-01').getTime(), 
    max: new Date('2030-12-31').getTime() 
  }).map(ts => new Date(ts).toISOString()),
  syncStatus: fc.constantFrom('synced' as const, 'pending' as const, 'error' as const),
});

const mediaItemArb: fc.Arbitrary<MediaItem> = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  originalTitle: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  backdropPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  overview: fc.string({ minLength: 0, maxLength: 500 }),
  releaseDate: fc.string({ minLength: 0, maxLength: 10 }),
  voteAverage: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: null }),
  voteCount: fc.integer({ min: 0, max: 100000 }),
  mediaType: mediaTypeArb,
  genreIds: fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 0, maxLength: 5 }),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: moviestream-mvp, Property 35: Recently Viewed Row Visibility', () => {
  /**
   * Property 35: Recently Viewed Row Visibility
   * For any Recently_Viewed list, the row SHALL be visible if and only if 
   * the list is non-empty.
   * 
   * **Validates: Requirements 14.4**
   */

  describe('Row visibility based on list content', () => {
    it('for any non-empty recently viewed list, row should be visible', () => {
      fc.assert(
        fc.property(
          fc.array(recentlyViewedItemArb, { minLength: 1, maxLength: 20 }),
          (items) => {
            const shouldShow = shouldShowRecentlyViewedRow(items);
            expect(shouldShow).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for empty recently viewed list, row should be hidden', () => {
      const shouldShow = shouldShowRecentlyViewedRow([]);
      expect(shouldShow).toBe(false);
    });

    it('visibility is determined solely by list emptiness', () => {
      fc.assert(
        fc.property(
          fc.array(recentlyViewedItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const shouldShow = shouldShowRecentlyViewedRow(items);
            const expectedVisibility = items.length > 0;
            expect(shouldShow).toBe(expectedVisibility);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('MediaItem conversion preserves data', () => {
    it('for any recently viewed items, conversion preserves id and mediaType', () => {
      fc.assert(
        fc.property(
          fc.array(recentlyViewedItemArb, { minLength: 1, maxLength: 10 }),
          (items) => {
            const mediaItems = recentlyViewedToMediaItems(items);
            
            expect(mediaItems.length).toBe(items.length);
            
            items.forEach((original, index) => {
              expect(mediaItems[index].id).toBe(original.id);
              expect(mediaItems[index].mediaType).toBe(original.mediaType);
              expect(mediaItems[index].title).toBe(original.title);
              expect(mediaItems[index].posterPath).toBe(original.posterPath);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Feature: moviestream-mvp, Property 36: Recommendations Based on Watchlist', () => {
  /**
   * Property 36: Recommendations Based on Watchlist
   * For any non-empty Watchlist, a "Recommended for You" row SHALL be displayed 
   * with titles matching watchlist genres.
   * 
   * **Validates: Requirements 14.2**
   */

  describe('Row visibility based on watchlist and recommendations', () => {
    it('for any non-empty watchlist with recommendations, row should be visible', () => {
      fc.assert(
        fc.property(
          fc.array(watchlistItemArb, { minLength: 1, maxLength: 10 }),
          fc.array(mediaItemArb, { minLength: 1, maxLength: 20 }),
          (watchlistItems, recommendations) => {
            const shouldShow = shouldShowRecommendationsRow(watchlistItems, recommendations);
            expect(shouldShow).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for empty watchlist, row should be hidden regardless of recommendations', () => {
      fc.assert(
        fc.property(
          fc.array(mediaItemArb, { minLength: 0, maxLength: 20 }),
          (recommendations) => {
            const shouldShow = shouldShowRecommendationsRow([], recommendations);
            expect(shouldShow).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for non-empty watchlist with no recommendations, row should be hidden', () => {
      fc.assert(
        fc.property(
          fc.array(watchlistItemArb, { minLength: 1, maxLength: 10 }),
          (watchlistItems) => {
            const shouldShow = shouldShowRecommendationsRow(watchlistItems, []);
            expect(shouldShow).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('visibility requires both non-empty watchlist AND non-empty recommendations', () => {
      fc.assert(
        fc.property(
          fc.array(watchlistItemArb, { minLength: 0, maxLength: 10 }),
          fc.array(mediaItemArb, { minLength: 0, maxLength: 20 }),
          (watchlistItems, recommendations) => {
            const shouldShow = shouldShowRecommendationsRow(watchlistItems, recommendations);
            const expectedVisibility = watchlistItems.length > 0 && recommendations.length > 0;
            expect(shouldShow).toBe(expectedVisibility);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Recommendations filtering by genre', () => {
    it('for any recommendations with matching genres, filtered results should be non-empty', () => {
      // Create watchlist items with specific genres
      const watchlistWithGenres = fc.array(
        fc.record({
          id: fc.integer({ min: 1, max: 1000000 }),
          mediaType: mediaTypeArb,
          title: fc.string({ minLength: 1, maxLength: 100 }),
          posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          addedAt: fc.integer({ 
            min: new Date('2020-01-01').getTime(), 
            max: new Date('2030-12-31').getTime() 
          }).map(ts => new Date(ts).toISOString()),
          syncStatus: fc.constantFrom('synced' as const, 'pending' as const, 'error' as const),
          genreIds: fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 3 }),
        }),
        { minLength: 1, maxLength: 5 }
      );

      fc.assert(
        fc.property(
          watchlistWithGenres,
          (watchlistItems) => {
            // Create recommendations that share at least one genre with watchlist
            const watchlistGenres = new Set<number>();
            watchlistItems.forEach(item => {
              item.genreIds.forEach(id => watchlistGenres.add(id));
            });

            // Create a recommendation with a matching genre
            const matchingGenreId = Array.from(watchlistGenres)[0];
            const matchingRecommendation: MediaItem = {
              id: 999999,
              title: 'Matching Recommendation',
              originalTitle: 'Matching Recommendation',
              posterPath: null,
              backdropPath: null,
              overview: '',
              releaseDate: '',
              voteAverage: 7.5,
              voteCount: 100,
              mediaType: 'movie',
              genreIds: [matchingGenreId],
            };

            const filtered = filterRecommendationsByWatchlistGenres(
              [matchingRecommendation],
              watchlistItems as any
            );

            expect(filtered.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for recommendations with no matching genres, filtered results may be empty', () => {
      // Create watchlist items with specific genres (1-10)
      const watchlistWithGenres = fc.array(
        fc.record({
          id: fc.integer({ min: 1, max: 1000000 }),
          mediaType: mediaTypeArb,
          title: fc.string({ minLength: 1, maxLength: 100 }),
          posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          addedAt: fc.integer({ 
            min: new Date('2020-01-01').getTime(), 
            max: new Date('2030-12-31').getTime() 
          }).map(ts => new Date(ts).toISOString()),
          syncStatus: fc.constantFrom('synced' as const, 'pending' as const, 'error' as const),
          genreIds: fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 3 }),
        }),
        { minLength: 1, maxLength: 5 }
      );

      fc.assert(
        fc.property(
          watchlistWithGenres,
          (watchlistItems) => {
            // Create a recommendation with non-matching genres (100-110)
            const nonMatchingRecommendation: MediaItem = {
              id: 999999,
              title: 'Non-Matching Recommendation',
              originalTitle: 'Non-Matching Recommendation',
              posterPath: null,
              backdropPath: null,
              overview: '',
              releaseDate: '',
              voteAverage: 7.5,
              voteCount: 100,
              mediaType: 'movie',
              genreIds: [100, 101, 102], // Genres that won't match 1-10
            };

            const filtered = filterRecommendationsByWatchlistGenres(
              [nonMatchingRecommendation],
              watchlistItems as any
            );

            // Should be empty since genres don't match
            expect(filtered.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtering preserves all matching recommendations', () => {
      fc.assert(
        fc.property(
          fc.array(mediaItemArb, { minLength: 1, maxLength: 20 }),
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 5 }),
          (recommendations, targetGenres) => {
            // Create watchlist items with target genres
            const watchlistItems = [{
              id: 1,
              mediaType: 'movie' as const,
              title: 'Test',
              posterPath: null,
              addedAt: new Date().toISOString(),
              syncStatus: 'synced' as const,
              genreIds: targetGenres,
            }];

            const filtered = filterRecommendationsByWatchlistGenres(
              recommendations,
              watchlistItems as any
            );

            // All filtered items should have at least one matching genre
            filtered.forEach(item => {
              const hasMatchingGenre = item.genreIds.some(id => targetGenres.includes(id));
              expect(hasMatchingGenre).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
