/**
 * OMDb API Adapter
 * Implements the MediaApiAdapter interface for OMDb API integration
 * Provides fallback strategies for features not supported by OMDb
 * 
 * Requirements: 1.2, 2.4, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5
 */

import type { MediaApiAdapter, PaginatedResponse } from '../types';
import type {
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
  MediaItem,
} from '@/types/media';
import type { SearchResults } from '@/types/user';
import {
  searchContent,
  getDetailsByImdbId,
  getDetailsByTitle,
  getImdbIdFromNumeric,
  type OMDbSearchType,
} from '../omdb';
import {
  mapOMDbToMediaDetails,
  mapOMDbSearchToSearchResults,
  getCastMembers,
  normalizePosterUrl,
  mapOMDbToMediaItem,
} from '../omdb-mappers';

// ============================================================================
// FALLBACK CONFIGURATION
// ============================================================================

/**
 * Popular search terms used as fallback for trending content
 * These are used when OMDb doesn't provide a trending endpoint
 */
const POPULAR_SEARCH_TERMS = {
  movie: ['action', 'comedy', 'drama', 'thriller', 'adventure'],
  tv: ['series', 'show', 'drama', 'comedy', 'crime'],
  all: ['movie', 'series', 'action', 'drama', 'comedy'],
};

/**
 * Country-specific search terms for discover by country fallback
 */
const COUNTRY_SEARCH_TERMS: Record<string, string[]> = {
  US: ['hollywood', 'american'],
  IN: ['bollywood', 'indian'],
  JP: ['anime', 'japanese'],
  CN: ['chinese', 'china'],
  RU: ['russian', 'russia'],
  ES: ['spanish', 'spain'],
  DE: ['german', 'germany'],
  FR: ['french', 'france'],
  KR: ['korean', 'korea'],
  GB: ['british', 'uk'],
};

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Log when a fallback strategy is being used
 * Requirement: 4.5
 */
function logFallbackUsage(feature: string, strategy: string): void {
  console.warn(`[OMDb Adapter] Fallback: ${feature} - using ${strategy}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert MediaItem to TrendingItem by adding rank
 */
function toTrendingItem(item: MediaItem, rank: number): TrendingItem {
  return {
    ...item,
    rank,
  };
}

/**
 * Get IMDb ID for a numeric ID, trying cache first then searching
 */
async function resolveImdbId(numericId: number, mediaType: 'movie' | 'tv'): Promise<string | null> {
  // Try cache first
  const cachedId = getImdbIdFromNumeric(numericId);
  if (cachedId) {
    return cachedId;
  }
  
  // If not in cache, we can't resolve it without additional context
  // This would require storing the mapping when items are first fetched
  return null;
}

// ============================================================================
// OMDB ADAPTER IMPLEMENTATION
// ============================================================================

export const omdbAdapter: MediaApiAdapter = {
  /**
   * Get trending content
   * Fallback: Uses popular search terms since OMDb doesn't have trending endpoint
   * 
   * Requirements: 4.1, 4.4, 4.5
   */
  async getTrending(
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
      console.error('[OMDb Adapter] getTrending error:', error);
      return {
        items: [],
        totalPages: 0,
        totalResults: 0,
      };
    }
  },

  /**
   * Get movie details by ID
   * 
   * Requirements: 3.4
   */
  async getMovieDetails(movieId: number): Promise<MediaDetails> {
    // Try to get IMDb ID from cache
    const imdbId = getImdbIdFromNumeric(movieId);
    
    if (imdbId) {
      const details = await getDetailsByImdbId({ imdbId, plot: 'full' });
      return mapOMDbToMediaDetails(details);
    }
    
    // If no cached IMDb ID, we need to throw an error
    // In practice, items should be fetched via search first which populates the cache
    throw new Error(`Cannot resolve movie ID ${movieId} to IMDb ID. Item must be fetched via search first.`);
  },

  /**
   * Get TV show details by ID
   * 
   * Requirements: 3.4
   */
  async getTvDetails(tvId: number): Promise<MediaDetails> {
    // Try to get IMDb ID from cache
    const imdbId = getImdbIdFromNumeric(tvId);
    
    if (imdbId) {
      const details = await getDetailsByImdbId({ imdbId, plot: 'full' });
      return mapOMDbToMediaDetails(details);
    }
    
    // If no cached IMDb ID, we need to throw an error
    throw new Error(`Cannot resolve TV ID ${tvId} to IMDb ID. Item must be fetched via search first.`);
  },

  /**
   * Search for content
   * 
   * Requirements: 2.4
   */
  async searchMulti(query: string, page: number): Promise<SearchResults> {
    const results = await searchContent({ query, page });
    return mapOMDbSearchToSearchResults(results, page);
  },

  /**
   * Get movie cast/credits
   * 
   * Requirements: 5.1, 5.4
   */
  async getMovieCredits(movieId: number): Promise<CastMember[]> {
    const imdbId = getImdbIdFromNumeric(movieId);
    
    if (!imdbId) {
      console.warn(`[OMDb Adapter] Cannot get credits for movie ${movieId}: IMDb ID not found`);
      return [];
    }
    
    try {
      const details = await getDetailsByImdbId({ imdbId, plot: 'short' });
      return getCastMembers(details);
    } catch (error) {
      console.error('[OMDb Adapter] getMovieCredits error:', error);
      return [];
    }
  },

  /**
   * Get TV show cast/credits
   * 
   * Requirements: 5.1, 5.4
   */
  async getTvCredits(tvId: number): Promise<CastMember[]> {
    const imdbId = getImdbIdFromNumeric(tvId);
    
    if (!imdbId) {
      console.warn(`[OMDb Adapter] Cannot get credits for TV ${tvId}: IMDb ID not found`);
      return [];
    }
    
    try {
      const details = await getDetailsByImdbId({ imdbId, plot: 'short' });
      return getCastMembers(details);
    } catch (error) {
      console.error('[OMDb Adapter] getTvCredits error:', error);
      return [];
    }
  },

  /**
   * Get streaming/watch providers
   * Fallback: Returns empty array since OMDb doesn't provide this data
   * 
   * Requirements: 4.4
   */
  async getWatchProviders(
    _mediaType: 'movie' | 'tv',
    _mediaId: number,
    _countryCode: string
  ): Promise<StreamingProvider[]> {
    logFallbackUsage('getWatchProviders', 'empty array (not supported by OMDb)');
    return [];
  },

  /**
   * Get recommendations
   * Fallback: Uses search with similar terms since OMDb doesn't have recommendations
   * 
   * Requirements: 4.4
   */
  async getRecommendations(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    page: number
  ): Promise<PaginatedResponse<MediaItem>> {
    logFallbackUsage('getRecommendations', 'genre-based search');
    
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
      } catch (error) {
        console.error('[OMDb Adapter] getRecommendations error:', error);
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
  },

  /**
   * Discover content by country
   * Fallback: Uses country-specific search terms
   * 
   * Requirements: 4.2, 4.3, 4.5
   */
  async discoverByCountry(
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
      console.error('[OMDb Adapter] discoverByCountry error:', error);
      return {
        items: [],
        totalPages: 0,
        totalResults: 0,
      };
    }
  },

  /**
   * Get trailer key
   * Fallback: Returns null since OMDb doesn't provide trailer data
   * 
   * Requirements: 4.4
   */
  async getTrailerKey(
    _mediaType: 'movie' | 'tv',
    _mediaId: number
  ): Promise<string | null> {
    logFallbackUsage('getTrailerKey', 'null (not supported by OMDb)');
    return null;
  },

  /**
   * Get image URL
   * OMDb returns direct poster URLs, so we just validate and return them
   * 
   * Requirements: 6.1, 6.2
   */
  getImageUrl(path: string | null, _size?: string): string | null {
    // OMDb returns full URLs directly, not paths
    // If it's already a full URL, validate and return it
    if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
      return normalizePosterUrl(path);
    }
    
    // If it's a path (shouldn't happen with OMDb), return null
    return null;
  },
};
