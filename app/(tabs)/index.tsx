/**
 * Home Screen - Trending Feed
 * Displays hero carousel, trending content rows, recently viewed, and recommendations
 * 
 * Requirements: 1.1, 1.4, 1.6, 14.1, 14.2, 14.4
 */

import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useThemeColor } from '@/hooks/use-theme-color';
import { HeroCarousel } from '@/components/media/HeroCarousel';
import { ContentRow } from '@/components/media/ContentRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spacing } from '@/constants/theme';
import { getTrending, getRecommendations } from '@/services/api/tmdb';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { useWatchlistStore } from '@/stores/watchlistStore';
import type { TrendingItem, MediaItem } from '@/types/media';

/** Number of hero items to display */
const HERO_ITEMS_COUNT = 5;

/** Convert recently viewed items to MediaItem format */
function recentlyViewedToMediaItems(
  items: { id: number; mediaType: 'movie' | 'tv'; title: string; posterPath: string | null }[]
): MediaItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    originalTitle: item.title,
    posterPath: item.posterPath,
    backdropPath: null,
    overview: '',
    releaseDate: '',
    voteAverage: null,
    voteCount: 0,
    mediaType: item.mediaType,
    genreIds: [],
  }));
}

export default function HomeScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');

  // Stores
  const {
    items: recentlyViewedItems,
    hasItems: hasRecentlyViewed,
    loadRecentlyViewed,
  } = useRecentlyViewedStore();

  const {
    items: watchlistItems,
    loadWatchlist,
  } = useWatchlistStore();

  // Load stores on mount
  useEffect(() => {
    loadRecentlyViewed();
    loadWatchlist();
  }, [loadRecentlyViewed, loadWatchlist]);

  // Fetch trending movies
  const {
    data: trendingMoviesData,
    isLoading: isLoadingMovies,
    error: moviesError,
    refetch: refetchMovies,
  } = useQuery({
    queryKey: ['trending', 'movie', 'week'],
    queryFn: () => getTrending('movie', 'week'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch trending TV shows
  const {
    data: trendingTvData,
    isLoading: isLoadingTv,
    error: tvError,
    refetch: refetchTv,
  } = useQuery({
    queryKey: ['trending', 'tv', 'week'],
    queryFn: () => getTrending('tv', 'week'),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch trending all (for hero)
  const {
    data: trendingAllData,
    isLoading: isLoadingAll,
    error: allError,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['trending', 'all', 'week'],
    queryFn: () => getTrending('all', 'week'),
    staleTime: 5 * 60 * 1000,
  });

  // Get first watchlist item for recommendations (if any)
  const firstWatchlistItem = watchlistItems[0];

  // Fetch recommendations based on watchlist
  const {
    data: recommendationsData,
  } = useQuery({
    queryKey: ['recommendations', firstWatchlistItem?.mediaType, firstWatchlistItem?.id],
    queryFn: () =>
      firstWatchlistItem
        ? getRecommendations(firstWatchlistItem.mediaType, firstWatchlistItem.id)
        : Promise.resolve({ items: [], totalPages: 0 }),
    enabled: !!firstWatchlistItem,
    staleTime: 5 * 60 * 1000,
  });

  // Derived state
  const isLoading = isLoadingMovies || isLoadingTv || isLoadingAll;
  const hasError = moviesError || tvError || allError;
  const isRefreshing = false;

  // Hero items (top 5 trending)
  const heroItems: TrendingItem[] = useMemo(() => {
    return (trendingAllData?.items || []).slice(0, HERO_ITEMS_COUNT);
  }, [trendingAllData]);

  // Trending movies
  const trendingMovies: MediaItem[] = useMemo(() => {
    return trendingMoviesData?.items || [];
  }, [trendingMoviesData]);

  // Trending TV shows
  const trendingTv: MediaItem[] = useMemo(() => {
    return trendingTvData?.items || [];
  }, [trendingTvData]);

  // Recently viewed as MediaItems
  const recentlyViewed: MediaItem[] = useMemo(() => {
    return recentlyViewedToMediaItems(recentlyViewedItems);
  }, [recentlyViewedItems]);

  // Recommendations
  const recommendations: MediaItem[] = useMemo(() => {
    return recommendationsData?.items || [];
  }, [recommendationsData]);

  // Check if we should show recommendations row
  const showRecommendations = watchlistItems.length > 0 && recommendations.length > 0;

  // Check if we should show recently viewed row
  const showRecentlyViewed = hasRecentlyViewed();

  // Navigation handlers
  const handleItemPress = useCallback(
    (id: number, mediaType: 'movie' | 'tv') => {
      if (mediaType === 'movie') {
        router.push(`/movie/${id}` as any);
      } else {
        router.push(`/tv/${id}` as any);
      }
    },
    [router]
  );

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchAll(), refetchMovies(), refetchTv()]);
  }, [refetchAll, refetchMovies, refetchTv]);

  // Retry handler for errors
  const handleRetry = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Show error state if all requests failed
  if (hasError && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ErrorState
          title="Unable to load content"
          message="Please check your connection and try again."
          onRetry={handleRetry}
          testID="home-error-state"
        />
      </View>
    );
  }

  // Show loading skeleton
  if (isLoading && !trendingAllData) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Skeleton variant="hero" testID="home-hero-skeleton" />
          <Skeleton variant="row" count={4} testID="home-row-skeleton-1" />
          <Skeleton variant="row" count={4} testID="home-row-skeleton-2" />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]} testID="home-screen">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={useThemeColor({}, 'tint')}
          />
        }
      >
        {/* Hero Carousel - Top 5 Trending */}
        {heroItems.length > 0 && (
          <HeroCarousel
            items={heroItems}
            onItemPress={handleItemPress}
            testID="home-hero-carousel"
          />
        )}

        {/* Recently Viewed Row - Conditional on non-empty */}
        {showRecentlyViewed && (
          <ContentRow
            title="Recently Viewed"
            items={recentlyViewed}
            onItemPress={handleItemPress}
            testID="home-recently-viewed-row"
          />
        )}

        {/* Recommendations Row - Conditional on watchlist */}
        {showRecommendations && (
          <ContentRow
            title="Recommended for You"
            items={recommendations}
            onItemPress={handleItemPress}
            testID="home-recommendations-row"
          />
        )}

        {/* Trending Movies Row */}
        {trendingMovies.length > 0 && (
          <ContentRow
            title="Trending Movies"
            items={trendingMovies}
            onItemPress={handleItemPress}
            testID="home-trending-movies-row"
          />
        )}

        {/* Trending TV Shows Row */}
        {trendingTv.length > 0 && (
          <ContentRow
            title="Trending TV Shows"
            items={trendingTv}
            onItemPress={handleItemPress}
            testID="home-trending-tv-row"
          />
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
