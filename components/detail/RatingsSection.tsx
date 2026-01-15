/**
 * RatingsSection Component
 * Displays ratings from multiple sources with visual indicators
 * 
 * Requirements: 4.2
 */

import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export interface RatingSource {
  source: string;
  value: number;
  maxValue: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface RatingsSectionProps {
  /** Vote average from TMDB (0-10) */
  voteAverage: number | null;
  /** Vote count */
  voteCount: number;
  /** Additional rating sources */
  additionalRatings?: RatingSource[];
  /** Test ID */
  testID?: string;
}

function getRatingColor(percentage: number): string {
  if (percentage >= 70) return '#22C55E'; // Green
  if (percentage >= 50) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red
}

interface RatingCardProps {
  source: string;
  value: number;
  maxValue: number;
  icon?: keyof typeof Ionicons.glyphMap;
  textColor: string;
  secondaryColor: string;
  backgroundColor: string;
}

function RatingCard({ source, value, maxValue, icon, textColor, secondaryColor, backgroundColor }: RatingCardProps) {
  const percentage = (value / maxValue) * 100;
  const ratingColor = getRatingColor(percentage);
  const displayValue = maxValue === 10 ? value.toFixed(1) : `${Math.round(percentage)}%`;

  return (
    <View style={[styles.ratingCard, { backgroundColor }]}>
      <View style={styles.ratingHeader}>
        {icon && <Ionicons name={icon} size={16} color={secondaryColor} style={styles.sourceIcon} />}
        <Text style={[styles.sourceText, { color: secondaryColor }]}>{source}</Text>
      </View>
      <View style={styles.ratingValueContainer}>
        <Text style={[styles.ratingValue, { color: ratingColor }]}>{displayValue}</Text>
        {maxValue === 10 && (
          <Text style={[styles.ratingMax, { color: secondaryColor }]}>/10</Text>
        )}
      </View>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: ratingColor }]} />
        </View>
      </View>
    </View>
  );
}

export function RatingsSection({
  voteAverage,
  voteCount,
  additionalRatings = [],
  testID,
}: RatingsSectionProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'backgroundSecondary');

  if (voteAverage === null || voteAverage === 0) {
    return null;
  }

  const allRatings: RatingSource[] = [
    {
      source: 'TMDB',
      value: voteAverage,
      maxValue: 10,
      icon: 'star',
    },
    ...additionalRatings,
  ];

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Ratings</Text>
        <Text style={[styles.voteCount, { color: textSecondary }]}>
          {voteCount.toLocaleString()} votes
        </Text>
      </View>
      
      <View style={styles.ratingsGrid}>
        {allRatings.map((rating, index) => (
          <RatingCard
            key={`${rating.source}-${index}`}
            source={rating.source}
            value={rating.value}
            maxValue={rating.maxValue}
            icon={rating.icon}
            textColor={textColor}
            secondaryColor={textSecondary}
            backgroundColor={cardBackground}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  voteCount: {
    fontSize: Typography.sizes.sm,
  },
  ratingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ratingCard: {
    flex: 1,
    minWidth: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sourceIcon: {
    marginRight: Spacing.xs,
  },
  sourceText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  ratingValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  ratingValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  ratingMax: {
    fontSize: Typography.sizes.sm,
    marginLeft: 2,
  },
  progressContainer: {
    height: 4,
  },
  progressBackground: {
    height: '100%',
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default RatingsSection;
