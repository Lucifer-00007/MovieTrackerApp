/**
 * Search Results Component
 * Displays search results with loading and empty states
 * 
 * Requirements: 6.2, 6.6
 */

import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS } from '@/constants/colors';
import { BLURHASH_PLACEHOLDER } from '@/constants/images';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { getImageUrl } from '@/services/api';
import type { SearchResults, SearchFilters } from '@/types/user';
import type { MediaItem } from '@/types/media';

/** Placeholder image for mock data mode */
const PLACEHOLDER_IMAGE = require('@/assets/images/placeholder-poster.png');

/** Empty search results */
export const EMPTY_SEARCH_RESULTS: SearchResults = {
  movies: [],
  tvShows: [],
  totalResults: 0,
  page: 1,
  totalPages: 0,
};

interface MediaCardProps {
  item: MediaItem;
  onPress: () => void;
}

function MediaCard({ item, onPress }: MediaCardProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const tintColor = useThemeColor({}, 'tint');

  const posterUrl = getImageUrl(item.posterPath, 'w342');
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
  const showRating = item.voteAverage !== null && item.voteAverage > 0;
  const hasOverview = item.overview && item.overview.length > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${year ? `, ${year}` : ''}${showRating ? `, Rating ${item.voteAverage?.toFixed(1)}` : ''}`}
      style={({ pressed }) => [
        styles.mediaCard,
        {
          backgroundColor: cardBackground,
          borderColor,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Poster with gradient overlay */}
      <View style={styles.posterContainer}>
        {posterUrl ? (
          <Image
            source={posterUrl === 'placeholder' ? PLACEHOLDER_IMAGE : { uri: posterUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.posterPlaceholder, { backgroundColor: borderColor }]}>
            <Ionicons 
              name={item.mediaType === 'movie' ? 'film-outline' : 'tv-outline'} 
              size={32} 
              color={textSecondary} 
            />
          </View>
        )}
        
        {/* Rating badge on poster */}
        {showRating ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color={SOLID_COLORS.GOLD} />
            <Text style={styles.ratingBadgeText}>
              {item.voteAverage?.toFixed(1)}
            </Text>
          </View>
        ) : null}

        {/* Media type badge */}
        <View style={[styles.typeBadge, { backgroundColor: tintColor }]}>
          <Text style={styles.typeBadgeText}>
            {item.mediaType === 'movie' ? 'Movie' : 'Series'}
          </Text>
        </View>
      </View>

      {/* Content Info */}
      <View style={styles.contentInfo}>
        <Text
          style={[styles.title, { color: textColor }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        
        {/* Year and metadata row */}
        <View style={styles.metaRow}>
          {year !== null && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={textSecondary} />
              <Text style={[styles.metaText, { color: textSecondary }]}>{year}</Text>
            </View>
          )}
          {item.voteCount > 0 ? (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={12} color={textSecondary} />
              <Text style={[styles.metaText, { color: textSecondary }]}>
                {item.voteCount.toLocaleString()} votes
              </Text>
            </View>
          ) : null}
        </View>

        {/* Overview */}
        {hasOverview ? (
          <Text
            style={[styles.overview, { color: textSecondary }]}
            numberOfLines={3}
          >
            {item.overview}
          </Text>
        ) : null}

        {/* Action hint */}
        <View style={styles.actionRow}>
          <Text style={[styles.actionText, { color: tintColor }]}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={tintColor} />
        </View>
      </View>
    </Pressable>
  );
}

interface ResultSectionProps {
  title: string;
  items: MediaItem[];
  onItemPress: (item: MediaItem) => void;
  icon: keyof typeof Ionicons.glyphMap;
}

function ResultSection({ title, items, onItemPress, icon }: ResultSectionProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={20} color={tintColor} />
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.sectionCount, { color: textSecondary }]}>
          {items.length} found
        </Text>
      </View>
      
      <View style={styles.sectionContent}>
        {items.map((item) => (
          <MediaCard
            key={`${item.mediaType}-${item.id}`}
            item={item}
            onPress={() => onItemPress(item)}
          />
        ))}
      </View>
    </View>
  );
}

function LoadingSkeleton() {
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  
  return (
    <View style={styles.loadingContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View 
          key={index} 
          style={[styles.skeletonCard, { backgroundColor: cardBackground, borderColor }]}
        >
          <Skeleton width={100} height={150} borderRadius={BorderRadius.md} />
          <View style={styles.skeletonContent}>
            <Skeleton width={180} height={18} style={{ marginBottom: 8 }} />
            <Skeleton width={100} height={14} style={{ marginBottom: 12 }} />
            <Skeleton width={200} height={12} style={{ marginBottom: 4 }} />
            <Skeleton width={180} height={12} style={{ marginBottom: 4 }} />
            <Skeleton width={140} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface SearchResultsComponentProps {
  query: string;
  results: SearchResults | undefined;
  filters: SearchFilters;
  isLoading: boolean;
  isFetching: boolean;
}

export function SearchResultsComponent({ 
  query, 
  results, 
  filters, 
  isLoading, 
  isFetching 
}: SearchResultsComponentProps) {
  const router = useRouter();
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleItemPress = (item: MediaItem) => {
    const route = item.mediaType === 'movie' ? '/movie/[id]' : '/web-series/[id]';
    router.push({
      pathname: route,
      params: { id: item.id.toString() },
    });
  };

  // Apply filters to results
  const filteredResults = results ? applySearchFilters(results, filters) : EMPTY_SEARCH_RESULTS;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!query.trim()) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="Start Searching"
          message="Enter a movie or TV show name to find content"
          icon="search"
          suggestions={[
            'Try "Avengers" for action movies',
            'Search "Breaking Bad" for TV series',
            'Use filters to narrow results',
          ]}
        />
      </View>
    );
  }

  if (filteredResults.totalResults === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No Results Found"
          message={`No content found for "${query}"`}
          icon="search"
          suggestions={[
            'Check your spelling',
            'Try different keywords',
            'Remove some filters',
          ]}
        />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {isFetching ? (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color={textSecondary} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            Updating results...
          </Text>
        </View>
      ) : null}

      {/* Results summary */}
      <View style={styles.resultsSummary}>
        <Text style={[styles.summaryText, { color: textSecondary }]}>
          Found {filteredResults.totalResults} results for "{query}"
        </Text>
      </View>

      <ResultSection
        title="Movies"
        icon="film-outline"
        items={filteredResults.movies}
        onItemPress={handleItemPress}
      />

      <ResultSection
        title="TV Shows"
        icon="tv-outline"
        items={filteredResults.tvShows}
        onItemPress={handleItemPress}
      />

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

/**
 * Apply search filters to results
 */
export function applySearchFilters(results: SearchResults, filters: SearchFilters): SearchResults {
  const filterItems = (items: MediaItem[]) => {
    return items.filter(item => {
      // Genre filter
      if (filters.genre && !item.genreIds.includes(filters.genre)) {
        return false;
      }

      // Year range filter
      if (item.releaseDate) {
        const itemYear = new Date(item.releaseDate).getFullYear();
        if (filters.yearFrom && itemYear < filters.yearFrom) {
          return false;
        }
        if (filters.yearTo && itemYear > filters.yearTo) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredMovies = filterItems(results.movies);
  const filteredTvShows = filterItems(results.tvShows);

  return {
    movies: filteredMovies,
    tvShows: filteredTvShows,
    totalResults: filteredMovies.length + filteredTvShows.length,
    page: results.page,
    totalPages: results.totalPages,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  loadingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  resultsSummary: {
    marginBottom: Spacing.md,
  },
  summaryText: {
    fontSize: Typography.sizes.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  sectionCount: {
    fontSize: Typography.sizes.sm,
  },
  sectionContent: {
    gap: Spacing.md,
  },
  mediaCard: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  posterContainer: {
    width: 100,
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
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
  ratingBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OVERLAY_COLORS.BLACK_70,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  ratingBadgeText: {
    color: SOLID_COLORS.WHITE,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  typeBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    color: SOLID_COLORS.WHITE,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
  },
  contentInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.md * 1.3,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
  },
  overview: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * 1.5,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});