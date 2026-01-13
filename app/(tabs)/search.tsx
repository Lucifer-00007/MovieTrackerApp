/**
 * Search Screen
 * Provides search functionality with instant suggestions and filtering
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { useThemeColor } from '@/hooks/use-theme-color';
import { 
  SearchHeader,
  SearchFiltersComponent,
  SearchResultsComponent,
  type FilterType,
  DEFAULT_SEARCH_FILTERS,
  SEARCH_DEBOUNCE_MS,
  isValidSearchQuery,
  cleanSearchQuery,
} from '@/components/search';
import { searchMulti } from '@/services/api';
import { logSearchQuery } from '@/services/analytics';
import type { SearchFilters as SearchFiltersType, SearchResults as SearchResultsType } from '@/types/user';

export default function SearchScreen() {
  const backgroundColor = useThemeColor({}, 'background');

  // Search state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<SearchFiltersType>(DEFAULT_SEARCH_FILTERS);
  const [activeDropdown, setActiveDropdown] = useState<FilterType>(null);
  
  // Refs
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(cleanSearchQuery(query));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Search query
  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useQuery<SearchResultsType>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchMulti(debouncedQuery, 1),
    enabled: isValidSearchQuery(debouncedQuery),
    staleTime: 5 * 60 * 1000,
  });

  // Log analytics when search completes
  useEffect(() => {
    if (searchResults && debouncedQuery) {
      logSearchQuery(debouncedQuery, searchResults.totalResults);
    }
  }, [searchResults, debouncedQuery]);

  // Handlers
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setFilters(DEFAULT_SEARCH_FILTERS);
    setActiveDropdown(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters: SearchFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handleDropdownToggle = useCallback((type: FilterType) => {
    setActiveDropdown(current => current === type ? null : type);
    if (type !== null) {
      Keyboard.dismiss();
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <SearchHeader
        query={query}
        onQueryChange={handleQueryChange}
        onClear={handleClear}
      />

      <SearchFiltersComponent
        filters={filters}
        activeDropdown={activeDropdown}
        onFiltersChange={handleFiltersChange}
        onDropdownToggle={handleDropdownToggle}
      />

      <SearchResultsComponent
        query={debouncedQuery}
        results={searchResults}
        filters={filters}
        isLoading={isLoading}
        isFetching={isFetching}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});