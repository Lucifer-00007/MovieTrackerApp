/**
 * Skeleton Component
 * Animated placeholder for loading states
 */

import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius } from '@/constants/theme';

export interface SkeletonProps {
  /** Width of the skeleton */
  width: number | `${number}%`;
  /** Height of the skeleton */
  height: number;
  /** Border radius */
  borderRadius?: number;
  /** Custom style */
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = BorderRadius.md, style }: SkeletonProps) {
  const backgroundColor = useThemeColor({}, 'skeleton');
  const highlightColor = useThemeColor({}, 'skeletonHighlight');
  
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, backgroundColor },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Skeleton for detail page header */
export function DetailHeaderSkeleton() {
  const backgroundColor = useThemeColor({}, 'background');
  
  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      <View style={styles.headerImageSkeleton}>
        <Skeleton width={400} height={400} borderRadius={0} style={{ flex: 1 }} />
      </View>
      <View style={styles.headerContent}>
        <Skeleton width={80} height={28} style={styles.badge} />
        <Skeleton width={250} height={32} style={styles.title} />
        <Skeleton width={180} height={20} style={styles.subtitle} />
      </View>
    </View>
  );
}

/** Skeleton for quick actions bar */
export function QuickActionsSkeleton() {
  return (
    <View style={styles.actionsContainer}>
      <Skeleton width={100} height={44} />
      <Skeleton width={100} height={44} />
      <Skeleton width={100} height={44} />
    </View>
  );
}

/** Skeleton for content section */
export function ContentSkeleton() {
  return (
    <View style={styles.contentContainer}>
      <Skeleton width={120} height={24} style={styles.sectionTitle} />
      <Skeleton width={300} height={60} />
      <Skeleton width={270} height={20} style={styles.line} />
      <Skeleton width={240} height={20} style={styles.line} />
    </View>
  );
}

/** Skeleton for horizontal carousel */
export function CarouselSkeleton({ itemCount = 5 }: { itemCount?: number }) {
  return (
    <View style={styles.carouselContainer}>
      <Skeleton width={100} height={24} style={styles.sectionTitle} />
      <View style={styles.carouselItems}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <Skeleton key={i} width={100} height={150} />
        ))}
      </View>
    </View>
  );
}

/** Full page skeleton for detail screens */
export function DetailPageSkeleton() {
  const backgroundColor = useThemeColor({}, 'background');
  
  return (
    <View style={[styles.pageContainer, { backgroundColor }]}>
      <DetailHeaderSkeleton />
      <QuickActionsSkeleton />
      <ContentSkeleton />
      <CarouselSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  pageContainer: {
    flex: 1,
  },
  headerContainer: {
    position: 'relative',
  },
  headerImageSkeleton: {
    width: '100%',
    height: 400,
  },
  headerContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  badge: {
    marginBottom: 8,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  line: {
    marginTop: 8,
  },
  carouselContainer: {
    paddingVertical: 16,
    paddingLeft: 16,
  },
  carouselItems: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default Skeleton;
