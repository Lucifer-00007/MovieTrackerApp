/**
 * OMDb Adapter - Recommendations and Discovery Methods
 * Handles content recommendations and country-based discovery
 */

import type { PaginatedResponse } from '../../types';
import type { MediaItem, TrendingItem } from '@/types/media';
import { searchContent, getDetailsByImdbId, getImdbIdFromNumeric, type OMDbSearchType } from '../../omdb';
import { mapOMDbToMediaItem } from '../../omdb-mappers';
import { COUNTRY_SEARCH_TERMS } from './constants';
import { logFallbackUsage, handleAdapterError, toTrendingItem } from './utils';

/**
 * Get recommendations
 * Fallback: Uses search with similar terms since OMDb doesn't have recommendations
 * 
 * Requirements: 4.4
 */
export async function getRecommendations(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  page: number
): Promise<PaginatedResponse<MediaItem>> {
  logFallbackUsage('getRecommendations', 'genre-based search');
  
  try {
    // Try to get the original item's details for genre-based search
    const imdbId = getImdbIdFromNumeric(mediaId);
    
    if (imdbId) {
      try {
        const details = await getDetailsByImdbId({ imdbId, plot: 'short' });
        
        // Use the first genre as search term
        if (details.Genre && details.Genre !== 'N/A') {
          const firstGenre = details.Genre.split(',')[0].trim();
          const omdbType: OMDbSearchType = mediaType === 'tv' ? 'series' : 'movie';
          
          const results = await searchContent({
            query: firstGenre,
            page,
            type: omdbType,
          });
          
          // Filter out the original item
          const items = results.items
            .map(mapOMDbToMediaItem)
            .filter(item => item.id !== mediaId);
          
          return {
            items,
            totalPages: results.totalPages,
            totalResults: results.totalResults,
          };
        }
      } catch (detailError) {
        console.warn('[OMDb Adapter] Could not get details for recommendations, using fallback');
      }
    }
    
    // Default fallback: search by media type
    const searchTerm = mediaType === 'tv' ? 'series' : 'movie';
    const results = await searchContent({
      query: searchTerm,
      page,
      type: mediaType === 'tv' ? 'series' : 'movie',
    });
    
    return {
      items: results.items.map(mapOMDbToMediaItem),
      totalPages: results.totalPages,
      totalResults: results.totalResults,
    };
  } catch (error) {
    return handleAdapterError(error, 'getRecommendations', {
      items: [],
      totalPages: 0,
      totalResults: 0,
    });
  }
}

/**
 * Discover content by country
 * Fallback: Uses country-specific search terms
 * 
 * Requirements: 4.2, 4.3, 4.5
 */
export async function discoverByCountry(
  mediaType: 'movie' | 'tv',
  countryCode: string,
  options: {
    page?: number;
    genre?: number;
    year?: number;
    sortBy?: string;
  }
): Promise<PaginatedResponse<TrendingItem>> {
  logFallbackUsage('discoverByCountry', 'country-specific search terms');
  
  const page = options.page || 1;
  const searchTerms = COUNTRY_SEARCH_TERMS[countryCode] || [countryCode.toLowerCase()];
  const termIndex = (page - 1) % searchTerms.length;
  const searchTerm = searchTerms[termIndex];
  
  const omdbType: OMDbSearchType = mediaType === 'tv' ? 'series' : 'movie';
  
  try {
    const results = await searchContent({
      query: searchTerm,
      page: Math.ceil(page / searchTerms.length) || 1,
      type: omdbType,
      year: options.year,
    });
    
    const items = results.items.map((item, index) => {
      const mediaItem = mapOMDbToMediaItem(item);
      return toTrendingItem(mediaItem, (page - 1) * 10 + index + 1);
    });
    
    return {
      items,
      totalPages: Math.min(results.totalPages, 10),
      totalResults: results.totalResults,
    };
  } catch (error) {
    return handleAdapterError(error, 'discoverByCountry', {
      items: [],
      totalPages: 0,
      totalResults: 0,
    });
  }
}

/**
 * Get trailer key
 * Fallback: Returns null since OMDb doesn't provide trailer data
 * 
 * Requirements: 4.4
 */
export async function getTrailerKey(
  _mediaType: 'movie' | 'tv',
  _mediaId: number
): Promise<string | null> {
  logFallbackUsage('getTrailerKey', 'null (not supported by OMDb)');
  return null;
}