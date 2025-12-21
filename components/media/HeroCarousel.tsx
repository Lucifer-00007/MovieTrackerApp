/**
 * HeroCarousel Component
 * Displays a hero carousel with auto-advance and swipe navigation
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  FlatList,
  Pressable,
  Text,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography, ComponentTokens } from '@/constants/theme';
import type { TrendingItem } from '@/types/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = ComponentTokens.heroCarousel.height;
const AUTO_ADVANCE_INTERVAL = ComponentTokens.heroCarousel.autoAdvanceInterval;

/** TMDB image base URL */
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/** Placeholder image for mock data mode */
const PLACEHOLDER_IMAGE = require('@/assets/images/placeholder-poster.png');

/** Check if mock data mode is enabled */
function isMockDataMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
}

export interface HeroCarouselProps {
  /** Array of trending items to display */
  items: TrendingItem[];
  /** Auto-advance interval in milliseconds (default: 5000) */
  autoAdvanceInterval?: number;
  /** Callback when an item is pressed */
  onItemPress: (id: number, mediaType: 'movie' | 'tv') => void;
  /** Test ID for testing purposes */
  testID?: string;
}

/** Get backdrop URL for hero image */
function getBackdropUrl(backdropPath: string | null): string | null {
  if (!backdropPath) return null;
  if (isMockDataMode()) return 'placeholder';
  return `${TMDB_IMAGE_BASE}/w1280${backdropPath}`;
}

export function HeroCarousel({
  items,
  autoAdvanceInterval = AUTO_ADVANCE_INTERVAL,
  onItemPress,
  testID,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<TrendingItem>>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  // Auto-advance logic
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
    }
    
    if (items.length <= 1) return;
    
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % items.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, autoAdvanceInterval);
  }, [items.length, autoAdvanceInterval]);

  const stopAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  // Start auto-advance on mount
  useEffect(() => {
    startAutoAdvance();
    return () => stopAutoAdvance();
  }, [startAutoAdvance, stopAutoAdvance]);

  // Handle scroll end to update current index
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
        setCurrentIndex(newIndex);
      }
      // Restart auto-advance after user interaction
      startAutoAdvance();
    },
    [currentIndex, items.length, startAutoAdvance]
  );

  // Handle scroll begin to stop auto-advance during user interaction
  const handleScrollBegin = useCallback(() => {
    stopAutoAdvance();
  }, [stopAutoAdvance]);

  const renderItem = useCallback(
    ({ item }: { item: TrendingItem }) => {
      const backdropUrl = getBackdropUrl(item.backdropPath);
      
      return (
        <Pressable
          onPress={() => onItemPress(item.id, item.mediaType)}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, trending rank ${item.rank}`}
          accessibilityHint="Double tap to view details"
          style={styles.heroItem}
        >
          {backdropUrl ? (
            <Image
              source={backdropUrl === 'placeholder' ? PLACEHOLDER_IMAGE : { uri: backdropUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor }]} />
          )}
          
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          
          {/* Content overlay */}
          <View style={styles.contentOverlay}>
            {/* Rank badge */}
            <View style={[styles.rankBadge, { backgroundColor: tintColor }]}>
              <Text style={styles.rankText}>#{item.rank}</Text>
            </View>
            
            <Text
              style={[styles.title, { color: '#FFFFFF' }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            
            {item.overview && (
              <Text
                style={[styles.overview, { color: 'rgba(255,255,255,0.8)' }]}
                numberOfLines={2}
              >
                {item.overview}
              </Text>
            )}
            
            {item.voteAverage !== null && item.voteAverage > 0 && (
              <Text style={[styles.rating, { color: '#FFFFFF' }]}>
                ★ {item.voteAverage.toFixed(1)}
              </Text>
            )}
          </View>
        </Pressable>
      );
    },
    [onItemPress, tintColor, backgroundColor]
  );

  const renderPaginationDots = useCallback(() => {
    if (items.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {items.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentIndex ? tintColor : 'rgba(255,255,255,0.5)',
              },
            ]}
            accessibilityLabel={`Page ${index + 1} of ${items.length}${index === currentIndex ? ', current' : ''}`}
          />
        ))}
      </View>
    );
  }, [items.length, currentIndex, tintColor]);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => `hero-${item.id}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
      />
      {renderPaginationDots()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroItem: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_HEIGHT * 0.6,
  },
  contentOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 20, // Extra space for pagination dots
  },
  rankBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  overview: {
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
    marginBottom: Spacing.sm,
  },
  rating: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  pagination: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default HeroCarousel;
