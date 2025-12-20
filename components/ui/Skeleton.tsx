/**
 * Skeleton Component
 * Displays loading placeholder with shimmer animation
 * 
 * Requirements: 1.6
 */

import { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, ComponentTokens, AnimationDurations } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Skeleton variant types */
export type SkeletonVariant = 'card' | 'hero' | 'row' | 'detail';

export interface SkeletonProps {
  /** Type of skeleton to display */
  variant: SkeletonVariant;
  /** Number of skeleton items to display (for card and row variants) */
  count?: number;
  /** Test ID for testing purposes */
  testID?: string;
}

/** Shimmer animation component */
function ShimmerOverlay() {
  const translateX = useSharedValue(-SCREEN_WIDTH);
  
  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {
        duration: ComponentTokens.skeleton.duration,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, [translateX]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return (
    <Animated.View style={[styles.shimmer, animatedStyle]}>
      <View style={styles.shimmerGradient} />
    </Animated.View>
  );
}

/** Base skeleton box with shimmer */
function SkeletonBox({
  width,
  height,
  borderRadius = BorderRadius.md,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const skeletonColor = useThemeColor({}, 'skeleton');
  
  return (
    <View
      style={[
        styles.skeletonBox,
        {
          width,
          height,
          borderRadius,
          backgroundColor: skeletonColor,
        },
        style,
      ]}
    >
      <ShimmerOverlay />
    </View>
  );
}

/** Card skeleton */
function CardSkeleton({ count = 1 }: { count?: number }) {
  const { width, height } = ComponentTokens.mediaCard.medium;
  
  return (
    <View style={styles.cardContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.cardItem}>
          <SkeletonBox width={width} height={height} borderRadius={BorderRadius.lg} />
        </View>
      ))}
    </View>
  );
}

/** Hero skeleton */
function HeroSkeleton() {
  const height = ComponentTokens.heroCarousel.height;
  
  return (
    <View style={styles.heroContainer}>
      <SkeletonBox width="100%" height={height} borderRadius={0} />
      <View style={styles.heroContent}>
        <SkeletonBox width={60} height={24} borderRadius={BorderRadius.sm} />
        <SkeletonBox width="70%" height={32} borderRadius={BorderRadius.sm} style={styles.heroTitle} />
        <SkeletonBox width="90%" height={16} borderRadius={BorderRadius.sm} style={styles.heroLine} />
        <SkeletonBox width="60%" height={16} borderRadius={BorderRadius.sm} style={styles.heroLine} />
      </View>
    </View>
  );
}

/** Row skeleton (title + horizontal cards) */
function RowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.rowContainer}>
      {/* Title skeleton */}
      <View style={styles.rowHeader}>
        <SkeletonBox width={150} height={24} borderRadius={BorderRadius.sm} />
        <SkeletonBox width={60} height={20} borderRadius={BorderRadius.sm} />
      </View>
      {/* Cards skeleton */}
      <CardSkeleton count={count} />
    </View>
  );
}

/** Detail page skeleton */
function DetailSkeleton() {
  return (
    <View style={styles.detailContainer}>
      {/* Hero image */}
      <SkeletonBox width="100%" height={300} borderRadius={0} />
      
      {/* Content */}
      <View style={styles.detailContent}>
        {/* Title */}
        <SkeletonBox width="80%" height={32} borderRadius={BorderRadius.sm} />
        
        {/* Meta info */}
        <View style={styles.detailMeta}>
          <SkeletonBox width={80} height={20} borderRadius={BorderRadius.sm} />
          <SkeletonBox width={60} height={20} borderRadius={BorderRadius.sm} />
          <SkeletonBox width={100} height={20} borderRadius={BorderRadius.sm} />
        </View>
        
        {/* Synopsis */}
        <View style={styles.detailSynopsis}>
          <SkeletonBox width="100%" height={16} borderRadius={BorderRadius.sm} />
          <SkeletonBox width="100%" height={16} borderRadius={BorderRadius.sm} style={styles.synopsisLine} />
          <SkeletonBox width="70%" height={16} borderRadius={BorderRadius.sm} style={styles.synopsisLine} />
        </View>
        
        {/* Cast section */}
        <SkeletonBox width={100} height={24} borderRadius={BorderRadius.sm} style={styles.sectionTitle} />
        <View style={styles.castContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.castItem}>
              <SkeletonBox width={60} height={60} borderRadius={30} />
              <SkeletonBox width={60} height={12} borderRadius={BorderRadius.sm} style={styles.castName} />
            </View>
          ))}
        </View>
        
        {/* Providers section */}
        <SkeletonBox width={150} height={24} borderRadius={BorderRadius.sm} style={styles.sectionTitle} />
        <View style={styles.providersContainer}>
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBox key={index} width={50} height={50} borderRadius={BorderRadius.md} />
          ))}
        </View>
      </View>
    </View>
  );
}

export function Skeleton({ variant, count = 1, testID }: SkeletonProps) {
  return (
    <View testID={testID} accessibilityLabel="Loading content">
      {variant === 'card' && <CardSkeleton count={count} />}
      {variant === 'hero' && <HeroSkeleton />}
      {variant === 'row' && <RowSkeleton count={count} />}
      {variant === 'detail' && <DetailSkeleton />}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBox: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  cardContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  cardItem: {
    marginRight: Spacing.sm,
  },
  heroContainer: {
    position: 'relative',
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  heroTitle: {
    marginTop: Spacing.sm,
  },
  heroLine: {
    marginTop: Spacing.xs,
  },
  rowContainer: {
    marginVertical: Spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailContainer: {
    flex: 1,
  },
  detailContent: {
    padding: Spacing.lg,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  detailSynopsis: {
    marginTop: Spacing.lg,
  },
  synopsisLine: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  castContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  castItem: {
    alignItems: 'center',
  },
  castName: {
    marginTop: Spacing.xs,
  },
  providersContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});

export default Skeleton;
