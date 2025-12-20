/**
 * Property-based tests for Watchlist Zustand Store
 * Feature: moviestream-mvp
 * 
 * Property 16: Watchlist Toggle
 * For any title on a Detail_Page, tapping the watchlist button SHALL toggle 
 * the isInWatchlist state and persist the change to AsyncStorage.
 * 
 * **Validates: Requirements 7.2**
 */

import * as fc from 'fast-check';
import { useWatchlistStore } from '@/stores/watchlistStore';
import * as storage from '@/services/storage';
import type { WatchlistItem } from '@/types/watchlist';

// Mock the storage service
jest.mock('@/services/storage', () => ({
  getWatchlist: jest.fn(),
  saveWatchlist: jest.fn(),
  addToWatchlist: jest.fn(),
  removeFromWatchlist: jest.fn(),
  toggleWatchlist: jest.fn(),
}));

const mockStorage = storage as jest.Mocked<typeof storage>;

// Arbitraries for generating test data
const mediaTypeArb = fc.constantFrom('movie' as const, 'tv' as const);

const watchlistInputArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  mediaType: mediaTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
});

// Helper to reset store state between tests
const resetStore = () => {
  useWatchlistStore.setState({
    items: [],
    isLoading: false,
    isSyncing: false,
    error: null,
  });
};

describe('Feature: moviestream-mvp, Property 16: Watchlist Toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  /**
   * Property 16: Watchlist Toggle
   * For any title on a Detail_Page, tapping the watchlist button SHALL toggle 
   * the isInWatchlist state and persist the change to AsyncStorage.
   * 
   * **Validates: Requirements 7.2**
   */
  describe('Toggle adds item when not in watchlist', () => {
    it('for any item not in watchlist, toggle should add it and return true', async () => {
      await fc.assert(
        fc.asyncProperty(
          watchlistInputArb,
          async (item) => {
            resetStore();
            
            // Setup: item not in watchlist
            mockStorage.addToWatchlist.mockResolvedValue([{
              ...item,
              addedAt: new Date().toISOString(),
              syncStatus: 'synced',
            }]);

            const store = useWatchlistStore.getState();
            
            // Verify item is not in watchlist initially
            expect(store.isInWatchlist(item.id, item.mediaType)).toBe(false);

            // Toggle item
            const result = await store.toggleItem(item);

            // Should return true (item was added)
            expect(result).toBe(true);

            // Item should now be in watchlist
            const updatedStore = useWatchlistStore.getState();
            expect(updatedStore.isInWatchlist(item.id, item.mediaType)).toBe(true);

            // Storage should have been called
            expect(mockStorage.addToWatchlist).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Toggle removes item when in watchlist', () => {
    it('for any item in watchlist, toggle should remove it and return false', async () => {
      await fc.assert(
        fc.asyncProperty(
          watchlistInputArb,
          async (item) => {
            resetStore();

            // Setup: item already in watchlist
            const existingItem: WatchlistItem = {
              ...item,
              addedAt: new Date().toISOString(),
              syncStatus: 'synced',
            };
            
            useWatchlistStore.setState({ items: [existingItem] });
            mockStorage.removeFromWatchlist.mockResolvedValue([]);

            const store = useWatchlistStore.getState();
            
            // Verify item is in watchlist initially
            expect(store.isInWatchlist(item.id, item.mediaType)).toBe(true);

            // Toggle item
            const result = await store.toggleItem(item);

            // Should return false (item was removed)
            expect(result).toBe(false);

            // Item should no longer be in watchlist
            const updatedStore = useWatchlistStore.getState();
            expect(updatedStore.isInWatchlist(item.id, item.mediaType)).toBe(false);

            // Storage should have been called
            expect(mockStorage.removeFromWatchlist).toHaveBeenCalledWith(item.id, item.mediaType);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Toggle is idempotent over two calls', () => {
    it('for any item, toggling twice should return to original state', async () => {
      await fc.assert(
        fc.asyncProperty(
          watchlistInputArb,
          fc.boolean(),
          async (item, startInWatchlist) => {
            resetStore();

            // Setup initial state
            if (startInWatchlist) {
              const existingItem: WatchlistItem = {
                ...item,
                addedAt: new Date().toISOString(),
                syncStatus: 'synced',
              };
              useWatchlistStore.setState({ items: [existingItem] });
            }

            // Mock storage operations
            mockStorage.addToWatchlist.mockImplementation(async (newItem) => [newItem]);
            mockStorage.removeFromWatchlist.mockResolvedValue([]);

            const initialInWatchlist = useWatchlistStore.getState().isInWatchlist(item.id, item.mediaType);

            // First toggle
            await useWatchlistStore.getState().toggleItem(item);
            const afterFirstToggle = useWatchlistStore.getState().isInWatchlist(item.id, item.mediaType);

            // State should be opposite after first toggle
            expect(afterFirstToggle).toBe(!initialInWatchlist);

            // Second toggle
            await useWatchlistStore.getState().toggleItem(item);
            const afterSecondToggle = useWatchlistStore.getState().isInWatchlist(item.id, item.mediaType);

            // State should return to original after second toggle
            expect(afterSecondToggle).toBe(initialInWatchlist);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isInWatchlist correctly reflects state', () => {
    it('for any set of items, isInWatchlist should correctly identify membership', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(watchlistInputArb, { minLength: 0, maxLength: 20 }),
          watchlistInputArb,
          async (existingItems, queryItem) => {
            resetStore();

            // Setup: add existing items to store
            const watchlistItems: WatchlistItem[] = existingItems.map(item => ({
              ...item,
              addedAt: new Date().toISOString(),
              syncStatus: 'synced' as const,
            }));
            
            useWatchlistStore.setState({ items: watchlistItems });

            const store = useWatchlistStore.getState();
            const result = store.isInWatchlist(queryItem.id, queryItem.mediaType);

            // Check if query item exists in the list
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

  describe('Add item persists to storage', () => {
    it('for any item, adding should call storage and update state', async () => {
      await fc.assert(
        fc.asyncProperty(
          watchlistInputArb,
          async (item) => {
            resetStore();

            mockStorage.addToWatchlist.mockImplementation(async (newItem) => [newItem]);

            const store = useWatchlistStore.getState();
            await store.addItem(item);

            // Storage should have been called with item containing required fields
            expect(mockStorage.addToWatchlist).toHaveBeenCalledWith(
              expect.objectContaining({
                id: item.id,
                mediaType: item.mediaType,
                title: item.title,
                posterPath: item.posterPath,
                addedAt: expect.any(String),
                syncStatus: expect.any(String),
              })
            );

            // Item should be in store
            const updatedStore = useWatchlistStore.getState();
            expect(updatedStore.isInWatchlist(item.id, item.mediaType)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Remove item persists to storage', () => {
    it('for any item in watchlist, removing should call storage and update state', async () => {
      await fc.assert(
        fc.asyncProperty(
          watchlistInputArb,
          async (item) => {
            resetStore();

            // Setup: item in watchlist
            const existingItem: WatchlistItem = {
              ...item,
              addedAt: new Date().toISOString(),
              syncStatus: 'synced',
            };
            useWatchlistStore.setState({ items: [existingItem] });
            mockStorage.removeFromWatchlist.mockResolvedValue([]);

            const store = useWatchlistStore.getState();
            await store.removeItem(item.id, item.mediaType);

            // Storage should have been called
            expect(mockStorage.removeFromWatchlist).toHaveBeenCalledWith(item.id, item.mediaType);

            // Item should not be in store
            const updatedStore = useWatchlistStore.getState();
            expect(updatedStore.isInWatchlist(item.id, item.mediaType)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
