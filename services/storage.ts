/**
 * AsyncStorage Service for MovieStream MVP
 * Provides typed get/set/remove operations for local persistence
 * 
 * Requirements: 7.3, 14.3
 * - Watchlist persistence for offline access
 * - Recently viewed persistence
 * - User preferences persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WatchlistItem } from '@/types/watchlist';
import type { UserPreferences, RecentlyViewedItem } from '@/types/user';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';

// Storage keys
const STORAGE_KEYS = {
  WATCHLIST: '@moviestream/watchlist',
  RECENTLY_VIEWED: '@moviestream/recently_viewed',
  USER_PREFERENCES: '@moviestream/user_preferences',
} as const;

// Maximum number of recently viewed items to store
const MAX_RECENTLY_VIEWED = 10;

// ============================================================================
// GENERIC STORAGE OPERATIONS
// ============================================================================

/**
 * Generic typed get operation
 * @param key - Storage key
 * @returns Parsed value or null if not found
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error reading from storage [${key}]:`, error);
    return null;
  }
}

/**
 * Generic typed set operation
 * @param key - Storage key
 * @param value - Value to store
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error writing to storage [${key}]:`, error);
    throw error;
  }
}

/**
 * Generic remove operation
 * @param key - Storage key
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from storage [${key}]:`, error);
    throw error;
  }
}

/**
 * Clear all app storage
 */
export async function clearAll(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

// ============================================================================
// WATCHLIST PERSISTENCE
// ============================================================================

/**
 * Get all watchlist items from storage
 * @returns Array of watchlist items
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const items = await getItem<WatchlistItem[]>(STORAGE_KEYS.WATCHLIST);
  return items || [];
}

/**
 * Save watchlist to storage
 * @param items - Array of watchlist items
 */
export async function saveWatchlist(items: WatchlistItem[]): Promise<void> {
  await setItem(STORAGE_KEYS.WATCHLIST, items);
}

/**
 * Add item to watchlist
 * @param item - Watchlist item to add
 * @returns Updated watchlist
 */
export async function addToWatchlist(item: WatchlistItem): Promise<WatchlistItem[]> {
  const watchlist = await getWatchlist();
  
  // Check if item already exists
  const existingIndex = watchlist.findIndex(
    w => w.id === item.id && w.mediaType === item.mediaType
  );
  
  if (existingIndex >= 0) {
    // Update existing item
    watchlist[existingIndex] = item;
  } else {
    // Add new item
    watchlist.push(item);
  }
  
  await saveWatchlist(watchlist);
  return watchlist;
}

/**
 * Remove item from watchlist
 * @param id - Media ID
 * @param mediaType - Media type ('movie' or 'tv')
 * @returns Updated watchlist
 */
export async function removeFromWatchlist(
  id: number,
  mediaType: 'movie' | 'tv'
): Promise<WatchlistItem[]> {
  const watchlist = await getWatchlist();
  const filtered = watchlist.filter(
    item => !(item.id === id && item.mediaType === mediaType)
  );
  await saveWatchlist(filtered);
  return filtered;
}

/**
 * Check if item is in watchlist
 * @param id - Media ID
 * @param mediaType - Media type ('movie' or 'tv')
 * @returns True if item is in watchlist
 */
export async function isInWatchlist(
  id: number,
  mediaType: 'movie' | 'tv'
): Promise<boolean> {
  const watchlist = await getWatchlist();
  return watchlist.some(item => item.id === id && item.mediaType === mediaType);
}

/**
 * Toggle item in watchlist (add if not present, remove if present)
 * @param item - Watchlist item to toggle
 * @returns Object with updated watchlist and whether item was added
 */
export async function toggleWatchlist(
  item: WatchlistItem
): Promise<{ watchlist: WatchlistItem[]; added: boolean }> {
  const isCurrentlyInWatchlist = await isInWatchlist(item.id, item.mediaType);
  
  if (isCurrentlyInWatchlist) {
    const watchlist = await removeFromWatchlist(item.id, item.mediaType);
    return { watchlist, added: false };
  } else {
    const watchlist = await addToWatchlist(item);
    return { watchlist, added: true };
  }
}

// ============================================================================
// RECENTLY VIEWED PERSISTENCE
// ============================================================================

/**
 * Get recently viewed items from storage
 * @returns Array of recently viewed items (max 10, most recent first)
 */
export async function getRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  const items = await getItem<RecentlyViewedItem[]>(STORAGE_KEYS.RECENTLY_VIEWED);
  return items || [];
}

/**
 * Save recently viewed items to storage
 * @param items - Array of recently viewed items
 */
export async function saveRecentlyViewed(items: RecentlyViewedItem[]): Promise<void> {
  await setItem(STORAGE_KEYS.RECENTLY_VIEWED, items);
}

/**
 * Add item to recently viewed list
 * Maintains max 10 items, removes duplicates, most recent first
 * @param item - Recently viewed item to add
 * @returns Updated recently viewed list
 */
export async function addToRecentlyViewed(
  item: Omit<RecentlyViewedItem, 'viewedAt'>
): Promise<RecentlyViewedItem[]> {
  const recentlyViewed = await getRecentlyViewed();
  
  // Remove existing entry for this item (if any)
  const filtered = recentlyViewed.filter(
    rv => !(rv.id === item.id && rv.mediaType === item.mediaType)
  );
  
  // Add new item at the beginning with current timestamp
  const newItem: RecentlyViewedItem = {
    ...item,
    viewedAt: new Date().toISOString(),
  };
  
  // Keep only the most recent MAX_RECENTLY_VIEWED items
  const updated = [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
  
  await saveRecentlyViewed(updated);
  return updated;
}

/**
 * Clear recently viewed history
 * @returns Empty array
 */
export async function clearRecentlyViewed(): Promise<RecentlyViewedItem[]> {
  await saveRecentlyViewed([]);
  return [];
}

// ============================================================================
// USER PREFERENCES PERSISTENCE
// ============================================================================

/**
 * Get user preferences from storage
 * @returns User preferences or defaults if not set
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const prefs = await getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
  return prefs || { ...DEFAULT_USER_PREFERENCES };
}

/**
 * Save user preferences to storage
 * @param preferences - User preferences to save
 */
export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  await setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
}

/**
 * Update specific user preference fields
 * @param updates - Partial preferences to update
 * @returns Updated preferences
 */
export async function updateUserPreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getUserPreferences();
  const updated = { ...current, ...updates };
  await saveUserPreferences(updated);
  return updated;
}

/**
 * Reset user preferences to defaults
 * @returns Default preferences
 */
export async function resetUserPreferences(): Promise<UserPreferences> {
  const defaults = { ...DEFAULT_USER_PREFERENCES };
  await saveUserPreferences(defaults);
  return defaults;
}

// Export storage keys for testing
export { STORAGE_KEYS, MAX_RECENTLY_VIEWED };
