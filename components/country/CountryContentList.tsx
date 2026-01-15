/**
 * Country Content List Component
 * Displays ranked content list with infinite scroll and enhanced UI
 * 
 * Requirements: 3.1, 3.2, 3.3, 17.2
 */

import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS } from '@/constants/colors';
import { COMPONENT_TEST_IDS } from '@/constants/test-ids';
import { BLURHASH_PLACEHOLDER } from '@/constants/images';
import { getImageUrl } from '@/services/api';
import type { TrendingItem } from '@/types/media';

/** Placeholder image for mock data mode */
const PLACEHOLDER_IMAGE = require('@/assets/images/placeholder-poster.png');

interface CountryContentListProps {
  data: TrendingItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isRefreshing: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

/** Content item component */
interface ContentItemProps {
  item: TrendingItem;
  index: number;
}

function ContentItem({ item, index }: ContentItemProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  const tintColor = useThemeColor({}, 'tint');

  const handlePress = useCallback(() => {
    const route = item.mediaType === 'movie' ? '/movie/[id]' : '/web-series/[id]';
    router.push({
      pathname: route,
      params: { id: item.id.toString() },
    });
  }, [item.id, item.mediaType]);

  const posterUrl = getImageUrl(item.posterPath, 'w342');
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
  const hasRating = item.voteAverage && item.voteAverage > 0;

  // Get rank badge color based on position
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return tintColor;
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.title}, ranked #${item.rank}`}
      testID={`country-hub-content-item-${item.id}`}
      style={({ pressed }) => [
        styles.contentItem,
        {
          backgroundColor: cardBackground,
          borderColor,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Rank Badge */}
      <View style={[styles.rankBadge, { backgroundColor: getRankBadgeColor(item.rank) }]}>
        <Text style={styles.rankText}>#{item.rank}</Text>
      </View>

      {/* Poster Container */}
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

        {/* Media Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: tintColor }]}>
          <Ionicons
            name={item.mediaType === 'movie' ? 'film' : 'tv'}
            size={12}
            color={SOLID_COLORS.WHITE}
          />
        </View>

        {/* Rating Badge */}
        {hasRating ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color={SOLID_COLORS.GOLD} />
            <Text style={styles.ratingBadgeText}>
              {item.voteAverage?.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Content Info */}
      <View style={styles.contentInfo}>
        <Text
          style={[styles.title, { color: textColor }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        
        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          {year ? (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={textSecondary} />
              <Text style={[styles.metaText, { color: textSecondary }]}>{year}</Text>
            </View>
          ) : null}
          
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
        {item.overview ? (
          <Text
            style={[styles.overview, { color: textSecondary }]}
            numberOfLines={3}
          >
            {item.overview}
          </Text>
        ) : null}

        {/* Action Row */}
        <View style={styles.actionRow}>
          <Text style={[styles.actionText, { color: tintColor }]}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={tintColor} />
        </View>
      </View>
    </Pressable>
  );
}

/** Loading skeleton component */
function LoadingSkeleton() {
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');
  
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View 
          key={index} 
          style={[styles.skeletonItem, { backgroundColor: cardBackground, borderColor }]}
        >
          <Skeleton width={28} height={28} borderRadius={14} style={styles.skeletonRank} />
          <Skeleton width={100} height={150} borderRadius={BorderRadius.md} />
          <View style={styles.skeletonContent}>
            <Skeleton width={180} height={18} style={{ marginBottom: 8 }} />
            <Skeleton width={120} height={14} style={{ marginBottom: 12 }} />
            <Skeleton width={200} height={12} style={{ marginBottom: 4 }} />
            <Skeleton width={180} height={12} style={{ marginBottom: 4 }} />
            <Skeleton width={100} height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Footer loading component */
function FooterLoading() {
  const tintColor = useThemeColor({}, 'tint');
  
  return (
    <View style={styles.footerLoading}>
      <View style={styles.loadingRow}>
        <Ionicons name="refresh" size={16} color={tintColor} />
        <Text style={[styles.loadingText, { color: tintColor }]}>Loading more...</Text>
      </View>
    </View>
  );
}

export function CountryContentList({
  data,
  isLoading,
  isError,
  error,
  isRefreshing,
  hasNextPage,
  isFetchingNextPage,
  onRefresh,
  onLoadMore,
  onRetry,
}: CountryContentListProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const renderItem: ListRenderItem<TrendingItem> = useCallback(
    ({ item, index }) => <ContentItem item={item} index={index} />,
    []
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return <FooterLoading />;
    }
    return null;
  }, [isFetchingNextPage]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load content"
        message={error?.message || 'Something went wrong'}
        onRetry={onRetry}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No content found"
        message="Try adjusting your filters or check back later"
        icon="film"
      />
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => `${item.mediaType}-${item.id}`}
      contentContainerStyle={[styles.listContainer, { backgroundColor }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={tintColor}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      testID={COMPONENT_TEST_IDS.COUNTRY_HUB_CONTENT_LIST}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={6}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  contentItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    position: 'relative',
    gap: Spacing.md,
  },
  rankBadge: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankText: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
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
  typeBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
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
  metadataRow: {
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
  skeletonContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    position: 'relative',
    gap: Spacing.md,
  },
  skeletonRank: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  footerLoading: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  loadingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});