/**
 * Recently Viewed Zustand Store for MovieStream MVP
 * Manages recently viewed items with add/get actions
 * 
 * Requirements: 14.1
 * - Display last 10 titles accessed by user
 * - Most recent first ordering
 * - Persistence to AsyncStorage
 */

import { create } from 'zustand';
import type { RecentlyViewedItem } from '@/types/user';
import {
  getRecentlyViewed,
  addToRecentlyViewed as addToStorage,
  clearRecentlyViewed as clearStorage,
} from '@/services/storage';

// Maximum number of recently viewed items to display
const MAX_RECENTLY_VIEWED = 10;

interface RecentlyViewedStore {
  // State
  items: RecentlyViewedItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRecentlyViewed: () => Promise<void>;
  addItem: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => Promise<void>;
  clearAll: () => Promise<void>;
  getItems: () => RecentlyViewedItem[];
  hasItems: () => boolean;
  clearError: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>((set, get) => ({
  // Initial state
  items: [],
  isLoading: false,
  error: null,

  // Load recently viewed from storage
  loadRecentlyViewed: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await getRecentlyViewed();
      set({ items, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load recently viewed',
      });
    }
  },

  // Add item to recently viewed
  addItem: async (item) => {
    // Create new item with timestamp
    const newItem: RecentlyViewedItem = {
      ...item,
      viewedAt: new Date().toISOString(),
    };

    // Optimistic update - remove existing entry and add to front
    set((state) => {
      const filtered = state.items.filter(
        i => !(i.id === item.id && i.mediaType === item.mediaType)
      );
      const updated = [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      return { items: updated };
    });

    try {
      await addToStorage(item);
    } catch (error) {
      // On error, reload from storage to ensure consistency
      try {
        const items = await getRecentlyViewed();
        set({ items });
      } catch {
        // If reload also fails, keep optimistic state but set error
        set({
          error: error instanceof Error ? error.message : 'Failed to save recently viewed',
        });
      }
    }
  },

  // Clear all recently viewed items
  clearAll: async () => {
    const previousItems = get().items;

    // Optimistic update
    set({ items: [] });

    try {
      await clearStorage();
    } catch (error) {
      // Rollback on failure
      set({
        items: previousItems,
        error: error instanceof Error ? error.message : 'Failed to clear recently viewed',
      });
    }
  },

  // Get all items (limited to MAX_RECENTLY_VIEWED)
  getItems: () => {
    return get().items.slice(0, MAX_RECENTLY_VIEWED);
  },

  // Check if there are any items (for row visibility)
  hasItems: () => {
    return get().items.length > 0;
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));

// Export constant for use in tests
export { MAX_RECENTLY_VIEWED };
