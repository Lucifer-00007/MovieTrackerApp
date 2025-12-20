/**
 * Zustand Stores Index for MovieStream MVP
 * Re-exports all stores for convenient imports
 */

export { useWatchlistStore } from './watchlistStore';
export { useDownloadsStore } from './downloadsStore';
export { usePreferencesStore } from './preferencesStore';
export { useRecentlyViewedStore, MAX_RECENTLY_VIEWED } from './recentlyViewedStore';
