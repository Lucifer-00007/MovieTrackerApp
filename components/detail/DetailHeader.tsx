/**
 * DetailHeader Component
 * Displays a full-bleed hero image with parallax scroll effect
 * Shows title, genres, runtime, release year, and rating
 * 
 * Requirements: 4.1, 4.2
 */

import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography, ComponentTokens } from '@/constants/theme';
import type { MediaDetails } from '@/types/media';
import {
  getBackdropUrl,
  formatRuntime,
  formatReleaseYear,
  formatRating,
  formatGenres,
  generateDetailAccessibilityLabel,
} from './detail-utils';

/** Placeholder image for mock data mode */
const PLACEHOLDER_IMAGE = require('@/assets/images/placeholder-poster.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 400;
const PARALLAX_FACTOR = 0.5;

export interface DetailHeaderProps {
  /** Media details to display */
  details: MediaDetails;
  /** Animated scroll value for parallax effect */
  scrollY?: SharedValue<number>;
  /** Whether trailer is available */
  hasTrailer?: boolean;
  /** Callback when play button is pressed */
  onPlayPress?: () => void;
  /** Test ID for testing */
  testID?: string;
}

export function DetailHeader({
  details,
  scrollY,
  hasTrailer = false,
  onPlayPress,
  testID,
}: DetailHeaderProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const ratingBadgeColor = useThemeColor({}, 'ratingBadge');
  const ratingTextColor = useThemeColor({}, 'ratingText');
  const ageRatingBadgeColor = useThemeColor({}, 'warning');
  const ageRatingTextColor = useThemeColor({}, 'background');

  const backdropUrl = getBackdropUrl(details.backdropPath);
  const runtime = formatRuntime(details.runtime);
  const releaseYear = formatReleaseYear(details.releaseDate);
  const rating = formatRating(details.voteAverage);
  const genres = formatGenres(details.genres);
  const accessibilityLabel = generateDetailAccessibilityLabel(details);

  // Parallax animation style
  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    const translateY = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
      [-HEADER_HEIGHT * PARALLAX_FACTOR, 0, HEADER_HEIGHT * PARALLAX_FACTOR],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0],
      [1.5, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  }, [scrollY]);

  const renderMetadata = useCallback(() => {
    const metaParts: string[] = [];
    if (releaseYear) metaParts.push(releaseYear);
    if (runtime) metaParts.push(runtime);
    if (genres) metaParts.push(genres);

    return metaParts.join(' • ');
  }, [releaseYear, runtime, genres]);

  return (
    <View 
      style={styles.container} 
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="header"
    >
      {/* Hero Image with Parallax */}
      <Animated.View style={[styles.imageContainer, parallaxStyle]}>
        {backdropUrl ? (
          <Image
            source={backdropUrl === 'placeholder' ? PLACEHOLDER_IMAGE : { uri: backdropUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
            testID={testID ? `${testID}-backdrop` : undefined}
          />
        ) : (
          <View 
            style={[styles.placeholder, { backgroundColor }]}
            testID={testID ? `${testID}-placeholder` : undefined}
          />
        )}
      </Animated.View>

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
        style={styles.gradient}
        locations={[0, 0.6, 1]}
      />

      {/* Play Button (if trailer available) */}
      {hasTrailer && onPlayPress && (
        <Pressable
          onPress={onPlayPress}
          style={({ pressed }) => [
            styles.playButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Play trailer"
          accessibilityHint="Double tap to play the trailer"
          testID={testID ? `${testID}-play-button` : undefined}
        >
          <View style={[styles.playButtonInner, { backgroundColor: tintColor }]}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </Pressable>
      )}

      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* Badges Row */}
        <View style={styles.badgesRow}>
          {/* Rating Badge */}
          {rating && (
            <View 
              style={[styles.ratingBadge, { backgroundColor: ratingBadgeColor }]}
              accessibilityLabel={`Rating: ${rating} out of 10`}
              testID={testID ? `${testID}-rating` : undefined}
            >
              <Text style={[styles.ratingText, { color: ratingTextColor }]}>
                ★ {rating}
              </Text>
            </View>
          )}

          {/* Age Rating Badge */}
          {details.ageRating && (
            <View 
              style={[styles.ageRatingBadge, { backgroundColor: ageRatingBadgeColor }]}
              accessibilityLabel={`Age rating: ${details.ageRating}`}
              testID={testID ? `${testID}-age-rating` : undefined}
            >
              <Text style={[styles.ageRatingText, { color: ageRatingTextColor }]}>
                {details.ageRating}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          style={styles.title}
          numberOfLines={3}
          testID={testID ? `${testID}-title` : undefined}
        >
          {details.title}
        </Text>

        {/* Tagline */}
        {details.tagline && (
          <Text
            style={styles.tagline}
            numberOfLines={2}
            testID={testID ? `${testID}-tagline` : undefined}
          >
            {details.tagline}
          </Text>
        )}

        {/* Metadata Row */}
        <Text
          style={styles.metadata}
          numberOfLines={2}
          testID={testID ? `${testID}-metadata` : undefined}
        >
          {renderMetadata()}
        </Text>

        {/* TV Series Info */}
        {details.mediaType === 'tv' && details.numberOfSeasons && (
          <Text
            style={styles.tvInfo}
            testID={testID ? `${testID}-tv-info` : undefined}
          >
            {details.numberOfSeasons} Season{details.numberOfSeasons !== 1 ? 's' : ''}
            {details.numberOfEpisodes && ` • ${details.numberOfEpisodes} Episodes`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playButton: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -35,
    marginTop: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  playButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    marginLeft: 4,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  ratingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 44,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  ageRatingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 32,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageRatingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  metadata: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  tvInfo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
});

export default DetailHeader;
