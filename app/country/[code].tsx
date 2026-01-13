/**
 * Country Hub Screen
 * Displays ranked content list for a specific country with filtering
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 17.2
 */

import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SUPPORTED_COUNTRIES, type TrendingItem } from '@/types/media';
import { discoverByCountry, getImageUrl } from '@/services/api';

/** Placeholder image for mock data mode */
const PLACEHOLDER_IMAGE = require('@/assets/images/placeholder-poster.png');

/** Content type filter options */
export type ContentTypeFilter = 'all' | 'movie' | 'tv';

/** Filter state interface */
export interface CountryHubFilters {
  contentType: ContentTypeFilter;
  genre: number | null;
  year: number | null;
}

/** Genre options for filtering */
const GENRE_OPTIONS = [
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

/** Year options for filtering */
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: null, label: 'All Years' },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
  })),
];

/** Content type filter options */
const CONTENT_TYPE_OPTIONS: { value: ContentTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'Series' },
];

/** Props for filter chip component */
interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

/** Filter chip component */
function FilterChip({ label, isSelected, onPress }: FilterChipProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: isSelected ? tintColor : backgroundColor,
          borderColor: isSelected ? tintColor : borderColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: isSelected ? '#FFFFFF' : textColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Props for rank badge component */
interface RankBadgeProps {
  rank: number;
}

/** Rank badge component for top 10 items */
function RankBadge({ rank }: RankBadgeProps) {
  const tintColor = useThemeColor({}, 'tint');

  if (rank > 10) return null;

  return (
    <View
      style={[styles.rankBadge, { backgroundColor: tintColor }]}
      accessibilityLabel={`Rank ${rank}`}
    >
      <Text style={styles.rankBadgeText}>#{rank}</Text>
    </View>
  );
}

/** Props for content item component */
interface ContentItemProps {
  item: TrendingItem;
  onPress: () => void;
}

/** Content item component */
function ContentItem({ item, onPress }: ContentItemProps) {
  const cardBackground = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const ratingBadgeColor = useThemeColor({}, 'ratingBadge');
  const ratingTextColor = useThemeColor({}, 'ratingText');

  const posterUrl = getImageUrl(item.posterPath, 'w185');
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
  const showRating = item.voteAverage !== null && item.voteAverage > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${year ? `, ${year}` : ''}${showRating ? `, Rating ${item.voteAverage?.toFixed(1)}` : ''}`}
      style={({ pressed }) => [
        styles.contentItem,
        {
          backgroundColor: cardBackground,
          borderColor: cardBorder,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Rank Badge */}
      <RankBadge rank={item.rank} />

      {/* Poster */}
      <View style={styles.posterContainer}>
        {posterUrl ? (
          <Image
            source={posterUrl === 'placeholder' ? PLACEHOLDER_IMAGE : { uri: posterUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.posterPlaceholder, { backgroundColor: cardBorder }]}>
            <Text style={[styles.posterPlaceholderText, { color: textSecondary }]}>
              {item.title.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Content Info */}
      <View style={styles.contentInfo}>
        <Text
          style={[styles.contentTitle, { color: textColor }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={styles.contentMeta}>
          {year && (
            <Text style={[styles.contentYear, { color: textSecondary }]}>
              {year}
            </Text>
          )}
          <Text style={[styles.contentType, { color: textSecondary }]}>
            {item.mediaType === 'movie' ? 'Movie' : 'Series'}
          </Text>
        </View>
        {showRating && (
          <View style={[styles.ratingBadge, { backgroundColor: ratingBadgeColor }]}>
            <Text style={[styles.ratingText, { color: ratingTextColor }]}>
              ★ {item.voteAverage?.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function CountryHubScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];
  const tintColor = useThemeColor({}, 'tint');

  // Find country config
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === code);

  // Filter state
  const [filters, setFilters] = useState<CountryHubFilters>({
    contentType: 'all',
    genre: null,
    year: null,
  });

  // Dropdown visibility state
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Fetch movies for country
  const {
    data: moviesData,
    isLoading: isLoadingMovies,
    error: moviesError,
    refetch: refetchMovies,
  } = useQuery({
    queryKey: ['discover', 'movie', code, filters.genre, filters.year],
    queryFn: () =>
      discoverByCountry('movie', code || 'US', {
        genre: filters.genre ?? undefined,
        year: filters.year ?? undefined,
      }),
    enabled: !!code && (filters.contentType === 'all' || filters.contentType === 'movie'),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch TV shows for country
  const {
    data: tvData,
    isLoading: isLoadingTv,
    error: tvError,
    refetch: refetchTv,
  } = useQuery({
    queryKey: ['discover', 'tv', code, filters.genre, filters.year],
    queryFn: () =>
      discoverByCountry('tv', code || 'US', {
        genre: filters.genre ?? undefined,
        year: filters.year ?? undefined,
      }),
    enabled: !!code && (filters.contentType === 'all' || filters.contentType === 'tv'),
    staleTime: 5 * 60 * 1000,
  });

  // Derived state
  const isLoading = isLoadingMovies || isLoadingTv;
  const hasError = moviesError || tvError;

  // Combined and filtered content
  const content: TrendingItem[] = useMemo(() => {
    let items: TrendingItem[] = [];

    if (filters.contentType === 'all') {
      // Combine movies and TV, interleave by rank
      const movies = moviesData?.items || [];
      const tv = tvData?.items || [];
      
      // Merge and sort by popularity (rank)
      items = [...movies, ...tv].sort((a, b) => a.rank - b.rank);
      
      // Re-assign ranks after merge
      items = items.map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
    } else if (filters.contentType === 'movie') {
      items = moviesData?.items || [];
    } else {
      items = tvData?.items || [];
    }

    return items;
  }, [filters.contentType, moviesData, tvData]);

  // Check if filters result in empty content
  const hasActiveFilters = filters.genre !== null || filters.year !== null;
  const isEmptyWithFilters = content.length === 0 && hasActiveFilters && !isLoading;

  // Handlers
  const handleContentTypeChange = useCallback((type: ContentTypeFilter) => {
    setFilters((prev) => ({ ...prev, contentType: type }));
  }, []);

  const handleGenreChange = useCallback((genreId: number | null) => {
    setFilters((prev) => ({ ...prev, genre: genreId }));
    setShowGenreDropdown(false);
  }, []);

  const handleYearChange = useCallback((year: number | null) => {
    setFilters((prev) => ({ ...prev, year }));
    setShowYearDropdown(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      contentType: 'all',
      genre: null,
      year: null,
    });
  }, []);

  const handleItemPress = useCallback(
    (item: TrendingItem) => {
      if (item.mediaType === 'movie') {
        router.push(`/movie/${item.id}` as any);
      } else {
        router.push(`/tv/${item.id}` as any);
      }
    },
    []
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchMovies(), refetchTv()]);
  }, [refetchMovies, refetchTv]);

  const handleRetry = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Get selected filter labels
  const selectedGenreLabel = GENRE_OPTIONS.find((g) => g.id === filters.genre)?.name || 'All Genres';
  const selectedYearLabel = YEAR_OPTIONS.find((y) => y.value === filters.year)?.label || 'All Years';

  // Render content item
  const renderItem = useCallback(
    ({ item }: { item: TrendingItem }) => (
      <ContentItem item={item} onPress={() => handleItemPress(item)} />
    ),
    [handleItemPress]
  );

  // Country not found
  if (!country) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Country Hub</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState
          title="Country not found"
          message={`The country code "${code}" is not supported.`}
          onRetry={() => router.back()}
          retryText="Go Back"
          testID="country-not-found"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with country flag and name */}
      <View
        style={[styles.header, { borderBottomColor: colors.border }]}
        testID="country-hub-header"
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerFlag} accessibilityLabel={`${country.name} flag`}>
            {country.flag}
          </Text>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            accessibilityRole="header"
          >
            {country.name}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filters Section */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Content Type Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              isSelected={filters.contentType === option.value}
              onPress={() => handleContentTypeChange(option.value)}
            />
          ))}
        </ScrollView>

        {/* Genre and Year Filters */}
        <View style={styles.dropdownFiltersRow}>
          {/* Genre Dropdown */}
          <View style={styles.dropdownContainer}>
            <Pressable
              onPress={() => {
                setShowGenreDropdown(!showGenreDropdown);
                setShowYearDropdown(false);
              }}
              style={[
                styles.dropdownButton,
                {
                  backgroundColor: colors.background,
                  borderColor: filters.genre !== null ? tintColor : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Genre filter: ${selectedGenreLabel}`}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  { color: filters.genre !== null ? tintColor : colors.text },
                ]}
              >
                {selectedGenreLabel}
              </Text>
              <IconSymbol
                name={showGenreDropdown ? 'chevron.up' : 'chevron.down'}
                size={16}
                color={filters.genre !== null ? tintColor : colors.textSecondary}
              />
            </Pressable>
            {showGenreDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {GENRE_OPTIONS.map((genre) => (
                    <Pressable
                      key={genre.id ?? 'all'}
                      onPress={() => handleGenreChange(genre.id)}
                      style={[
                        styles.dropdownItem,
                        filters.genre === genre.id && { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: filters.genre === genre.id ? tintColor : colors.text },
                        ]}
                      >
                        {genre.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Year Dropdown */}
          <View style={styles.dropdownContainer}>
            <Pressable
              onPress={() => {
                setShowYearDropdown(!showYearDropdown);
                setShowGenreDropdown(false);
              }}
              style={[
                styles.dropdownButton,
                {
                  backgroundColor: colors.background,
                  borderColor: filters.year !== null ? tintColor : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Year filter: ${selectedYearLabel}`}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  { color: filters.year !== null ? tintColor : colors.text },
                ]}
              >
                {selectedYearLabel}
              </Text>
              <IconSymbol
                name={showYearDropdown ? 'chevron.up' : 'chevron.down'}
                size={16}
                color={filters.year !== null ? tintColor : colors.textSecondary}
              />
            </Pressable>
            {showYearDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {YEAR_OPTIONS.map((year) => (
                    <Pressable
                      key={year.value ?? 'all'}
                      onPress={() => handleYearChange(year.value)}
                      style={[
                        styles.dropdownItem,
                        filters.year === year.value && { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: filters.year === year.value ? tintColor : colors.text },
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
        </View>
      </View>

      {/* Content */}
      {hasError && !isLoading ? (
        <ErrorState
          title="Unable to load content"
          message="Please check your connection and try again."
          onRetry={handleRetry}
          testID="country-hub-error"
        />
      ) : isLoading && content.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Skeleton variant="row" count={4} />
          <Skeleton variant="row" count={4} />
        </View>
      ) : isEmptyWithFilters ? (
        <EmptyState
          title="No results found"
          message="Try adjusting your filters to find more content."
          icon="filter-outline"
          suggestions={[
            'Try a different genre',
            'Select a different year',
            'Change the content type',
          ]}
          actionText="Clear Filters"
          onAction={handleClearFilters}
          testID="country-hub-empty"
        />
      ) : (
        <FlatList
          data={content}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.mediaType}-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          testID="country-hub-content-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerFlag: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  headerSpacer: {
    width: 44,
  },
  filtersContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  dropdownFiltersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 44,
  },
  dropdownButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: {
    maxHeight: 200,
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
  loadingContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  contentItem: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    zIndex: 1,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  posterContainer: {
    width: 100,
    height: 150,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholderText: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  contentInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  contentTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  contentMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contentYear: {
    fontSize: Typography.sizes.sm,
  },
  contentType: {
    fontSize: Typography.sizes.sm,
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
});
