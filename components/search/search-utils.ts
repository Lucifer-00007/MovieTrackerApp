/**
 * Search Utilities
 * Helper functions for search functionality
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import type { MediaItem } from '@/types/media';
import type { SearchResults, SearchFilters } from '@/types/user';

/** Debounce delay for search input (ms) */
export const SEARCH_DEBOUNCE_MS = 300;

/** Minimum query length to trigger search */
export const MIN_QUERY_LENGTH = 2;

/** Genre options for search filtering */
export const SEARCH_GENRE_OPTIONS = [
  { id: null, name: 'All Genres' },
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
];

/** Country options for search filtering */
export const SEARCH_COUNTRY_OPTIONS = [
  { code: null, name: 'All Countries' },
  { code: 'US', name: 'United States' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'ES', name: 'Spain' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'KR', name: 'South Korea' },
];

/** Year options for search filtering */
const currentYear = new Date().getFullYear();
export const SEARCH_YEAR_OPTIONS = [
  { value: null, label: 'All Years' },
  ...Array.from({ length: 15 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
  })),
];

/** Default search filters */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  country: null,
  genre: null,
  yearFrom: null,
  yearTo: null,
};

/** Empty search results */
export const EMPTY_SEARCH_RESULTS: SearchResults = {
  movies: [],
  tvShows: [],
  totalResults: 0,
  page: 1,
  totalPages: 0,
};

/**
 * Group search results by content type
 * @param results - Raw search results
 * @returns Grouped results with movies and TV shows separated
 */
export function groupSearchResults(results: MediaItem[]): { movies: MediaItem[]; tvShows: MediaItem[] } {
  const movies: MediaItem[] = [];
  const tvShows: MediaItem[] = [];

  for (const item of results) {
    if (item.mediaType === 'movie') {
      movies.push(item);
    } else if (item.mediaType === 'tv') {
      tvShows.push(item);
    }
  }

  return { movies, tvShows };
}

/**
 * Apply filters to search results
 * @param results - Search results to filter
 * @param filters - Active filters
 * @returns Filtered results
 */
export function applySearchFilters(
  results: SearchResults,
  filters: SearchFilters
): SearchResults {
  let filteredMovies = [...results.movies];
  let filteredTvShows = [...results.tvShows];

  // Apply genre filter
  if (filters.genre !== null) {
    filteredMovies = filteredMovies.filter((item) =>
      item.genreIds.includes(filters.genre!)
    );
    filteredTvShows = filteredTvShows.filter((item) =>
      item.genreIds.includes(filters.genre!)
    );
  }

  // Apply year filter (yearFrom acts as exact year match for simplicity)
  if (filters.yearFrom !== null) {
    const targetYear = filters.yearFrom;
    filteredMovies = filteredMovies.filter((item) => {
      if (!item.releaseDate) return false;
      const year = new Date(item.releaseDate).getFullYear();
      return year === targetYear;
    });
    filteredTvShows = filteredTvShows.filter((item) => {
      if (!item.releaseDate) return false;
      const year = new Date(item.releaseDate).getFullYear();
      return year === targetYear;
    });
  }

  // Note: Country filter is applied at API level via origin_country parameter
  // For client-side filtering, we would need production_countries data

  const totalResults = filteredMovies.length + filteredTvShows.length;

  return {
    movies: filteredMovies,
    tvShows: filteredTvShows,
    totalResults,
    page: results.page,
    totalPages: results.totalPages,
  };
}

/**
 * Check if any filters are active
 * @param filters - Current filter state
 * @returns True if any filter is active
 */
export function hasActiveFilters(filters: SearchFilters): boolean {
  return (
    filters.country !== null ||
    filters.genre !== null ||
    filters.yearFrom !== null ||
    filters.yearTo !== null
  );
}

/**
 * Get search suggestions for empty results
 * @param query - Current search query
 * @returns Array of suggestion strings
 */
export function getSearchSuggestions(query: string): string[] {
  const suggestions = [
    'Check your spelling',
    'Try using fewer keywords',
    'Try a more general search term',
  ];

  if (query.length > 10) {
    suggestions.unshift('Try a shorter search term');
  }

  return suggestions;
}

/**
 * Validate search query
 * @param query - Search query to validate
 * @returns True if query is valid for search
 */
export function isValidSearchQuery(query: string): boolean {
  const trimmed = query.trim();
  return trimmed.length >= MIN_QUERY_LENGTH;
}

/**
 * Get filter label for display
 * @param filterType - Type of filter
 * @param value - Filter value
 * @returns Human-readable label
 */
export function getFilterLabel(
  filterType: 'genre' | 'country' | 'year',
  value: number | string | null
): string {
  if (value === null) {
    switch (filterType) {
      case 'genre':
        return 'All Genres';
      case 'country':
        return 'All Countries';
      case 'year':
        return 'All Years';
    }
  }

  switch (filterType) {
    case 'genre':
      return SEARCH_GENRE_OPTIONS.find((g) => g.id === value)?.name || 'Unknown';
    case 'country':
      return SEARCH_COUNTRY_OPTIONS.find((c) => c.code === value)?.name || 'Unknown';
    case 'year':
      return String(value);
  }
}
