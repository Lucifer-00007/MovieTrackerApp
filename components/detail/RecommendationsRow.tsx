/**
 * RecommendationsRow Component
 * Displays a horizontal row of recommended titles
 * 
 * Requirements: 4.8
 */

import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, ComponentTokens } from '@/constants/theme';
import { MediaCard } from '@/components/media/MediaCard';
import type { MediaItem } from '@/types/media';

const ITEM_SPACING = ComponentTokens.contentRow.itemSpacing;

export interface RecommendationsRowProps {
  /** Array of recommended media items */
  recommendations: MediaItem[];
  /** Callback when an item is pressed */
  onItemPress: (id: number, mediaType: 'movie' | 'tv') => void;
  /** Test ID for testing */
  testID?: string;
}

export function RecommendationsRow({
  recommendations,
  onItemPress,
  testID,
}: RecommendationsRowProps) {
  const textColor = useThemeColor({}, 'text');

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <View style={styles.itemContainer}>
        <MediaCard
          id={item.id}
          title={item.title}
          posterPath={item.posterPath}
          rating={item.voteAverage}
          variant="medium"
          onPress={() => onItemPress(item.id, item.mediaType)}
          testID={testID ? `${testID}-item-${item.id}` : undefined}
        />
      </View>
    ),
    [onItemPress, testID]
  );

  // Don't render if no recommendations
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text
        style={[styles.sectionTitle, { color: textColor }]}
        accessibilityRole="header"
      >
        More Like This
      </Text>
      
      <FlatList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={(item) => `rec-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: ComponentTokens.mediaCard.medium.width + ITEM_SPACING,
          offset: (ComponentTokens.mediaCard.medium.width + ITEM_SPACING) * index,
          index,
        })}
        testID={testID ? `${testID}-list` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: ITEM_SPACING,
  },
  itemContainer: {
    marginRight: ITEM_SPACING,
  },
});

export default RecommendationsRow;
