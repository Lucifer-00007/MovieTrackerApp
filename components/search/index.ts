/**
 * Search Components Index
 * Exports all search-related components and utilities
 */

// Components
export { SearchHeader } from './SearchHeader';
export { SearchFiltersComponent, type FilterType } from './SearchFilters';
export { SearchResultsComponent, applySearchFilters, EMPTY_SEARCH_RESULTS } from './SearchResults';

// Constants from SearchFilters
export { 
  SEARCH_GENRE_OPTIONS, 
  SEARCH_COUNTRY_OPTIONS, 
  SEARCH_YEAR_OPTIONS,
  DEFAULT_SEARCH_FILTERS 
} from './SearchFilters';

// Utilities
export {
  SEARCH_DEBOUNCE_MS,
  isValidSearchQuery,
  hasActiveFilters,
  getFilterLabel,
  getSearchSuggestions,
  formatResultCount,
  cleanSearchQuery,
} from './search-utils';