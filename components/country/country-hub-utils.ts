/**
 * Country Hub Utility Functions
 * Pure functions for filtering, ranking, and displaying country hub content
 * 
 * Requirements: 3.3, 3.4, 3.5, 3.6
 */

import { 
  SUPPORTED_COUNTRIES, 
  getCountryConfig,
  isCountrySupported as checkCountrySupported,
  type CountryConfig,
} from '@/constants/countries';
import type { TrendingItem } from '@/types/media';

/** Content type filter options */
export type ContentTypeFilter = 'all' | 'movie' | 'tv';

/** Filter state interface */
export interface CountryHubFilters {
  contentType: ContentTypeFilter;
  genre: number | null;
  year: number | null;
}

/**
 * Get country configuration by code
 * @param code - ISO 3166-1 country code
 * @returns Country configuration or undefined if not found
 */
export function getCountryByCode(code: string): CountryConfig | undefined {
  return getCountryConfig(code);
}

/**
 * Check if a country code is supported
 * @param code - ISO 3166-1 country code
 * @returns True if country is supported
 */
export function isCountrySupported(code: string): boolean {
  return checkCountrySupported(code);
}

/**
 * Get country header display text
 * @param country - Country configuration
 * @returns Object with flag and name for display
 */
export function getCountryHeaderDisplay(country: CountryConfig): { flag: string; name: string } {
  return {
    flag: country.flag,
    name: country.name,
  };
}

/**
 * Filter content by content type
 * @param items - Array of trending items
 * @param contentType - Content type filter
 * @returns Filtered array of items
 */
export function filterByContentType(
  items: TrendingItem[],
  contentType: ContentTypeFilter
): TrendingItem[] {
  if (contentType === 'all') {
    return items;
  }
  return items.filter((item) => item.mediaType === contentType);
}

/**
 * Filter content by genre
 * @param items - Array of trending items
 * @param genreId - Genre ID to filter by (null for all genres)
 * @returns Filtered array of items
 */
export function filterByGenre(
  items: TrendingItem[],
  genreId: number | null
): TrendingItem[] {
  if (genreId === null) {
    return items;
  }
  return items.filter((item) => item.genreIds.includes(genreId));
}

/**
 * Filter content by release year
 * @param items - Array of trending items
 * @param year - Year to filter by (null for all years)
 * @returns Filtered array of items
 */
export function filterByYear(
  items: TrendingItem[],
  year: number | null
): TrendingItem[] {
  if (year === null) {
    return items;
  }
  return items.filter((item) => {
    if (!item.releaseDate) return false;
    const itemYear = new Date(item.releaseDate).getFullYear();
    return itemYear === year;
  });
}

/**
 * Apply all filters to content
 * @param items - Array of trending items
 * @param filters - Filter configuration
 * @returns Filtered array of items
 */
export function applyFilters(
  items: TrendingItem[],
  filters: CountryHubFilters
): TrendingItem[] {
  let filtered = items;
  
  // Apply content type filter
  filtered = filterByContentType(filtered, filters.contentType);
  
  // Apply genre filter
  filtered = filterByGenre(filtered, filters.genre);
  
  // Apply year filter
  filtered = filterByYear(filtered, filters.year);
  
  return filtered;
}

/**
 * Check if an item should display a rank badge
 * @param rank - Item rank
 * @returns True if rank badge should be displayed (rank 1-10)
 */
export function shouldShowRankBadge(rank: number): boolean {
  return rank >= 1 && rank <= 10;
}

/**
 * Assign ranks to items based on their position
 * @param items - Array of trending items
 * @returns Array with updated rank values
 */
export function assignRanks(items: TrendingItem[]): TrendingItem[] {
  return items.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Merge and sort movies and TV shows by popularity
 * @param movies - Array of movie items
 * @param tvShows - Array of TV show items
 * @returns Merged and sorted array with new ranks
 */
export function mergeAndRankContent(
  movies: TrendingItem[],
  tvShows: TrendingItem[]
): TrendingItem[] {
  // Combine all items
  const combined = [...movies, ...tvShows];
  
  // Sort by original rank (popularity)
  combined.sort((a, b) => a.rank - b.rank);
  
  // Assign new sequential ranks
  return assignRanks(combined);
}

/**
 * Check if filters are active (not default values)
 * @param filters - Filter configuration
 * @returns True if any filter is active
 */
export function hasActiveFilters(filters: CountryHubFilters): boolean {
  return filters.genre !== null || filters.year !== null;
}

/**
 * Get filter suggestions for empty results
 * @returns Array of suggestion strings
 */
export function getEmptyFilterSuggestions(): string[] {
  return [
    'Try a different genre',
    'Select a different year',
    'Change the content type',
  ];
}

/**
 * Validate that all items match the applied filters
 * Used for property testing
 * @param items - Array of filtered items
 * @param filters - Applied filters
 * @returns True if all items match all filters
 */
export function validateFilteredContent(
  items: TrendingItem[],
  filters: CountryHubFilters
): boolean {
  return items.every((item) => {
    // Check content type
    if (filters.contentType !== 'all' && item.mediaType !== filters.contentType) {
      return false;
    }
    
    // Check genre
    if (filters.genre !== null && !item.genreIds.includes(filters.genre)) {
      return false;
    }
    
    // Check year
    if (filters.year !== null) {
      if (!item.releaseDate) return false;
      const itemYear = new Date(item.releaseDate).getFullYear();
      if (itemYear !== filters.year) return false;
    }
    
    return true;
  });
}

/**
 * Validate rank badges are correctly displayed
 * @param items - Array of items with ranks
 * @returns Object with validation results
 */
export function validateRankBadges(items: TrendingItem[]): {
  itemsWithBadges: TrendingItem[];
  itemsWithoutBadges: TrendingItem[];
  isValid: boolean;
} {
  const itemsWithBadges = items.filter((item) => shouldShowRankBadge(item.rank));
  const itemsWithoutBadges = items.filter((item) => !shouldShowRankBadge(item.rank));
  
  // Validate: items with rank 1-10 should have badges, others should not
  const isValid = items.every((item) => {
    const shouldHaveBadge = item.rank >= 1 && item.rank <= 10;
    return shouldShowRankBadge(item.rank) === shouldHaveBadge;
  });
  
  return {
    itemsWithBadges,
    itemsWithoutBadges,
    isValid,
  };
}
