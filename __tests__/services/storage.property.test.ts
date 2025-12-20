/**
 * Property-based tests for AsyncStorage service
 * Feature: moviestream-mvp
 * 
 * Property 16: Watchlist Toggle (persistence aspect)
 * Property 34: Recently Viewed Persistence
 * 
 * Validates: Requirements 7.3, 14.3
 */

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWatchlist,
  saveWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  toggleWatchlist,
  getRecentlyViewed,
  saveRecentlyViewed,
  addToRecentlyViewed,
  clearRecentlyViewed,
  STORAGE_KEYS,
  MAX_RECENTLY_VIEWED,
} from '@/services/storage';
import type { WatchlistItem } from '@/types/watchlist';
import type { RecentlyViewedItem } from '@/types/user';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Arbitraries for generating test data
const mediaTypeArb = fc.constantFrom('movie' as const, 'tv' as const);

// Use integer timestamps to avoid invalid date issues
const isoDateStringArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(ts => new Date(ts).toISOString());

const watchlistItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  mediaType: mediaTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  addedAt: isoDateStringArb,
  syncStatus: fc.constantFrom('synced' as const, 'pending' as const, 'error' as const),
});

const recentlyViewedItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  mediaType: mediaTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  viewedAt: isoDateStringArb,
});

describe('Feature: moviestream-mvp, Property 16: Watchlist Toggle (persistence)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 16: Watchlist Toggle
   * For any title on a Detail_Page, tapping the watchlist button SHALL toggle 
   * the isInWatchlist state and persist the change to AsyncStorage.
   * 
   * **Validates: Requirements 7.2, 7.3**
   */
  describe('Watchlist Persistence Round-Trip', () => {
    it('should persist and retrieve watchlist items correctly (round-trip)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(watchlistItemArb, { minLength: 0, maxLength: 20 }),
          async (items) => {
            // Setup mock to store and retrieve
            let storedValue: string | null = null;
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Save watchlist
            await saveWatchlist(items);

            // Retrieve watchlist
            const retrieved = await getWatchlist();

            // Round-trip should preserve all items
            expect(retrieved).toEqual(items);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should add items to watchlist and persist them', async () => {
      await fc.assert(
        fc.asyncProperty(
          watchlistItemArb,
          async (item) => {
            let storedValue: string | null = JSON.stringify([]);
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Add item
            const result = await addToWatchlist(item);

            // Item should be in result
            expect(result).toContainEqual(item);

            // Storage should have been called
            expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
              STORAGE_KEYS.WATCHLIST,
              expect.any(String)
            );

            // Verify persisted data
            const persisted = JSON.parse(storedValue!);
            expect(persisted).toContainEqual(item);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove items from watchlist and persist the change', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(watchlistItemArb, { minLength: 1, maxLength: 10 }),
          async (items) => {
            const itemToRemove = items[0];
            let storedValue: string | null = JSON.stringify(items);
            
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Remove item
            const result = await removeFromWatchlist(itemToRemove.id, itemToRemove.mediaType);

            // Item should not be in result
            expect(result.find(
              i => i.id === itemToRemove.id && i.mediaType === itemToRemove.mediaType
            )).toBeUndefined();

            // Verify persisted data
            const persisted = JSON.parse(storedValue!);
            expect(persisted.find(
              (i: WatchlistItem) => i.id === itemToRemove.id && i.mediaType === itemToRemove.mediaType
            )).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle watchlist state correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          watchlistItemArb,
          fc.boolean(),
          async (item, startInWatchlist) => {
            const initialList = startInWatchlist ? [item] : [];
            let storedValue: string | null = JSON.stringify(initialList);
            
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Toggle
            const { watchlist, added } = await toggleWatchlist(item);

            // If started in watchlist, should be removed (added = false)
            // If not in watchlist, should be added (added = true)
            expect(added).toBe(!startInWatchlist);

            // Verify the item presence matches the toggle result
            const itemInResult = watchlist.some(
              i => i.id === item.id && i.mediaType === item.mediaType
            );
            expect(itemInResult).toBe(added);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly report isInWatchlist status', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(watchlistItemArb, { minLength: 0, maxLength: 10 }),
          watchlistItemArb,
          async (existingItems, queryItem) => {
            const storedValue = JSON.stringify(existingItems);
            mockAsyncStorage.getItem.mockResolvedValue(storedValue);

            const result = await isInWatchlist(queryItem.id, queryItem.mediaType);

            const expectedInList = existingItems.some(
              i => i.id === queryItem.id && i.mediaType === queryItem.mediaType
            );
            expect(result).toBe(expectedInList);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Feature: moviestream-mvp, Property 34: Recently Viewed Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 34: Recently Viewed Persistence
   * For any title viewed by the user, the title SHALL be persisted to the 
   * Recently_Viewed list in AsyncStorage.
   * 
   * **Validates: Requirements 14.3**
   */
  describe('Recently Viewed Persistence Round-Trip', () => {
    it('should persist and retrieve recently viewed items correctly (round-trip)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedItemArb, { minLength: 0, maxLength: MAX_RECENTLY_VIEWED }),
          async (items) => {
            let storedValue: string | null = null;
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Save recently viewed
            await saveRecentlyViewed(items);

            // Retrieve recently viewed
            const retrieved = await getRecentlyViewed();

            // Round-trip should preserve all items
            expect(retrieved).toEqual(items);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should add items to recently viewed and persist them', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 1000000 }),
            mediaType: mediaTypeArb,
            title: fc.string({ minLength: 1, maxLength: 100 }),
            posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
          }),
          async (item) => {
            let storedValue: string | null = JSON.stringify([]);
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Add item
            const result = await addToRecentlyViewed(item);

            // Item should be in result with viewedAt timestamp
            const addedItem = result.find(
              i => i.id === item.id && i.mediaType === item.mediaType
            );
            expect(addedItem).toBeDefined();
            expect(addedItem?.title).toBe(item.title);
            expect(addedItem?.viewedAt).toBeDefined();

            // Storage should have been called
            expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
              STORAGE_KEYS.RECENTLY_VIEWED,
              expect.any(String)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain max limit of recently viewed items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedItemArb, { minLength: MAX_RECENTLY_VIEWED + 1, maxLength: 20 }),
          async (items) => {
            // Ensure unique items by id+mediaType
            const uniqueItems = items.reduce((acc, item) => {
              const key = `${item.id}-${item.mediaType}`;
              if (!acc.has(key)) {
                acc.set(key, item);
              }
              return acc;
            }, new Map<string, RecentlyViewedItem>());
            
            const itemsArray = Array.from(uniqueItems.values());
            if (itemsArray.length <= MAX_RECENTLY_VIEWED) {
              return; // Skip if not enough unique items
            }

            let storedValue: string | null = JSON.stringify([]);
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Add all items one by one
            let result: RecentlyViewedItem[] = [];
            for (const item of itemsArray) {
              result = await addToRecentlyViewed({
                id: item.id,
                mediaType: item.mediaType,
                title: item.title,
                posterPath: item.posterPath,
              });
            }

            // Should never exceed MAX_RECENTLY_VIEWED
            expect(result.length).toBeLessThanOrEqual(MAX_RECENTLY_VIEWED);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should place most recently viewed item first', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedItemArb, { minLength: 2, maxLength: 5 }),
          async (items) => {
            // Ensure unique items
            const uniqueItems = items.filter((item, index, self) =>
              index === self.findIndex(i => i.id === item.id && i.mediaType === item.mediaType)
            );
            
            if (uniqueItems.length < 2) return;

            let storedValue: string | null = JSON.stringify([]);
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Add items
            let result: RecentlyViewedItem[] = [];
            for (const item of uniqueItems) {
              result = await addToRecentlyViewed({
                id: item.id,
                mediaType: item.mediaType,
                title: item.title,
                posterPath: item.posterPath,
              });
            }

            // Last added item should be first in the list
            const lastAdded = uniqueItems[uniqueItems.length - 1];
            expect(result[0].id).toBe(lastAdded.id);
            expect(result[0].mediaType).toBe(lastAdded.mediaType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove duplicates when adding same item again', async () => {
      await fc.assert(
        fc.asyncProperty(
          recentlyViewedItemArb,
          async (item) => {
            let storedValue: string | null = JSON.stringify([]);
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Add same item twice
            await addToRecentlyViewed({
              id: item.id,
              mediaType: item.mediaType,
              title: item.title,
              posterPath: item.posterPath,
            });
            
            const result = await addToRecentlyViewed({
              id: item.id,
              mediaType: item.mediaType,
              title: item.title + ' updated',
              posterPath: item.posterPath,
            });

            // Should only have one entry for this item
            const matchingItems = result.filter(
              i => i.id === item.id && i.mediaType === item.mediaType
            );
            expect(matchingItems.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear recently viewed and persist empty list', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedItemArb, { minLength: 1, maxLength: 10 }),
          async (items) => {
            let storedValue: string | null = JSON.stringify(items);
            mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
              storedValue = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => storedValue);

            // Clear
            const result = await clearRecentlyViewed();

            // Should return empty array
            expect(result).toEqual([]);

            // Storage should have empty array
            const persisted = JSON.parse(storedValue!);
            expect(persisted).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
