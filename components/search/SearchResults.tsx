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
import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS } from '@/constants/colors';
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
  const colorScheme = useEffectiveColorScheme();
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const posterUrl = getImageUrl(item.posterPath, 'w185');
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
  const showRating = item.voteAverage !== null && item.voteAverage > 0;

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
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Poster */}
      <View style={styles.posterContainer}>
        {posterUrl ? (
          <Image
            source={posterUrl === 'placeholder' ? PLACEHOLDER_IMAGE : { uri: posterUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={300}
            placeholder={colorScheme === 'dark' ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary}
          />
        ) : (
          <View style={[styles.posterPlaceholder, { backgroundColor: borderColor }]}>
            <Text style={[styles.posterPlaceholderText, { color: textSecondary }]}>
              {item.title.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Content Info */}
      <View style={styles.contentInfo}>
        <Text
          style={[styles.title, { color: textColor }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        
        <View style={styles.metadata}>
          <View style={styles.typeContainer}>
            <Ionicons
              name={item.mediaType === 'movie' ? 'film' : 'tv'}
              size={14}
              color={textSecondary}
            />
            <Text style={[styles.typeText, { color: textSecondary }]}>
              {item.mediaType === 'movie' ? 'Movie' : 'Series'}
            </Text>
          </View>
          
          {year && (
            <Text style={[styles.yearText, { color: textSecondary }]}>
              {year}
            </Text>
          )}
        </View>

        {showRating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={SOLID_COLORS.GOLD} />
            <Text style={[styles.ratingText, { color: textColor }]}>
              {item.voteAverage?.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

interface ResultSectionProps {
  title: string;
  items: MediaItem[];
  onItemPress: (item: MediaItem) => void;
}

function ResultSection({ title, items, onItemPress }: ResultSectionProps) {
  const textColor = useThemeColor({}, 'text');

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        {title} ({items.length})
      </Text>
      
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
  return (
    <View style={styles.loadingContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <Skeleton width={80} height={120} style={styles.skeletonPoster} />
          <View style={styles.skeletonContent}>
            <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={14} style={{ marginBottom: 4 }} />
            <Skeleton width="40%" height={14} />
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
    const route = item.mediaType === 'movie' ? '/movie/[id]' : '/tv/[id]';
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
          iconName="search"
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
          iconName="search"
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
      {isFetching && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color={textSecondary} />
          <Text style={[styles.loadingText, { color: textSecondary }]}>
            Searching...
          </Text>
        </View>
      )}

      <ResultSection
        title="Movies"
        items={filteredResults.movies}
        onItemPress={handleItemPress}
      />

      <ResultSection
        title="TV Shows"
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

      // Year filter
      if (filters.year && item.releaseDate) {
        const itemYear = new Date(item.releaseDate).getFullYear();
        if (itemYear !== filters.year) {
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
    gap: Spacing.sm,
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.md,
  },
  sectionContent: {
    gap: Spacing.sm,
  },
  mediaCard: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  posterContainer: {
    flexShrink: 0,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.sm,
  },
  posterPlaceholder: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholderText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  contentInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.tight,
    marginBottom: Spacing.xs,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  yearText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  skeletonPoster: {
    borderRadius: BorderRadius.sm,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});