/**
 * Web Series Detail Screen
 * Displays comprehensive web series information with watchlist options
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
import { DetailPageSkeleton } from '@/components/ui/Skeleton';
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

export default function WebSeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const seriesId = parseInt(id || '0', 10);
  
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

  // Fetch web series data
  const fetchSeriesData = useCallback(async (showRefresh = false) => {
    if (!seriesId) return;

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Fetch all data in parallel
      const [seriesDetails, seriesCast, seriesProviders, seriesRecs, trailer] = await Promise.all([
        getTvDetails(seriesId),
        getTvCredits(seriesId).catch(() => []),
        getWatchProviders('tv', seriesId, 'US').catch(() => []),
        getRecommendations('tv', seriesId, 1).then(r => r.items).catch(() => []),
        getTrailerKey('tv', seriesId).catch(() => null),
      ]);

      setDetails(seriesDetails);
      setCast(seriesCast);
      setProviders(seriesProviders);
      setRecommendations(seriesRecs);
      setTrailerKey(trailer);

      // Add to recently viewed
      addToRecentlyViewed({
        id: seriesDetails.id,
        mediaType: 'tv',
        title: seriesDetails.title,
        posterPath: seriesDetails.posterPath,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load web series details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [seriesId, addToRecentlyViewed]);

  // Initial fetch
  useEffect(() => {
    fetchSeriesData();
  }, [fetchSeriesData]);

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
      router.push(`/web-series/${recId}` as any);
    }
  }, []);

  // Handle genre press
  const handleGenrePress = useCallback((genre: Genre) => {
    router.push(`/(tabs)/search?genre=${genre.id}` as any);
  }, []);

  // Handle season press - navigate to season detail page
  const handleSeasonPress = useCallback((seasonNumber: number) => {
    router.push(`/web-series/${seriesId}/season/${seasonNumber}` as any);
  }, [seriesId]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchSeriesData(true);
  }, [fetchSeriesData]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchSeriesData();
  }, [fetchSeriesData]);

  // Loading state
  if (isLoading) {
    return <DetailPageSkeleton />;
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Web Series Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState
          message={error || 'Web series not found'}
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
          testID="web-series-detail-header"
        />

        {/* Quick Actions Bar */}
        <QuickActions
          title={details.title}
          mediaType="tv"
          mediaId={details.id}
          isInWatchlist={inWatchlist}
          canDownload={providers.length > 0}
          onWatchlistPress={handleWatchlistToggle}
          testID="web-series-quick-actions"
        />

        {/* Genre Tags */}
        <GenreTags
          genres={details.genres}
          onGenrePress={handleGenrePress}
          testID="web-series-genres"
        />

        {/* Synopsis */}
        {details.overview && (
          <Synopsis
            overview={details.overview}
            testID="web-series-synopsis"
          />
        )}

        {/* Ratings Section */}
        <RatingsSection
          voteAverage={details.voteAverage}
          voteCount={details.voteCount}
          testID="web-series-ratings"
        />

        {/* Seasons Section */}
        <SeasonsSection
          details={details}
          onSeasonPress={handleSeasonPress}
          testID="web-series-seasons"
        />

        {/* Media Info Cards */}
        <MediaInfo
          details={details}
          testID="web-series-info"
        />

        {/* Cast Carousel */}
        <CastCarousel
          cast={cast}
          testID="web-series-cast"
        />

        {/* Streaming Providers */}
        <ProviderList
          providers={providers}
          testID="web-series-providers"
        />

        {/* Production Details */}
        <ProductionInfo
          details={details}
          testID="web-series-production"
        />

        {/* Recommendations */}
        <RecommendationsRow
          recommendations={recommendations}
          onItemPress={handleRecommendationPress}
          testID="web-series-recommendations"
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
  scrollView: {
    flex: 1,
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});
