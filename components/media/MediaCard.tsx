/**
 * MediaCard Component
 * Displays movie/series information in a visually appealing card format
 * Supports three size variants: large (feature), medium (carousel), small (grid)
 * 
 * Requirements: 2.1, 2.2, 2.3, 12.1, 12.3, 17.4, 17.5
 */

import { Image } from 'expo-image';
import { StyleSheet, View, Pressable, Text } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography, ComponentTokens } from '@/constants/theme';
import {
  MediaCardVariant,
  getPosterUrl,
  getVariantDimensions,
  formatRating,
  shouldShowRating,
  generateAccessibilityLabel,
} from './media-card-utils';

// Re-export types and utilities for external use
export { MediaCardVariant, getVariantDimensions } from './media-card-utils';

/** Props for the MediaCard component */
export interface MediaCardProps {
  /** Unique identifier for the media item */
  id: number;
  /** Title of the movie/series */
  title: string;
  /** Path to the poster image (null if unavailable) */
  posterPath: string | null;
  /** Rating value (null if unavailable) */
  rating: number | null;
  /** Age rating (e.g., PG, R, TV-MA) */
  ageRating?: string | null;
  /** Size variant of the card */
  variant: MediaCardVariant;
  /** Callback when card is pressed */
  onPress: () => void;
  /** Optional callback for long press (quick actions) */
  onLongPress?: () => void;
  /** Test ID for testing purposes */
  testID?: string;
}

export function MediaCard({
  id,
  title,
  posterPath,
  rating,
  ageRating,
  variant,
  onPress,
  onLongPress,
  testID,
}: MediaCardProps) {
  const cardBackground = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const ratingBadgeColor = useThemeColor({}, 'ratingBadge');
  const ratingTextColor = useThemeColor({}, 'ratingText');
  const ageRatingBadgeColor = useThemeColor({}, 'warning');
  const ageRatingTextColor = useThemeColor({}, 'background');
  
  const dimensions = getVariantDimensions(variant);
  const posterUrl = getPosterUrl(posterPath, variant);
  const showRating = shouldShowRating(rating);
  
  // Calculate touch target - ensure minimum 44x44
  const touchWidth = Math.max(dimensions.width, ComponentTokens.touchTarget.min);
  const touchHeight = Math.max(dimensions.height, ComponentTokens.touchTarget.min);
  
  // Accessibility label
  const accessibilityLabel = generateAccessibilityLabel(title, rating, ageRating);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to view details"
      testID={testID}
      style={({ pressed }) => [
        styles.touchTarget,
        {
          width: touchWidth,
          minHeight: touchHeight,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: cardBackground,
            borderColor: cardBorder,
          },
        ]}
        testID={testID ? `${testID}-container` : undefined}
      >
        {/* Poster Image or Placeholder */}
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            style={styles.poster}
            contentFit="cover"
            transition={300}
            placeholder={require('@/assets/images/icon.png')}
            placeholderContentFit="contain"
            accessibilityLabel={`${title} poster`}
            testID={testID ? `${testID}-poster` : undefined}
          />
        ) : (
          <View
            style={[styles.placeholder, { backgroundColor: cardBorder }]}
            testID={testID ? `${testID}-placeholder` : undefined}
          >
            <Text
              style={[
                styles.placeholderText,
                { color: textSecondary },
                variant === 'small' && styles.placeholderTextSmall,
              ]}
              numberOfLines={3}
              accessibilityLabel={`${title} placeholder`}
            >
              {title}
            </Text>
          </View>
        )}

        {/* Rating Badge - only shown when rating is available */}
        {showRating && (
          <View
            style={[styles.ratingBadge, { backgroundColor: ratingBadgeColor }]}
            accessibilityLabel={`Rating: ${formatRating(rating!)} out of 10`}
            testID={testID ? `${testID}-rating` : undefined}
          >
            <Text style={[styles.ratingText, { color: ratingTextColor }]}>
              ★ {formatRating(rating!)}
            </Text>
          </View>
        )}

        {/* Age Rating Badge - only shown when age rating is available */}
        {ageRating && (
          <View
            style={[
              styles.ageRatingBadge,
              { backgroundColor: ageRatingBadgeColor },
              showRating && styles.ageRatingBadgeWithRating,
            ]}
            accessibilityLabel={`Age rating: ${ageRating}`}
            testID={testID ? `${testID}-age-rating` : undefined}
          >
            <Text style={[styles.ageRatingText, { color: ageRatingTextColor }]}>
              {ageRating}
            </Text>
          </View>
        )}

        {/* Title overlay for large variant */}
        {variant === 'large' && (
          <View style={styles.titleOverlay}>
            <Text
              style={[styles.titleText, { color: '#FFFFFF' }]}
              numberOfLines={2}
              testID={testID ? `${testID}-title` : undefined}
            >
              {title}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  placeholderText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
  placeholderTextSmall: {
    fontSize: Typography.sizes.xs,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 44,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  ageRatingBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 32,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageRatingBadgeWithRating: {
    top: Spacing.xs + 32, // Position below rating badge when both are present
  },
  ageRatingText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  titleText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
});

export default MediaCard;
