/**
 * Country Content List Component
 * Displays ranked content list with infinite scroll
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
import { useThemeColor } from '@/hooks/use-theme-color';
import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS } from '@/constants/colors';
import { COMPONENT_TEST_IDS } from '@/constants/test-ids';
import { DIMENSIONS } from '@/constants/layout';
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
  const colorScheme = useEffectiveColorScheme();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');

  const handlePress = useCallback(() => {
    const route = item.mediaType === 'movie' ? '/movie/[id]' : '/tv/[id]';
    router.push({
      pathname: route,
      params: { id: item.id.toString() },
    });
  }, [item.id, item.mediaType]);

  const posterUrl = getImageUrl(item.posterPath, 'w342');
  const imageSource = posterUrl ? { uri: posterUrl } : PLACEHOLDER_IMAGE;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.title}`}
      testID={`country-hub-content-item-${item.id}`}
      style={({ pressed }) => [
        styles.contentItem,
        {
          backgroundColor,
          borderColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Rank Badge */}
      <View style={[styles.rankBadge, { backgroundColor: Colors.light.tint }]}>
        <Text style={[styles.rankText, { color: Colors.light.background }]}>
          #{item.rank}
        </Text>
      </View>

      {/* Poster */}
      <Image
        source={imageSource}
        style={styles.poster}
        contentFit="cover"
        transition={200}
        placeholder={colorScheme === 'dark' ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary}
      />

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
            <IconSymbol
              name={item.mediaType === 'movie' ? 'film' : 'tv'}
              size={14}
              color={textColor}
              style={{ opacity: 0.7 }}
            />
            <Text style={[styles.typeText, { color: textColor, opacity: 0.7 }]}>
              {item.mediaType === 'movie' ? 'Movie' : 'Series'}
            </Text>
          </View>
          
          {item.releaseDate && (
            <Text style={[styles.yearText, { color: textColor, opacity: 0.7 }]}>
              {new Date(item.releaseDate).getFullYear()}
            </Text>
          )}
        </View>

        {item.voteAverage && (
          <View style={styles.ratingContainer}>
            <IconSymbol
              name="star.fill"
              size={14}
              color={SOLID_COLORS.GOLD}
            />
            <Text style={[styles.ratingText, { color: textColor }]}>
              {item.voteAverage.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

/** Loading skeleton component */
function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <Skeleton width={24} height={24} style={styles.skeletonRank} />
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

/** Footer loading component */
function FooterLoading() {
  return (
    <View style={styles.footerLoading}>
      <Skeleton width={60} height={20} />
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
        iconName="film"
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
          tintColor={Colors.light.tint}
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
    gap: Spacing.sm,
  },
  contentItem: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  poster: {
    width: DIMENSIONS.POSTER_CARD_WIDTH,
    height: DIMENSIONS.POSTER_CARD_HEIGHT,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
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
  skeletonContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  skeletonItem: {
    flexDirection: 'row',
    padding: Spacing.sm,
    position: 'relative',
  },
  skeletonRank: {
    position: 'absolute',
    top: 4,
    left: 4,
    borderRadius: 12,
  },
  skeletonPoster: {
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  footerLoading: {
    padding: Spacing.md,
    alignItems: 'center',
  },
});