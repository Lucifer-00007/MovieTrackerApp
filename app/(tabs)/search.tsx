/**
 * Search Screen
 * Provides search functionality with instant suggestions and filtering
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { MediaCard } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { searchMulti } from '@/services/api/tmdb';
import { logSearchQuery } from '@/services/analytics';
import type { MediaItem } from '@/types/media';
import type { SearchFilters, SearchResults } from '@/types/user';
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_GENRE_OPTIONS,
  SEARCH_COUNTRY_OPTIONS,
  SEARCH_YEAR_OPTIONS,
  DEFAULT_SEARCH_FILTERS,
  EMPTY_SEARCH_RESULTS,
  applySearchFilters,
  hasActiveFilters,
  getSearchSuggestions,
  isValidSearchQuery,
  getFilterLabel,
} from '@/components/search/search-utils';

/** Filter dropdown type */
type FilterType = 'genre' | 'country' | 'year' | null;

/** Props for filter chip component */
interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

/** Filter chip component */
function FilterChip({ label, isActive, onPress }: FilterChipProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${label}`}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: isActive ? tintColor : backgroundColor,
          borderColor: isActive ? tintColor : borderColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: isActive ? '#FFFFFF' : textColor },
        ]}
      >
        {label}
      </Text>
      <Ionicons
        name="chevron-down"
        size={14}
        color={isActive ? '#FFFFFF' : textColor}
        style={styles.filterChipIcon}
      />
    </Pressable>
  );
}

/** Props for result section component */
interface ResultSectionProps {
  title: string;
  items: MediaItem[];
  onItemPress: (id: number, mediaType: 'movie' | 'tv') => void;
  testID?: string;
}

/** Result section component */
function ResultSection({ title, items, onItemPress, testID }: ResultSectionProps) {
  const textColor = useThemeColor({}, 'text');

  if (items.length === 0) return null;

  return (
    <View style={styles.resultSection} testID={testID}>
      <Text
        style={[styles.sectionTitle, { color: textColor }]}
        accessibilityRole="header"
      >
        {title} ({items.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.resultRow}
      >
        {items.map((item) => (
          <View key={`${item.mediaType}-${item.id}`} style={styles.resultItem}>
            <MediaCard
              id={item.id}
              title={item.title}
              posterPath={item.posterPath}
              rating={item.voteAverage}
              ageRating={item.ageRating}
              variant="medium"
              onPress={() => onItemPress(item.id, item.mediaType)}
              testID={testID ? `${testID}-item-${item.id}` : undefined}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'card');

  // Search state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  const [activeDropdown, setActiveDropdown] = useState<FilterType>(null);
  
  // Refs
  const inputRef = useRef<TextInput>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
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
  } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchMulti(debouncedQuery),
    enabled: isValidSearchQuery(debouncedQuery),
    staleTime: 5 * 60 * 1000,
    onSuccess: (data) => {
      // Log analytics event when search completes
      if (isValidSearchQuery(debouncedQuery)) {
        const totalResults = (data?.movies?.length || 0) + (data?.tvShows?.length || 0);
        logSearchQuery(debouncedQuery, totalResults);
      }
    },
  });

  // Apply filters to results
  const filteredResults = useMemo<SearchResults>(() => {
    if (!searchResults) return EMPTY_SEARCH_RESULTS;
    return applySearchFilters(searchResults, filters);
  }, [searchResults, filters]);

  // Derived state
  const showResults = isValidSearchQuery(debouncedQuery) && !isLoading;
  const hasResults = filteredResults.movies.length > 0 || filteredResults.tvShows.length > 0;
  const showEmptyState = showResults && !hasResults && !isFetching;
  const showLoading = isLoading || (isFetching && !hasResults);
  const activeFiltersExist = hasActiveFilters(filters);

  // Handlers
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, []);

  const handleItemPress = useCallback(
    (id: number, mediaType: 'movie' | 'tv') => {
      Keyboard.dismiss();
      if (mediaType === 'movie') {
        router.push(`/movie/${id}` as any);
      } else {
        router.push(`/tv/${id}` as any);
      }
    },
    [router]
  );

  const handleFilterPress = useCallback((filterType: FilterType) => {
    setActiveDropdown((prev) => (prev === filterType ? null : filterType));
  }, []);

  const handleGenreSelect = useCallback((genreId: number | null) => {
    setFilters((prev) => ({ ...prev, genre: genreId }));
    setActiveDropdown(null);
  }, []);

  const handleCountrySelect = useCallback((countryCode: string | null) => {
    setFilters((prev) => ({ ...prev, country: countryCode }));
    setActiveDropdown(null);
  }, []);

  const handleYearSelect = useCallback((year: number | null) => {
    setFilters((prev) => ({ ...prev, yearFrom: year, yearTo: year }));
    setActiveDropdown(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_SEARCH_FILTERS);
    setActiveDropdown(null);
  }, []);

  const handleDismissDropdown = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  // Get filter labels
  const genreLabel = getFilterLabel('genre', filters.genre);
  const countryLabel = getFilterLabel('country', filters.country);
  const yearLabel = getFilterLabel('year', filters.yearFrom);

  // Suggestions for empty state
  const suggestions = useMemo(() => getSearchSuggestions(query), [query]);

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.background }]}
      onPress={handleDismissDropdown}
    >
      {/* Search Header */}
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: textColor }]}
          accessibilityRole="header"
        >
          Search
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: borderColor,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search movies and TV shows..."
            placeholderTextColor={textSecondary}
            value={query}
            onChangeText={handleQueryChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search input"
            accessibilityHint="Enter movie or TV show name to search"
            testID="search-input"
          />
          {query.length > 0 && (
            <Pressable
              onPress={handleClearQuery}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={textSecondary} />
            </Pressable>
          )}
          {isFetching && (
            <ActivityIndicator
              size="small"
              color={tintColor}
              style={styles.loadingIndicator}
            />
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <FilterChip
            label={genreLabel}
            isActive={filters.genre !== null}
            onPress={() => handleFilterPress('genre')}
          />
          <FilterChip
            label={countryLabel}
            isActive={filters.country !== null}
            onPress={() => handleFilterPress('country')}
          />
          <FilterChip
            label={yearLabel}
            isActive={filters.yearFrom !== null}
            onPress={() => handleFilterPress('year')}
          />
          {activeFiltersExist && (
            <Pressable
              onPress={handleClearFilters}
              accessibilityLabel="Clear all filters"
              accessibilityRole="button"
              style={[styles.clearFiltersButton, { borderColor }]}
            >
              <Ionicons name="close" size={16} color={textSecondary} />
              <Text style={[styles.clearFiltersText, { color: textSecondary }]}>
                Clear
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Filter Dropdowns */}
        {activeDropdown === 'genre' && (
          <View
            style={[
              styles.dropdown,
              { backgroundColor: cardBackground, borderColor },
            ]}
          >
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {SEARCH_GENRE_OPTIONS.map((genre) => (
                <Pressable
                  key={genre.id ?? 'all'}
                  onPress={() => handleGenreSelect(genre.id)}
                  style={[
                    styles.dropdownItem,
                    filters.genre === genre.id && {
                      backgroundColor: colors.backgroundSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      {
                        color:
                          filters.genre === genre.id ? tintColor : textColor,
                      },
                    ]}
                  >
                    {genre.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {activeDropdown === 'country' && (
          <View
            style={[
              styles.dropdown,
              { backgroundColor: cardBackground, borderColor },
            ]}
          >
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {SEARCH_COUNTRY_OPTIONS.map((country) => (
                <Pressable
                  key={country.code ?? 'all'}
                  onPress={() => handleCountrySelect(country.code)}
                  style={[
                    styles.dropdownItem,
                    filters.country === country.code && {
                      backgroundColor: colors.backgroundSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      {
                        color:
                          filters.country === country.code
                            ? tintColor
                            : textColor,
                      },
                    ]}
                  >
                    {country.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {activeDropdown === 'year' && (
          <View
            style={[
              styles.dropdown,
              { backgroundColor: cardBackground, borderColor },
            ]}
          >
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {SEARCH_YEAR_OPTIONS.map((year) => (
                <Pressable
                  key={year.value ?? 'all'}
                  onPress={() => handleYearSelect(year.value)}
                  style={[
                    styles.dropdownItem,
                    filters.yearFrom === year.value && {
                      backgroundColor: colors.backgroundSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      {
                        color:
                          filters.yearFrom === year.value
                            ? tintColor
                            : textColor,
                      },
                    ]}
                  >
                    {year.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content Area */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID="search-results-container"
      >
        {/* Initial State - No Query */}
        {!isValidSearchQuery(query) && !showLoading && (
          <View style={styles.initialState}>
            <Ionicons
              name="search-outline"
              size={64}
              color={textSecondary}
              style={styles.initialIcon}
            />
            <Text style={[styles.initialTitle, { color: textColor }]}>
              Find Movies & TV Shows
            </Text>
            <Text style={[styles.initialSubtitle, { color: textSecondary }]}>
              Search by title, actor, or keyword
            </Text>
          </View>
        )}

        {/* Loading State */}
        {showLoading && (
          <View style={styles.loadingContainer}>
            <Skeleton variant="row" count={3} />
            <Skeleton variant="row" count={3} />
          </View>
        )}

        {/* Results */}
        {showResults && hasResults && (
          <>
            <ResultSection
              title="Movies"
              items={filteredResults.movies}
              onItemPress={handleItemPress}
              testID="search-movies-section"
            />
            <ResultSection
              title="TV Shows"
              items={filteredResults.tvShows}
              onItemPress={handleItemPress}
              testID="search-tv-section"
            />
          </>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <EmptyState
            title="No results found"
            message={`We couldn't find anything for "${query}"`}
            icon="search-outline"
            suggestions={suggestions}
            actionText={activeFiltersExist ? 'Clear Filters' : undefined}
            onAction={activeFiltersExist ? handleClearFilters : undefined}
            testID="search-empty-state"
          />
        )}
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    paddingVertical: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginLeft: Spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 36,
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  filterChipIcon: {
    marginLeft: Spacing.xs,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 36,
    gap: Spacing.xs,
  },
  clearFiltersText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 250,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: Typography.sizes.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  initialState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  initialIcon: {
    marginBottom: Spacing.lg,
  },
  initialTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  initialSubtitle: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: Spacing.md,
  },
  resultSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  resultItem: {
    marginRight: Spacing.sm,
  },
});
