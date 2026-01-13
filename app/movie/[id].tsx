/**
 * Movie Detail Screen
 * Displays comprehensive movie information with watchlist and download options
 * 
 * Requirements: 4.2, 7.2, 8.1, 17.1, 17.6
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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  DetailHeader,
  Synopsis,
  CastCarousel,
  ProviderList,
  RecommendationsRow,
} from '@/components/detail';
import {
  getMovieDetails,
  getMovieCredits,
  getWatchProviders,
  getRecommendations,
  getTrailerKey,
} from '@/services/api';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import type { MediaDetails, CastMember, StreamingProvider, MediaItem } from '@/types/media';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = parseInt(id || '0', 10);
  
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
  const inWatchlist = details ? isInWatchlist(details.id, 'movie') : false;

  // Fetch movie data
  const fetchMovieData = useCallback(async (showRefresh = false) => {
    if (!movieId) return;

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Fetch all data in parallel
      const [movieDetails, movieCast, movieProviders, movieRecs, trailer] = await Promise.all([
        getMovieDetails(movieId),
        getMovieCredits(movieId).catch(() => []),
        getWatchProviders('movie', movieId).catch(() => []),
        getRecommendations('movie', movieId).then(r => r.items).catch(() => []),
        getTrailerKey('movie', movieId).catch(() => null),
      ]);

      setDetails(movieDetails);
      setCast(movieCast);
      setProviders(movieProviders);
      setRecommendations(movieRecs);
      setTrailerKey(trailer);

      // Add to recently viewed
      addToRecentlyViewed({
        id: movieDetails.id,
        mediaType: 'movie',
        title: movieDetails.title,
        posterPath: movieDetails.posterPath,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movie details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [movieId, addToRecentlyViewed]);

  // Initial fetch
  useEffect(() => {
    fetchMovieData();
  }, [fetchMovieData]);

  // Handle watchlist toggle
  const handleWatchlistToggle = useCallback(async () => {
    if (!details) return;
    
    await toggleItem({
      id: details.id,
      mediaType: 'movie',
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

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchMovieData(true);
  }, [fetchMovieData]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchMovieData();
  }, [fetchMovieData]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading movie details...
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Movie Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState
          message={error || 'Movie not found'}
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
          style={[styles.backButton, styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        
        <View style={styles.headerActions}>
          {/* Watchlist button */}
          <Pressable
            onPress={handleWatchlistToggle}
            style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            accessibilityLabel={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            accessibilityRole="button"
          >
            <IconSymbol
              name={inWatchlist ? 'bookmark.fill' : 'bookmark'}
              size={24}
              color={inWatchlist ? colors.tint : '#FFFFFF'}
            />
          </Pressable>
        </View>
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
          testID="movie-detail-header"
        />

        {/* Synopsis */}
        {details.overview && (
          <Synopsis
            overview={details.overview}
            testID="movie-synopsis"
          />
        )}

        {/* Cast Carousel - hidden if empty (Requirement 17.1) */}
        <CastCarousel
          cast={cast}
          testID="movie-cast"
        />

        {/* Streaming Providers - shows "not available" if empty (Requirement 17.6) */}
        <ProviderList
          providers={providers}
          testID="movie-providers"
        />

        {/* Recommendations */}
        <RecommendationsRow
          recommendations={recommendations}
          onItemPress={handleRecommendationPress}
          testID="movie-recommendations"
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
    minWidth: 44,
    minHeight: 44,
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
    width: 44,
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
