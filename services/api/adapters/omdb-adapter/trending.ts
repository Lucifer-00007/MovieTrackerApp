/**
 * OMDb Adapter - Trending Methods
 * Handles trending content with fallback strategies
 */

import type { PaginatedResponse } from '../../types';
import type { TrendingItem } from '@/types/media';
import { searchContent, type OMDbSearchType } from '../../omdb';
import { mapOMDbToMediaItem } from '../../omdb-mappers';
import { POPULAR_SEARCH_TERMS } from './constants';
import { logFallbackUsage, handleAdapterError, toTrendingItem } from './utils';

/**
 * Get trending content
 * Fallback: Uses popular search terms since OMDb doesn't have trending endpoint
 * 
 * Requirements: 4.1, 4.4, 4.5
 */
export async function getTrending(
  mediaType: 'all' | 'movie' | 'tv',
  _timeWindow: 'day' | 'week',
  page: number
): Promise<PaginatedResponse<TrendingItem>> {
  logFallbackUsage('getTrending', 'popular search terms');
  
  const searchTerms = POPULAR_SEARCH_TERMS[mediaType];
  const termIndex = (page - 1) % searchTerms.length;
  const searchTerm = searchTerms[termIndex];
  
  // Map mediaType to OMDb type
  const omdbType: OMDbSearchType | undefined = 
    mediaType === 'all' ? undefined : 
    mediaType === 'tv' ? 'series' : 'movie';
  
  try {
    const results = await searchContent({
      query: searchTerm,
      page: Math.ceil(page / searchTerms.length) || 1,
      type: omdbType,
    });
    
    const items = results.items.map((item, index) => {
      const mediaItem = mapOMDbToMediaItem(item);
      return toTrendingItem(mediaItem, (page - 1) * 10 + index + 1);
    });
    
    return {
      items,
      totalPages: Math.min(results.totalPages, 10), // Limit to reasonable number
      totalResults: results.totalResults,
    };
  } catch (error) {
    return handleAdapterError(error, 'getTrending', {
      items: [],
      totalPages: 0,
      totalResults: 0,
    });
  }
}