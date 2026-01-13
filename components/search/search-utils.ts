/**
 * Search Utilities
 * Helper functions for search functionality
 * 
 * Requirements: 6.1, 6.3, 6.4
 */

import type { SearchFilters } from '@/types/user';

/** Search debounce delay in milliseconds */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Check if search query is valid for API call
 */
export function isValidSearchQuery(query: string): boolean {
  return query.trim().length >= 2;
}

/**
 * Check if any search filters are active
 */
export function hasActiveFilters(filters: SearchFilters): boolean {
  return filters.genre !== null || 
         filters.country !== null || 
         filters.year !== null;
}

/**
 * Get filter label for display
 */
export function getFilterLabel(filters: SearchFilters): string {
  const activeFilters = [];
  
  if (filters.genre) activeFilters.push('Genre');
  if (filters.country) activeFilters.push('Country');
  if (filters.year) activeFilters.push('Year');
  
  if (activeFilters.length === 0) return 'All';
  if (activeFilters.length === 1) return activeFilters[0];
  return `${activeFilters.length} filters`;
}

/**
 * Get search suggestions based on query
 */
export function getSearchSuggestions(query: string): string[] {
  const suggestions = [
    'Avengers',
    'Breaking Bad',
    'The Dark Knight',
    'Game of Thrones',
    'Inception',
    'Stranger Things',
    'The Godfather',
    'Friends',
    'Pulp Fiction',
    'The Office',
  ];

  if (!query.trim()) return suggestions.slice(0, 5);

  const filtered = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.slice(0, 5);
}

/**
 * Format search result count
 */
export function formatResultCount(count: number): string {
  if (count === 0) return 'No results';
  if (count === 1) return '1 result';
  return `${count.toLocaleString()} results`;
}

/**
 * Clean search query for API
 */
export function cleanSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}