/**
 * Watchlist type definitions for MovieStream MVP
 * Defines watchlist item structure and sync status
 */

/** Sync status for watchlist items */
export type WatchlistSyncStatus = 'synced' | 'pending' | 'error';

/** Watchlist item stored locally and synced to server */
export interface WatchlistItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  addedAt: string;
  syncStatus: WatchlistSyncStatus;
}

/** Watchlist state for the store */
export interface WatchlistState {
  items: WatchlistItem[];
  isLoading: boolean;
  isSyncing: boolean;
}
