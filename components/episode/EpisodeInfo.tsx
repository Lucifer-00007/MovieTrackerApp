/**
 * EpisodeInfo Component
 * Displays episode title, metadata, and rating
 */

import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { formatAirDate, formatRuntime } from './episode-utils';

export interface EpisodeInfoProps {
  name: string;
  airDate: string;
  runtime: number | null;
  voteAverage: number;
  voteCount: number;
  testID?: string;
}

export function EpisodeInfo({
  name,
  airDate,
  runtime,
  voteAverage,
  voteCount,
  testID,
}: EpisodeInfoProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const ratingBadgeColor = useThemeColor({}, 'ratingBadge');
  const ratingTextColor = useThemeColor({}, 'ratingText');

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.title, { color: textColor }]}>
        {name}
      </Text>
      
      <View style={styles.metaRow}>
        {airDate && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={textSecondary} />
            <Text style={[styles.metaText, { color: textSecondary }]}>
              {formatAirDate(airDate)}
            </Text>
          </View>
        )}
        {runtime && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={textSecondary} />
            <Text style={[styles.metaText, { color: textSecondary }]}>
              {formatRuntime(runtime)}
            </Text>
          </View>
        )}
      </View>

      {voteAverage > 0 && (
        <View style={[styles.ratingBadge, { backgroundColor: ratingBadgeColor }]}>
          <Text style={[styles.ratingText, { color: ratingTextColor }]}>
            ★ {voteAverage.toFixed(1)}
          </Text>
          {voteCount > 0 && (
            <Text style={[styles.voteCount, { color: textSecondary }]}>
              ({voteCount.toLocaleString()} votes)
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.sizes.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  voteCount: {
    fontSize: Typography.sizes.xs,
  },
});

export default EpisodeInfo;
