/**
 * Watchlist utility functions for MovieStream MVP
 * Pure functions for watchlist display logic
 * 
 * Requirements: 7.4, 7.5, 7.6
 */

import type { WatchlistItem } from '@/types/watchlist';

/**
 * Grid configuration for watchlist display
 */
export interface WatchlistGridConfig {
  numColumns: number;
  cardWidth: number;
  cardHeight: number;
  spacing: number;
}

/**
 * Calculate grid configuration based on screen width
 * @param screenWidth - Width of the screen
 * @param horizontalPadding - Horizontal padding on each side
 * @param numColumns - Number of columns in the grid
 * @param spacing - Spacing between cards
 * @returns Grid configuration
 */
export function calculateGridConfig(
  screenWidth: number,
  horizontalPadding: number = 16,
  numColumns: number = 3,
  spacing: number = 8
): WatchlistGridConfig {
  const availableWidth = screenWidth - (horizontalPadding * 2) - (spacing * (numColumns - 1));
  const cardWidth = Math.floor(availableWidth / numColumns);
  const cardHeight = Math.floor(cardWidth * 1.5); // 2:3 aspect ratio for posters

  return {
    numColumns,
    cardWidth,
    cardHeight,
    spacing,
  };
}

/**
 * Sort watchlist items by date added (most recent first)
 * @param items - Array of watchlist items
 * @returns Sorted array of watchlist items
 */
export function sortByDateAdded(items: WatchlistItem[]): WatchlistItem[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.addedAt).getTime();
    const dateB = new Date(b.addedAt).getTime();
    return dateB - dateA; // Most recent first
  });
}

/**
 * Sort watchlist items alphabetically by title
 * @param items - Array of watchlist items
 * @returns Sorted array of watchlist items
 */
export function sortByTitle(items: WatchlistItem[]): WatchlistItem[] {
  return [...items].sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Filter watchlist items by media type
 * @param items - Array of watchlist items
 * @param mediaType - Media type to filter by ('movie' | 'tv' | 'all')
 * @returns Filtered array of watchlist items
 */
export function filterByMediaType(
  items: WatchlistItem[],
  mediaType: 'movie' | 'tv' | 'all'
): WatchlistItem[] {
  if (mediaType === 'all') {
    return items;
  }
  return items.filter(item => item.mediaType === mediaType);
}

/**
 * Get sync status summary for watchlist
 * @param items - Array of watchlist items
 * @returns Object with counts for each sync status
 */
export function getSyncStatusSummary(items: WatchlistItem[]): {
  synced: number;
  pending: number;
  error: number;
  total: number;
} {
  const summary = {
    synced: 0,
    pending: 0,
    error: 0,
    total: items.length,
  };

  for (const item of items) {
    summary[item.syncStatus]++;
  }

  return summary;
}

/**
 * Check if all items are synced
 * @param items - Array of watchlist items
 * @returns True if all items are synced
 */
export function isFullySynced(items: WatchlistItem[]): boolean {
  return items.every(item => item.syncStatus === 'synced');
}

/**
 * Check if any items have sync errors
 * @param items - Array of watchlist items
 * @returns True if any items have sync errors
 */
export function hasSyncErrors(items: WatchlistItem[]): boolean {
  return items.some(item => item.syncStatus === 'error');
}

/**
 * Get items with sync errors
 * @param items - Array of watchlist items
 * @returns Array of items with sync errors
 */
export function getItemsWithErrors(items: WatchlistItem[]): WatchlistItem[] {
  return items.filter(item => item.syncStatus === 'error');
}

/**
 * Generate unique key for watchlist item
 * @param item - Watchlist item
 * @returns Unique key string
 */
export function generateItemKey(item: WatchlistItem): string {
  return `${item.mediaType}-${item.id}`;
}

/**
 * Check if an item exists in the watchlist
 * @param items - Array of watchlist items
 * @param id - Media ID to check
 * @param mediaType - Media type to check
 * @returns True if item exists in watchlist
 */
export function isItemInWatchlist(
  items: WatchlistItem[],
  id: number,
  mediaType: 'movie' | 'tv'
): boolean {
  return items.some(item => item.id === id && item.mediaType === mediaType);
}

/**
 * Get watchlist item by ID and media type
 * @param items - Array of watchlist items
 * @param id - Media ID
 * @param mediaType - Media type
 * @returns Watchlist item or undefined
 */
export function getWatchlistItem(
  items: WatchlistItem[],
  id: number,
  mediaType: 'movie' | 'tv'
): WatchlistItem | undefined {
  return items.find(item => item.id === id && item.mediaType === mediaType);
}

/**
 * Format item count text
 * @param count - Number of items
 * @returns Formatted string (e.g., "5 titles" or "1 title")
 */
export function formatItemCount(count: number): string {
  return `${count} ${count === 1 ? 'title' : 'titles'}`;
}

/**
 * Get accessibility label for watchlist item
 * @param item - Watchlist item
 * @returns Accessibility label string
 */
export function getItemAccessibilityLabel(item: WatchlistItem): string {
  const typeLabel = item.mediaType === 'movie' ? 'Movie' : 'TV Series';
  const syncLabel = item.syncStatus === 'synced' 
    ? 'Synced' 
    : item.syncStatus === 'pending' 
      ? 'Syncing' 
      : 'Sync error';
  
  return `${item.title}. ${typeLabel}. ${syncLabel}. Long press to remove from watchlist`;
}

/**
 * Validate watchlist item has required fields for display
 * @param item - Watchlist item to validate
 * @returns True if item has all required fields
 */
export function isValidWatchlistItem(item: WatchlistItem): boolean {
  return (
    typeof item.id === 'number' &&
    item.id > 0 &&
    typeof item.title === 'string' &&
    item.title.length > 0 &&
    (item.mediaType === 'movie' || item.mediaType === 'tv') &&
    typeof item.addedAt === 'string' &&
    (item.syncStatus === 'synced' || item.syncStatus === 'pending' || item.syncStatus === 'error')
  );
}

/**
 * Get all valid watchlist items (filters out invalid items)
 * @param items - Array of watchlist items
 * @returns Array of valid watchlist items
 */
export function getValidItems(items: WatchlistItem[]): WatchlistItem[] {
  return items.filter(isValidWatchlistItem);
}
