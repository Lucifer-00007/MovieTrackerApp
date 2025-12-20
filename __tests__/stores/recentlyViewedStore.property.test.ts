/**
 * Property-based tests for Recently Viewed Zustand Store
 * Feature: moviestream-mvp
 * 
 * Property 33: Recently Viewed Limit
 * For any Recently_Viewed list, at most 10 items SHALL be displayed, 
 * ordered by most recent first.
 * 
 * Property 35: Recently Viewed Row Visibility
 * For any Recently_Viewed list, the row SHALL be visible if and only if 
 * the list is non-empty.
 * 
 * **Validates: Requirements 14.1, 14.4**
 */

import * as fc from 'fast-check';
import { useRecentlyViewedStore, MAX_RECENTLY_VIEWED } from '@/stores/recentlyViewedStore';
import * as storage from '@/services/storage';
import type { RecentlyViewedItem } from '@/types/user';

// Mock the storage service
jest.mock('@/services/storage', () => ({
  getRecentlyViewed: jest.fn(),
  addToRecentlyViewed: jest.fn(),
  clearRecentlyViewed: jest.fn(),
  saveRecentlyViewed: jest.fn(),
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

// Arbitraries for generating test data
const mediaTypeArb = fc.constantFrom('movie' as const, 'tv' as const);

const recentlyViewedInputArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  mediaType: mediaTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
});

// Use integer timestamps to avoid invalid date issues
const isoDateStringArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(ts => new Date(ts).toISOString());

const recentlyViewedItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  mediaType: mediaTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  viewedAt: isoDateStringArb,
});

// Helper to reset store state between tests
const resetStore = () => {
  useRecentlyViewedStore.setState({
    items: [],
    isLoading: false,
    error: null,
  });
};

describe('Feature: moviestream-mvp, Property 33: Recently Viewed Limit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  /**
   * Property 33: Recently Viewed Limit
   * For any Recently_Viewed list, at most 10 items SHALL be displayed, 
   * ordered by most recent first.
   * 
   * **Validates: Requirements 14.1**
   */
  describe('Maximum items limit', () => {
    it('for any number of items added, getItems should return at most MAX_RECENTLY_VIEWED items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedInputArb, { minLength: 1, maxLength: 25 }),
          async (items) => {
            resetStore();

            // Make items unique by id+mediaType
            const uniqueItems = items.reduce((acc, item) => {
              const key = `${item.id}-${item.mediaType}`;
              if (!acc.has(key)) {
                acc.set(key, item);
              }
              return acc;
            }, new Map<string, typeof items[0]>());

            const itemsArray = Array.from(uniqueItems.values());

            // Mock storage to return items with timestamps
            mockStorage.addToRecentlyViewed.mockImplementation(async (item) => {
              const currentItems = useRecentlyViewedStore.getState().items;
              const newItem: RecentlyViewedItem = {
                ...item,
                viewedAt: new Date().toISOString(),
              };
              const filtered = currentItems.filter(
                i => !(i.id === item.id && i.mediaType === item.mediaType)
              );
              return [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
            });

            // Add all items
            for (const item of itemsArray) {
              await useRecentlyViewedStore.getState().addItem(item);
            }

            // Get items should return at most MAX_RECENTLY_VIEWED
            const result = useRecentlyViewedStore.getState().getItems();
            expect(result.length).toBeLessThanOrEqual(MAX_RECENTLY_VIEWED);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('items should be stored in state with at most MAX_RECENTLY_VIEWED items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedItemArb, { minLength: 0, maxLength: 30 }),
          async (items) => {
            resetStore();

            // Set items directly in state (simulating loaded state)
            useRecentlyViewedStore.setState({ items });

            // getItems should return at most MAX_RECENTLY_VIEWED
            const result = useRecentlyViewedStore.getState().getItems();
            expect(result.length).toBeLessThanOrEqual(MAX_RECENTLY_VIEWED);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Most recent first ordering', () => {
    it('for any sequence of items added, most recently added should be first', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedInputArb, { minLength: 2, maxLength: 10 }),
          async (items) => {
            resetStore();

            // Make items unique
            const uniqueItems = items.filter((item, index, self) =>
              index === self.findIndex(i => i.id === item.id && i.mediaType === item.mediaType)
            );

            if (uniqueItems.length < 2) return;

            // Mock storage
            mockStorage.addToRecentlyViewed.mockImplementation(async (item) => {
              const currentItems = useRecentlyViewedStore.getState().items;
              const newItem: RecentlyViewedItem = {
                ...item,
                viewedAt: new Date().toISOString(),
              };
              const filtered = currentItems.filter(
                i => !(i.id === item.id && i.mediaType === item.mediaType)
              );
              return [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
            });

            // Add items sequentially
            for (const item of uniqueItems) {
              await useRecentlyViewedStore.getState().addItem(item);
            }

            // Last added item should be first in the list
            const result = useRecentlyViewedStore.getState().getItems();
            const lastAdded = uniqueItems[uniqueItems.length - 1];
            
            expect(result[0].id).toBe(lastAdded.id);
            expect(result[0].mediaType).toBe(lastAdded.mediaType);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Duplicate handling', () => {
    it('for any item added multiple times, only one entry should exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          recentlyViewedInputArb,
          fc.integer({ min: 2, max: 5 }),
          async (item, addCount) => {
            resetStore();

            // Mock storage
            mockStorage.addToRecentlyViewed.mockImplementation(async (newItem) => {
              const currentItems = useRecentlyViewedStore.getState().items;
              const itemWithTimestamp: RecentlyViewedItem = {
                ...newItem,
                viewedAt: new Date().toISOString(),
              };
              const filtered = currentItems.filter(
                i => !(i.id === newItem.id && i.mediaType === newItem.mediaType)
              );
              return [itemWithTimestamp, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
            });

            // Add same item multiple times
            for (let i = 0; i < addCount; i++) {
              await useRecentlyViewedStore.getState().addItem(item);
            }

            // Should only have one entry for this item
            const result = useRecentlyViewedStore.getState().getItems();
            const matchingItems = result.filter(
              i => i.id === item.id && i.mediaType === item.mediaType
            );
            
            expect(matchingItems.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Feature: moviestream-mvp, Property 35: Recently Viewed Row Visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  /**
   * Property 35: Recently Viewed Row Visibility
   * For any Recently_Viewed list, the row SHALL be visible if and only if 
   * the list is non-empty.
   * 
   * **Validates: Requirements 14.4**
   */
  describe('Row visibility based on items', () => {
    it('hasItems should return true if and only if items array is non-empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedItemArb, { minLength: 0, maxLength: 15 }),
          async (items) => {
            resetStore();

            // Set items in state
            useRecentlyViewedStore.setState({ items });

            const store = useRecentlyViewedStore.getState();
            const hasItems = store.hasItems();
            const expectedHasItems = items.length > 0;

            expect(hasItems).toBe(expectedHasItems);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hasItems should return false for empty list', () => {
      resetStore();
      
      const store = useRecentlyViewedStore.getState();
      expect(store.hasItems()).toBe(false);
    });

    it('hasItems should return true after adding an item', async () => {
      await fc.assert(
        fc.asyncProperty(
          recentlyViewedInputArb,
          async (item) => {
            resetStore();

            // Mock storage
            mockStorage.addToRecentlyViewed.mockImplementation(async (newItem) => {
              return [{
                ...newItem,
                viewedAt: new Date().toISOString(),
              }];
            });

            // Initially should be false
            expect(useRecentlyViewedStore.getState().hasItems()).toBe(false);

            // Add item
            await useRecentlyViewedStore.getState().addItem(item);

            // Should now be true
            expect(useRecentlyViewedStore.getState().hasItems()).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hasItems should return false after clearing all items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedItemArb, { minLength: 1, maxLength: 10 }),
          async (items) => {
            resetStore();

            // Set items in state
            useRecentlyViewedStore.setState({ items });

            // Mock storage
            mockStorage.clearRecentlyViewed.mockResolvedValue([]);

            // Should have items
            expect(useRecentlyViewedStore.getState().hasItems()).toBe(true);

            // Clear all
            await useRecentlyViewedStore.getState().clearAll();

            // Should be empty
            expect(useRecentlyViewedStore.getState().hasItems()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Visibility consistency with getItems', () => {
    it('hasItems should be consistent with getItems().length > 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(recentlyViewedItemArb, { minLength: 0, maxLength: 20 }),
          async (items) => {
            resetStore();

            // Set items in state
            useRecentlyViewedStore.setState({ items });

            const store = useRecentlyViewedStore.getState();
            const hasItems = store.hasItems();
            const getItemsHasItems = store.getItems().length > 0;

            // Both should agree
            expect(hasItems).toBe(getItemsHasItems);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
