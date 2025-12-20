/**
 * Watchlist Zustand Store for MovieStream MVP
 * Manages watchlist state with add/remove/toggle actions
 * 
 * Requirements: 7.2
 * - Toggle watchlist status from Detail_Page
 * - Immediate UI updates
 * - Persistence to AsyncStorage
 */

import { create } from 'zustand';
import type { WatchlistItem, WatchlistSyncStatus } from '@/types/watchlist';
import {
  getWatchlist,
  saveWatchlist,
  addToWatchlist as addToStorage,
  removeFromWatchlist as removeFromStorage,
  toggleWatchlist as toggleInStorage,
} from '@/services/storage';

interface WatchlistStore {
  // State
  items: WatchlistItem[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  loadWatchlist: () => Promise<void>;
  addItem: (item: Omit<WatchlistItem, 'addedAt' | 'syncStatus'>) => Promise<void>;
  removeItem: (id: number, mediaType: 'movie' | 'tv') => Promise<void>;
  toggleItem: (item: Omit<WatchlistItem, 'addedAt' | 'syncStatus'>) => Promise<boolean>;
  isInWatchlist: (id: number, mediaType: 'movie' | 'tv') => boolean;
  updateSyncStatus: (id: number, mediaType: 'movie' | 'tv', status: WatchlistSyncStatus) => void;
  clearError: () => void;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  // Initial state
  items: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  // Load watchlist from storage
  loadWatchlist: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await getWatchlist();
      set({ items, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load watchlist' 
      });
    }
  },

  // Add item to watchlist
  addItem: async (item) => {
    const newItem: WatchlistItem = {
      ...item,
      addedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    // Optimistic update
    set((state) => ({
      items: [...state.items.filter(
        i => !(i.id === item.id && i.mediaType === item.mediaType)
      ), newItem],
    }));

    try {
      await addToStorage(newItem);
      // Update sync status to synced after successful persistence
      set((state) => ({
        items: state.items.map(i =>
          i.id === item.id && i.mediaType === item.mediaType
            ? { ...i, syncStatus: 'synced' as WatchlistSyncStatus }
            : i
        ),
      }));
    } catch (error) {
      // Update sync status to error on failure
      set((state) => ({
        items: state.items.map(i =>
          i.id === item.id && i.mediaType === item.mediaType
            ? { ...i, syncStatus: 'error' as WatchlistSyncStatus }
            : i
        ),
        error: error instanceof Error ? error.message : 'Failed to add to watchlist',
      }));
    }
  },

  // Remove item from watchlist
  removeItem: async (id, mediaType) => {
    const previousItems = get().items;

    // Optimistic update
    set((state) => ({
      items: state.items.filter(i => !(i.id === id && i.mediaType === mediaType)),
    }));

    try {
      await removeFromStorage(id, mediaType);
    } catch (error) {
      // Rollback on failure
      set({ 
        items: previousItems,
        error: error instanceof Error ? error.message : 'Failed to remove from watchlist',
      });
    }
  },

  // Toggle item in watchlist (add if not present, remove if present)
  toggleItem: async (item) => {
    const isCurrentlyInWatchlist = get().isInWatchlist(item.id, item.mediaType);

    if (isCurrentlyInWatchlist) {
      await get().removeItem(item.id, item.mediaType);
      return false; // Item was removed
    } else {
      await get().addItem(item);
      return true; // Item was added
    }
  },

  // Check if item is in watchlist
  isInWatchlist: (id, mediaType) => {
    return get().items.some(item => item.id === id && item.mediaType === mediaType);
  },

  // Update sync status for an item
  updateSyncStatus: (id, mediaType, status) => {
    set((state) => ({
      items: state.items.map(item =>
        item.id === id && item.mediaType === mediaType
          ? { ...item, syncStatus: status }
          : item
      ),
    }));
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));
