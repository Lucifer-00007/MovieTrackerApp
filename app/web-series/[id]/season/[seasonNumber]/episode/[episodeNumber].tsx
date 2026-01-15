/**
 * Episode Detail Screen
 * Displays episode information with play option
 * URL: /web-series/[id]/season/[seasonNumber]/episode/[episodeNumber]
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

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS, ComponentTokens } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ErrorState } from '@/components/ui/ErrorState';
import { DetailPageSkeleton } from '@/components/ui/Skeleton';
import {
  EpisodeHero,
  EpisodeInfo,
  CrewSection,
  GuestStarsSection,
  EpisodeNavigation,
} from '@/components/episode';
import type { EpisodeDetail, CrewMember, GuestStar } from '@/components/episode';
import { getTvDetails } from '@/services/api';
import type { MediaDetails } from '@/types/media';

export default function EpisodeDetailScreen() {
  const { id, seasonNumber, episodeNumber } = useLocalSearchParams<{ 
    id: string; 
    seasonNumber: string;
    episodeNumber: string;
  }>();
  const seriesId = parseInt(id || '0', 10);
  const season = parseInt(seasonNumber || '1', 10);
  const episode = parseInt(episodeNumber || '1', 10);
  
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  // State
  const [seriesDetails, setSeriesDetails] = useState<MediaDetails | null>(null);
  const [episodeDetail, setEpisodeDetail] = useState<EpisodeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch episode data
  const fetchEpisodeData = useCallback(async (showRefresh = false) => {
    if (!seriesId || !season || !episode) return;

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const details = await getTvDetails(seriesId);
      setSeriesDetails(details);

      // Generate mock data (in production, call dedicated episode API)
      const mockCrew: CrewMember[] = [
        { id: 1, name: 'R. Scott Gemmill', job: 'Director', department: 'Directing', profilePath: details.posterPath },
        { id: 2, name: 'John Wells', job: 'Executive Producer', department: 'Production', profilePath: null },
        { id: 3, name: 'David Zabel', job: 'Writer', department: 'Writing', profilePath: null },
        { id: 4, name: 'Simran Sethi', job: 'Writer', department: 'Writing', profilePath: details.posterPath },
        { id: 5, name: 'Alex Zakrzewski', job: 'Director of Photography', department: 'Camera', profilePath: null },
      ];

      const mockGuestStars: GuestStar[] = [
        { id: 101, name: 'Katherine LaNasa', character: 'Dr. Dana Evans', profilePath: details.posterPath },
        { id: 102, name: 'Isa Briones', character: 'Dr. Anna Okafor', profilePath: details.posterPath },
        { id: 103, name: 'Taylor Dearden', character: 'Collins', profilePath: null },
        { id: 104, name: 'Gerardo Celasco', character: 'Javier Medina', profilePath: details.posterPath },
        { id: 105, name: 'Shabana Azmi', character: 'Dr. Patel', profilePath: null },
        { id: 106, name: 'Fiona Gubelmann', character: 'Dr. Morgan Reznick', profilePath: details.posterPath },
      ];

      setEpisodeDetail({
        id: season * 100 + episode,
        episodeNumber: episode,
        seasonNumber: season,
        name: `Episode ${episode}`,
        overview: `This is episode ${episode} of season ${season} of ${details.title}. ${details.overview || 'No description available.'}`,
        stillPath: details.backdropPath,
        airDate: details.releaseDate || '',
        runtime: details.runtime || 45,
        voteAverage: details.voteAverage || 0,
        voteCount: details.voteCount || 0,
        crew: mockCrew,
        guestStars: mockGuestStars,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load episode details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [seriesId, season, episode]);

  useEffect(() => {
    fetchEpisodeData();
  }, [fetchEpisodeData]);

  const handleRefresh = useCallback(() => fetchEpisodeData(true), [fetchEpisodeData]);
  const handleRetry = useCallback(() => fetchEpisodeData(), [fetchEpisodeData]);

  const handlePlayEpisode = useCallback(() => {
    console.log(`Playing S${season}E${episode}`);
  }, [season, episode]);

  const handlePreviousEpisode = useCallback(() => {
    if (episode > 1) {
      router.replace(`/web-series/${seriesId}/season/${season}/episode/${episode - 1}` as any);
    }
  }, [seriesId, season, episode]);

  const handleNextEpisode = useCallback(() => {
    router.replace(`/web-series/${seriesId}/season/${season}/episode/${episode + 1}` as any);
  }, [seriesId, season, episode]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !episodeDetail || !seriesDetails) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Episode {episode}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState message={error || 'Episode not found'} onRetry={handleRetry} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating back button */}
      <View style={styles.floatingHeader}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.floatingButton, { backgroundColor: OVERLAY_COLORS.BLACK_50 }]}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={24} color={SOLID_COLORS.WHITE} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
      >
        <EpisodeHero
          stillPath={episodeDetail.stillPath}
          seriesTitle={seriesDetails.title}
          seasonNumber={season}
          episodeNumber={episode}
          onPlayPress={handlePlayEpisode}
          testID="episode-hero"
        />

        <EpisodeInfo
          name={episodeDetail.name}
          airDate={episodeDetail.airDate}
          runtime={episodeDetail.runtime}
          voteAverage={episodeDetail.voteAverage}
          voteCount={episodeDetail.voteCount}
          testID="episode-info"
        />

        {/* Overview */}
        {episodeDetail.overview && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
            <Text style={[styles.overview, { color: colors.textSecondary }]}>
              {episodeDetail.overview}
            </Text>
          </View>
        )}

        <CrewSection crew={episodeDetail.crew} testID="episode-crew" />

        <GuestStarsSection guestStars={episodeDetail.guestStars} testID="episode-guest-stars" />

        <EpisodeNavigation
          currentEpisode={episode}
          onPrevious={handlePreviousEpisode}
          onNext={handleNextEpisode}
          testID="episode-navigation"
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    minWidth: ComponentTokens.touchTarget.min,
    minHeight: ComponentTokens.touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  headerSpacer: {
    width: ComponentTokens.touchTarget.min,
  },
  floatingHeader: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.md,
    zIndex: 100,
  },
  floatingButton: {
    width: ComponentTokens.touchTarget.min,
    height: ComponentTokens.touchTarget.min,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  overview: {
    fontSize: Typography.sizes.md,
    lineHeight: Typography.sizes.md * Typography.lineHeights.relaxed,
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});
