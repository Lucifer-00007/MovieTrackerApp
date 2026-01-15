/**
 * Season Detail Screen
 * Displays season information with episode list for a web series
 * URL: /web-series/[id]/season/[seasonNumber]
 * 
 * Requirements: 4.2
 */

import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS, ComponentTokens } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ErrorState } from '@/components/ui/ErrorState';
import { getTvDetails } from '@/services/api';
import { API_BASE_URLS } from '@/constants/api';
import type { MediaDetails } from '@/types/media';

/** Episode type for season detail */
interface Episode {
  id: number;
  episodeNumber: number;
  name: string;
  overview: string;
  stillPath: string | null;
  airDate: string;
  runtime: number | null;
  voteAverage: number;
}

/** Season detail type */
interface SeasonDetail {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string | null;
  airDate: string;
  episodes: Episode[];
}

/** Placeholder image */
const PLACEHOLDER_IMAGE = require('@/assets/images/placeholder-poster.png');

/** Check if mock data mode */
function isMockDataMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
}

/** Get image URL */
function getImageUrl(path: string | null, size: string = 'w300'): string | null {
  if (!path) return null;
  if (isMockDataMode()) return 'placeholder';
  return `${API_BASE_URLS.TMDB_IMAGES}/${size}${path}`;
}

/** Format air date */
function formatAirDate(dateString: string): string {
  if (!dateString) return 'TBA';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format runtime */
function formatRuntime(minutes: number | null): string {
  if (!minutes) return '';
  return `${minutes}m`;
}

export default function SeasonDetailScreen() {
  const { id, seasonNumber } = useLocalSearchParams<{ id: string; seasonNumber: string }>();
  const seriesId = parseInt(id || '0', 10);
  const season = parseInt(seasonNumber || '1', 10);
  
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  // State
  const [seriesDetails, setSeriesDetails] = useState<MediaDetails | null>(null);
  const [seasonDetail, setSeasonDetail] = useState<SeasonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch season data
  const fetchSeasonData = useCallback(async (showRefresh = false) => {
    if (!seriesId || !season) return;

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Fetch series details first
      const details = await getTvDetails(seriesId);
      setSeriesDetails(details);

      // Generate mock season data based on series info
      // In production, this would call a dedicated season API endpoint
      const avgEpisodesPerSeason = details.numberOfEpisodes && details.numberOfSeasons
        ? Math.ceil(details.numberOfEpisodes / details.numberOfSeasons)
        : 10;

      const mockEpisodes: Episode[] = Array.from({ length: avgEpisodesPerSeason }, (_, i) => ({
        id: season * 100 + i + 1,
        episodeNumber: i + 1,
        name: `Episode ${i + 1}`,
        overview: `Episode ${i + 1} of Season ${season}. ${details.overview?.slice(0, 100) || 'No description available.'}...`,
        stillPath: details.backdropPath,
        airDate: details.releaseDate || '',
        runtime: details.runtime || 45,
        voteAverage: details.voteAverage || 0,
      }));

      const mockSeasonDetail: SeasonDetail = {
        id: season,
        seasonNumber: season,
        name: `Season ${season}`,
        overview: `Season ${season} of ${details.title}. ${details.overview || ''}`,
        posterPath: details.posterPath,
        airDate: details.releaseDate || '',
        episodes: mockEpisodes,
      };

      setSeasonDetail(mockSeasonDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load season details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [seriesId, season]);

  // Initial fetch
  useEffect(() => {
    fetchSeasonData();
  }, [fetchSeasonData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchSeasonData(true);
  }, [fetchSeasonData]);

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchSeasonData();
  }, [fetchSeasonData]);

  // Handle episode press
  const handleEpisodePress = useCallback((episode: Episode) => {
    // Could navigate to episode detail or play episode
    console.log(`Episode ${episode.episodeNumber} pressed`);
  }, []);

  // Render episode item
  const renderEpisode = useCallback(({ item }: { item: Episode }) => {
    const stillUrl = getImageUrl(item.stillPath, 'w300');
    
    return (
      <Pressable
        onPress={() => handleEpisodePress(item)}
        style={({ pressed }) => [
          styles.episodeCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.8 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Episode ${item.episodeNumber}: ${item.name}`}
      >
        {/* Episode Thumbnail */}
        <View style={styles.episodeThumbnail}>
          {stillUrl ? (
            <Image
              source={stillUrl === 'placeholder' ? PLACEHOLDER_IMAGE : { uri: stillUrl }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="play-circle-outline" size={32} color={colors.textSecondary} />
            </View>
          )}
          {/* Episode number badge */}
          <View style={[styles.episodeBadge, { backgroundColor: colors.tint }]}>
            <Text style={styles.episodeBadgeText}>{item.episodeNumber}</Text>
          </View>
        </View>

        {/* Episode Info */}
        <View style={styles.episodeInfo}>
          <Text style={[styles.episodeTitle, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          
          <View style={styles.episodeMeta}>
            {item.airDate && (
              <Text style={[styles.episodeMetaText, { color: colors.textSecondary }]}>
                {formatAirDate(item.airDate)}
              </Text>
            )}
            {item.runtime && (
              <Text style={[styles.episodeMetaText, { color: colors.textSecondary }]}>
                • {formatRuntime(item.runtime)}
              </Text>
            )}
            {item.voteAverage > 0 && (
              <Text style={[styles.episodeMetaText, { color: colors.textSecondary }]}>
                • ★ {item.voteAverage.toFixed(1)}
              </Text>
            )}
          </View>

          <Text style={[styles.episodeOverview, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.overview}
          </Text>
        </View>

        {/* Play icon */}
        <View style={styles.playIconContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </Pressable>
    );
  }, [colors, handleEpisodePress]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading season details...
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !seasonDetail || !seriesDetails) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Season {season}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ErrorState
          message={error || 'Season not found'}
          onRetry={handleRetry}
        />
      </View>
    );
  }

  const posterUrl = getImageUrl(seasonDetail.posterPath, 'w342');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {seriesDetails.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={seasonDetail.episodes}
        renderItem={renderEpisode}
        keyExtractor={(item) => `episode-${item.id}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.seasonHeader}>
            {/* Season Poster */}
            <View style={styles.posterContainer}>
              {posterUrl ? (
                <Image
                  source={posterUrl === 'placeholder' ? PLACEHOLDER_IMAGE : { uri: posterUrl }}
                  style={styles.posterImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.posterPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="film-outline" size={48} color={colors.textSecondary} />
                </View>
              )}
            </View>

            {/* Season Info */}
            <View style={styles.seasonInfo}>
              <Text style={[styles.seasonTitle, { color: colors.text }]}>
                {seasonDetail.name}
              </Text>
              
              <View style={styles.seasonMeta}>
                <Text style={[styles.seasonMetaText, { color: colors.textSecondary }]}>
                  {seasonDetail.episodes.length} Episodes
                </Text>
                {seasonDetail.airDate && (
                  <Text style={[styles.seasonMetaText, { color: colors.textSecondary }]}>
                    • {formatAirDate(seasonDetail.airDate)}
                  </Text>
                )}
              </View>

              {seasonDetail.overview && (
                <Text style={[styles.seasonOverview, { color: colors.textSecondary }]} numberOfLines={4}>
                  {seasonDetail.overview}
                </Text>
              )}
            </View>
          </View>
        }
        ListHeaderComponentStyle={styles.listHeader}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  listHeader: {
    marginBottom: Spacing.md,
  },
  seasonHeader: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  posterContainer: {
    width: 120,
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  seasonTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  seasonMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  seasonMetaText: {
    fontSize: Typography.sizes.sm,
  },
  seasonOverview: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
  episodeCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  episodeThumbnail: {
    width: 120,
    height: 68,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  episodeBadgeText: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  episodeInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  episodeTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  episodeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xs,
  },
  episodeMetaText: {
    fontSize: Typography.sizes.xs,
    marginRight: Spacing.xs,
  },
  episodeOverview: {
    fontSize: Typography.sizes.xs,
    lineHeight: Typography.sizes.xs * Typography.lineHeights.normal,
  },
  playIconContainer: {
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
  },
  separator: {
    height: Spacing.sm,
  },
});
