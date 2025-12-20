/**
 * Property-based tests for Watchlist Display
 * Feature: moviestream-mvp
 * 
 * Property 17: Watchlist Grid Display
 * For any non-empty watchlist, all WatchlistItems SHALL be rendered in the grid layout
 * on the Watchlist screen.
 * 
 * **Validates: Requirements 7.4**
 */

import * as fc from 'fast-check';
import type { WatchlistItem, WatchlistSyncStatus } from '@/types/watchlist';
import {
  calculateGridConfig,
  sortByDateAdded,
  sortByTitle,
  filterByMediaType,
  getSyncStatusSummary,
  isFullySynced,
  hasSyncErrors,
  getItemsWithErrors,
  generateItemKey,
  isItemInWatchlist,
  getWatchlistItem,
  formatItemCount,
  getItemAccessibilityLabel,
  isValidWatchlistItem,
  getValidItems,
} from '@/components/watchlist/watchlist-utils';

// Arbitraries for generating test data
const mediaTypeArb = fc.constantFrom('movie' as const, 'tv' as const);
const syncStatusArb = fc.constantFrom('synced' as const, 'pending' as const, 'error' as const);

// Generate ISO date strings directly to avoid date parsing issues
const isoDateArb = fc.integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31
  .map(timestamp => new Date(timestamp).toISOString());

const watchlistItemArb: fc.Arbitrary<WatchlistItem> = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  mediaType: mediaTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  addedAt: isoDateArb,
  syncStatus: syncStatusArb,
});

const watchlistArrayArb = fc.array(watchlistItemArb, { minLength: 0, maxLength: 50 });
const nonEmptyWatchlistArb = fc.array(watchlistItemArb, { minLength: 1, maxLength: 50 });

describe('Feature: moviestream-mvp, Property 17: Watchlist Grid Display', () => {
  /**
   * Property 17: Watchlist Grid Display
   * For any non-empty watchlist, all WatchlistItems SHALL be rendered in the grid layout
   * on the Watchlist screen.
   * 
   * **Validates: Requirements 7.4**
   */
  describe('All watchlist items are displayable in grid', () => {
    it('for any non-empty watchlist, all items should have valid keys for grid rendering', () => {
      fc.assert(
        fc.property(
          nonEmptyWatchlistArb,
          (items) => {
            // All items should generate unique keys
            const keys = items.map(generateItemKey);
            const uniqueKeys = new Set(keys);
            
            // Keys should be non-empty strings
            for (const key of keys) {
              expect(typeof key).toBe('string');
              expect(key.length).toBeGreaterThan(0);
            }
            
            // If items have unique id+mediaType combinations, keys should be unique
            const uniqueItems = new Map<string, WatchlistItem>();
            for (const item of items) {
              const key = generateItemKey(item);
              uniqueItems.set(key, item);
            }
            
            expect(uniqueKeys.size).toBe(uniqueItems.size);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any watchlist, valid items should pass validation', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          (items) => {
            for (const item of items) {
              // All generated items should be valid
              expect(isValidWatchlistItem(item)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any non-empty watchlist, getValidItems should return all valid items', () => {
      fc.assert(
        fc.property(
          nonEmptyWatchlistArb,
          (items) => {
            const validItems = getValidItems(items);
            
            // All items from our generator should be valid
            expect(validItems.length).toBe(items.length);
            
            // Each valid item should be in the original array
            for (const validItem of validItems) {
              expect(items).toContainEqual(validItem);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Grid configuration calculations', () => {
    it('for any screen width, grid config should produce valid dimensions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1200 }), // Screen width
          fc.integer({ min: 8, max: 32 }), // Padding
          fc.integer({ min: 2, max: 5 }), // Columns
          fc.integer({ min: 4, max: 16 }), // Spacing
          (screenWidth, padding, columns, spacing) => {
            const config = calculateGridConfig(screenWidth, padding, columns, spacing);
            
            // Card width should be positive
            expect(config.cardWidth).toBeGreaterThan(0);
            
            // Card height should be positive (1.5x width for poster ratio)
            expect(config.cardHeight).toBeGreaterThan(0);
            expect(config.cardHeight).toBe(Math.floor(config.cardWidth * 1.5));
            
            // Number of columns should match input
            expect(config.numColumns).toBe(columns);
            
            // Spacing should match input
            expect(config.spacing).toBe(spacing);
            
            // Total width of cards + spacing should not exceed available width
            const totalCardsWidth = config.cardWidth * columns;
            const totalSpacing = spacing * (columns - 1);
            const availableWidth = screenWidth - (padding * 2);
            expect(totalCardsWidth + totalSpacing).toBeLessThanOrEqual(availableWidth);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Sorting preserves all items', () => {
    it('for any watchlist, sorting by date should preserve all items', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          (items) => {
            const sorted = sortByDateAdded(items);
            
            // Same length
            expect(sorted.length).toBe(items.length);
            
            // All original items should be in sorted array
            for (const item of items) {
              expect(sorted).toContainEqual(item);
            }
            
            // Should be sorted by date (most recent first)
            for (let i = 1; i < sorted.length; i++) {
              const prevDate = new Date(sorted[i - 1].addedAt).getTime();
              const currDate = new Date(sorted[i].addedAt).getTime();
              expect(prevDate).toBeGreaterThanOrEqual(currDate);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any watchlist, sorting by title should preserve all items', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          (items) => {
            const sorted = sortByTitle(items);
            
            // Same length
            expect(sorted.length).toBe(items.length);
            
            // All original items should be in sorted array
            for (const item of items) {
              expect(sorted).toContainEqual(item);
            }
            
            // Should be sorted alphabetically
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i - 1].title.localeCompare(sorted[i].title)).toBeLessThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Filtering by media type', () => {
    it('for any watchlist and media type filter, filtered items should match the filter', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          fc.constantFrom('movie' as const, 'tv' as const, 'all' as const),
          (items, filterType) => {
            const filtered = filterByMediaType(items, filterType);
            
            if (filterType === 'all') {
              // All filter should return all items
              expect(filtered.length).toBe(items.length);
            } else {
              // Filtered items should all match the filter type
              for (const item of filtered) {
                expect(item.mediaType).toBe(filterType);
              }
              
              // Count should match expected
              const expectedCount = items.filter(i => i.mediaType === filterType).length;
              expect(filtered.length).toBe(expectedCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Sync status tracking', () => {
    it('for any watchlist, sync status summary should be accurate', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          (items) => {
            const summary = getSyncStatusSummary(items);
            
            // Total should match items length
            expect(summary.total).toBe(items.length);
            
            // Sum of statuses should equal total
            expect(summary.synced + summary.pending + summary.error).toBe(summary.total);
            
            // Each count should match actual count
            expect(summary.synced).toBe(items.filter(i => i.syncStatus === 'synced').length);
            expect(summary.pending).toBe(items.filter(i => i.syncStatus === 'pending').length);
            expect(summary.error).toBe(items.filter(i => i.syncStatus === 'error').length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any watchlist, isFullySynced should be true iff all items are synced', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          (items) => {
            const fullySync = isFullySynced(items);
            const allSynced = items.every(i => i.syncStatus === 'synced');
            
            expect(fullySync).toBe(allSynced);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any watchlist, hasSyncErrors should be true iff any item has error status', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          (items) => {
            const hasErrors = hasSyncErrors(items);
            const anyError = items.some(i => i.syncStatus === 'error');
            
            expect(hasErrors).toBe(anyError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any watchlist, getItemsWithErrors should return only error items', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          (items) => {
            const errorItems = getItemsWithErrors(items);
            
            // All returned items should have error status
            for (const item of errorItems) {
              expect(item.syncStatus).toBe('error');
            }
            
            // Count should match
            const expectedCount = items.filter(i => i.syncStatus === 'error').length;
            expect(errorItems.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Item lookup functions', () => {
    it('for any watchlist and query, isItemInWatchlist should correctly identify membership', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          watchlistItemArb,
          (items, queryItem) => {
            const result = isItemInWatchlist(items, queryItem.id, queryItem.mediaType);
            const expected = items.some(
              i => i.id === queryItem.id && i.mediaType === queryItem.mediaType
            );
            
            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any watchlist and query, getWatchlistItem should return correct item or undefined', () => {
      fc.assert(
        fc.property(
          watchlistArrayArb,
          watchlistItemArb,
          (items, queryItem) => {
            const result = getWatchlistItem(items, queryItem.id, queryItem.mediaType);
            const expected = items.find(
              i => i.id === queryItem.id && i.mediaType === queryItem.mediaType
            );
            
            expect(result).toEqual(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Display formatting', () => {
    it('for any count, formatItemCount should return correct pluralization', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (count) => {
            const formatted = formatItemCount(count);
            
            if (count === 1) {
              expect(formatted).toBe('1 title');
            } else {
              expect(formatted).toBe(`${count} titles`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any watchlist item, accessibility label should contain required information', () => {
      fc.assert(
        fc.property(
          watchlistItemArb,
          (item) => {
            const label = getItemAccessibilityLabel(item);
            
            // Should contain title
            expect(label).toContain(item.title);
            
            // Should contain media type info
            if (item.mediaType === 'movie') {
              expect(label).toContain('Movie');
            } else {
              expect(label).toContain('TV Series');
            }
            
            // Should contain sync status info
            if (item.syncStatus === 'synced') {
              expect(label).toContain('Synced');
            } else if (item.syncStatus === 'pending') {
              expect(label).toContain('Syncing');
            } else {
              expect(label).toContain('Sync error');
            }
            
            // Should contain removal instruction
            expect(label.toLowerCase()).toContain('remove');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Key generation uniqueness', () => {
    it('for any two different items (by id or mediaType), keys should be different', () => {
      fc.assert(
        fc.property(
          watchlistItemArb,
          watchlistItemArb,
          (item1, item2) => {
            const key1 = generateItemKey(item1);
            const key2 = generateItemKey(item2);
            
            // If items have same id and mediaType, keys should be same
            if (item1.id === item2.id && item1.mediaType === item2.mediaType) {
              expect(key1).toBe(key2);
            } else {
              // Otherwise keys should be different
              expect(key1).not.toBe(key2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
