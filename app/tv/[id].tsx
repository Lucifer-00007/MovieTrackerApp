/**
 * TV Series Detail Screen
 * Displays comprehensive TV series information with watchlist options
 * Enhanced with seasons, ratings, media info, and production details
 * 
 * Requirements: 4.2
 */

import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS, ComponentTokens } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  DetailHeader,
  Synopsis,
  CastCarousel,
  ProviderList,
  RecommendationsRow,
  QuickActions,
  MediaInfo,
  RatingsSection,
  GenreTags,
  ProductionInfo,
  SeasonsSection,
} from '@/components/detail';
import {
  getTvDetails,
  getTvCredits,
  getWatchProviders,
  getRecommendations,
  getTrailerKey,
} from '@/services/api';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import type { MediaDetails, CastMember, StreamingProvider, MediaItem, Genre } from '@/types/media';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function TvDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tvId = parseInt(id || '0', 10);
  
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  // State
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [providers, setProviders] = useState<StreamingProvider[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stores
  const { isInWatchlist, toggleItem } = useWatchlistStore();
  const { addItem: addToRecentlyViewed } = useRecentlyViewedStore();

  // Animation
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Check if in watchlist
  const inWatchlist = details ? isInWatchlist(details.id, 'tv') : false;

  // Fetch TV data
  const fetchTvData = useCallback(async (showRefresh = false) => {
    if (!tvId) return;

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Fetch all data in parallel
      const [tvDetails, tvCast, tvProviders, tvRecs, trailer] = await Promise.all([
        getTvDetails(tvId),
        getTvCredits(tvId).catch(() => []),
        getWatchProviders('tv', tvId, 'US').catch(() => []),
        getRecommendations('tv', tvId, 1).then(r => r.items).catch(() => []),
        getTrailerKey('tv', tvId).catch(() => null),
      ]);

      setDetails(tvDetails);
      setCast(tvCast);
      setProviders(tvProviders);
      setRecommendations(tvRecs);
      setTrailerKey(trailer);

      // Add to recently viewed
      addToRecentlyViewed({
        id: tvDetails.id,
        mediaType: 'tv',
        title: tvDetails.title,
        posterPath: tvDetails.posterPath,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load TV series details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tvId, addToRecentlyViewed]);

  // Initial fetch
  useEffect(() => {
    fetchTvData();
  }, [fetchTvData]);

  // Handle watchlist toggle
  const handleWatchlistToggle = useCallback(async () => {
    if (!details) return;
    
    await toggleItem({
      id: details.id,
      mediaType: 'tv',
      title: details.title,
      posterPath: details.posterPath,
    });
  }, [details, toggleItem]);

  // Handle play trailer
  const handlePlayTrailer = useCallback(() => {
    if (trailerKey) {
      router.push(`/trailer/${trailerKey}` as any);
    }
  }, [trailerKey]);

  // Handle recommendation press
  const handleRecommendationPress = useCallback((recId: number, mediaType: 'movie' | 'tv') => {
    if (mediaType === 'movie') {
      router.push(`/movie/${recId}` as any);
    } else {
      router.push(`/tv/${recId}` as any);
    }
  }, []);

  // Handle genre press
  const handleGenrePress = useCallback((genre: Genre) => {
    // Navigate to search with genre filter
    router.push(`/(tabs)/search?genre=${genre.id}` as any);
  }, []);

  // Handle season press
  const handleSeasonPress = useCallback((seasonNumber: number) => {
    // Could navigate to season detail or show episode list
    console.log(`Season ${seasonNumber} pressed`);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchTvData(true);
  }, [fetchTvData]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchTvData();
  }, [fetchTvData]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading TV series details...
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !details) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>TV Series Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState
          message={error || 'TV series not found'}
          onRetry={handleRetry}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={[styles.header, styles.absoluteHeader]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, styles.headerButton, { backgroundColor: OVERLAY_COLORS.BLACK_50 }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={24} color={SOLID_COLORS.WHITE} />
        </Pressable>
      </View>

      <AnimatedScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {/* Hero Header with Parallax */}
        <DetailHeader
          details={details}
          scrollY={scrollY}
          hasTrailer={!!trailerKey}
          onPlayPress={handlePlayTrailer}
          testID="tv-detail-header"
        />

        {/* Quick Actions Bar */}
        <QuickActions
          title={details.title}
          mediaType="tv"
          mediaId={details.id}
          isInWatchlist={inWatchlist}
          canDownload={providers.length > 0}
          onWatchlistPress={handleWatchlistToggle}
          testID="tv-quick-actions"
        />

        {/* Genre Tags */}
        <GenreTags
          genres={details.genres}
          onGenrePress={handleGenrePress}
          testID="tv-genres"
        />

        {/* Synopsis */}
        {details.overview && (
          <Synopsis
            overview={details.overview}
            testID="tv-synopsis"
          />
        )}

        {/* Ratings Section */}
        <RatingsSection
          voteAverage={details.voteAverage}
          voteCount={details.voteCount}
          testID="tv-ratings"
        />

        {/* Seasons Section (TV-specific) */}
        <SeasonsSection
          details={details}
          onSeasonPress={handleSeasonPress}
          testID="tv-seasons"
        />

        {/* Media Info Cards */}
        <MediaInfo
          details={details}
          testID="tv-info"
        />

        {/* Cast Carousel */}
        <CastCarousel
          cast={cast}
          testID="tv-cast"
        />

        {/* Streaming Providers */}
        <ProviderList
          providers={providers}
          testID="tv-providers"
        />

        {/* Production Details */}
        <ProductionInfo
          details={details}
          testID="tv-production"
        />

        {/* Recommendations */}
        <RecommendationsRow
          recommendations={recommendations}
          onItemPress={handleRecommendationPress}
          testID="tv-recommendations"
        />

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  absoluteHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 0,
    paddingTop: Spacing.xl,
  },
  backButton: {
    minWidth: ComponentTokens.touchTarget.min,
    minHeight: ComponentTokens.touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  headerSpacer: {
    width: ComponentTokens.touchTarget.min,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});
