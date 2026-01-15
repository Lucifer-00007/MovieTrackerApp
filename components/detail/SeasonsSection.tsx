/**
 * SeasonsSection Component
 * Displays TV series seasons overview with episode counts
 * 
 * Requirements: 4.2
 */

import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { MediaDetails } from '@/types/media';

export interface SeasonsSectionProps {
  /** Media details (TV series) */
  details: MediaDetails;
  /** Callback when season is pressed */
  onSeasonPress?: (seasonNumber: number) => void;
  /** Test ID */
  testID?: string;
}

export function SeasonsSection({ details, onSeasonPress, testID }: SeasonsSectionProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');

  // Only show for TV series with seasons
  if (details.mediaType !== 'tv' || !details.numberOfSeasons) {
    return null;
  }

  const seasons = Array.from({ length: details.numberOfSeasons }, (_, i) => i + 1);
  const avgEpisodesPerSeason = details.numberOfEpisodes 
    ? Math.round(details.numberOfEpisodes / details.numberOfSeasons)
    : null;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Seasons</Text>
        <Text style={[styles.totalInfo, { color: textSecondary }]}>
          {details.numberOfSeasons} Season{details.numberOfSeasons !== 1 ? 's' : ''}
          {details.numberOfEpisodes && ` • ${details.numberOfEpisodes} Episodes`}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {seasons.map((seasonNum) => (
          <Pressable
            key={seasonNum}
            onPress={() => onSeasonPress?.(seasonNum)}
            style={({ pressed }) => [
              styles.seasonCard,
              { backgroundColor: cardBackground, borderColor, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Season ${seasonNum}`}
          >
            <View style={[styles.seasonBadge, { backgroundColor: tintColor }]}>
              <Text style={styles.seasonNumber}>{seasonNum}</Text>
            </View>
            <Text style={[styles.seasonLabel, { color: textColor }]}>Season {seasonNum}</Text>
            {avgEpisodesPerSeason && (
              <Text style={[styles.episodeCount, { color: textSecondary }]}>
                ~{avgEpisodesPerSeason} eps
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Series Status */}
      {details.status && (
        <View style={[styles.statusContainer, { backgroundColor: cardBackground, borderColor }]}>
          <Ionicons 
            name={details.status === 'Ended' ? 'checkmark-circle' : 'play-circle'} 
            size={20} 
            color={details.status === 'Ended' ? '#22C55E' : tintColor} 
          />
          <Text style={[styles.statusText, { color: textColor }]}>
            {details.status === 'Ended' ? 'Series Completed' : 'Currently Airing'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  totalInfo: {
    fontSize: Typography.sizes.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  seasonCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minWidth: 100,
  },
  seasonBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  seasonNumber: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  seasonLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  episodeCount: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginLeft: Spacing.sm,
  },
});

export default SeasonsSection;
