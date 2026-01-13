/**
 * OMDb Adapter Utilities
 * Helper functions for error handling and data transformation
 */

import type { MediaItem, TrendingItem } from '@/types/media';
import { OMDbError, getImdbIdFromNumeric } from '../../omdb';

/**
 * Log when a fallback strategy is being used
 * Requirement: 4.5
 */
export function logFallbackUsage(feature: string, strategy: string): void {
  console.warn(`[OMDb Adapter] Fallback: ${feature} - using ${strategy}`);
}

/**
 * Handle errors gracefully and provide fallback responses
 */
export function handleAdapterError(error: unknown, operation: string, fallbackValue: any = null): any {
  if (error instanceof OMDbError) {
    // Log the error with context
    console.error(`[OMDb Adapter] ${operation} failed:`, {
      code: error.code,
      message: error.message,
      isRetryable: error.isRetryable,
      context: error.context,
    });
    
    // For certain errors, provide graceful fallbacks
    if (error.code === 'NOT_FOUND' && operation.includes('search')) {
      return {
        items: [],
        totalPages: 0,
        totalResults: 0,
      };
    }
    
    if (error.code === 'RATE_LIMITED') {
      // Return cached or empty response for rate limiting
      return fallbackValue || {
        items: [],
        totalPages: 0,
        totalResults: 0,
      };
    }
  }
  
  // For unknown errors, log and return fallback
  console.error(`[OMDb Adapter] Unexpected error in ${operation}:`, error);
  return fallbackValue;
}

/**
 * Convert MediaItem to TrendingItem by adding rank
 */
export function toTrendingItem(item: MediaItem, rank: number): TrendingItem {
  return {
    ...item,
    rank,
  };
}

/**
 * Get IMDb ID for a numeric ID, trying cache first then searching
 */
export async function resolveImdbId(numericId: number, mediaType: 'movie' | 'tv'): Promise<string | null> {
  // Try cache first
  const cachedId = getImdbIdFromNumeric(numericId);
  if (cachedId) {
    return cachedId;
  }
  
  // If not in cache, we can't resolve it without additional context
  // This would require storing the mapping when items are first fetched
  return null;
}