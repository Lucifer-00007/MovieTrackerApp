/**
 * ContentRow Component
 * Displays a horizontal scrollable row of media items with infinite scroll
 * 
 * Requirements: 1.4, 1.5
 */

import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Text,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, ComponentTokens } from '@/constants/theme';
import { MediaCard } from './MediaCard';
import type { MediaItem } from '@/types/media';

export interface ContentRowProps {
  /** Section title */
  title: string;
  /** Array of media items to display */
  items: MediaItem[];
  /** Callback when an item is pressed */
  onItemPress: (id: number, mediaType: 'movie' | 'tv') => void;
  /** Callback when "See All" is pressed */
  onSeeAllPress?: () => void;
  /** Callback when end of list is reached (for infinite scroll) */
  onEndReached?: () => void;
  /** Whether more items are being loaded */
  isLoading?: boolean;
  /** Test ID for testing purposes */
  testID?: string;
}

const ITEM_SPACING = ComponentTokens.contentRow.itemSpacing;

export function ContentRow({
  title,
  items,
  onItemPress,
  onSeeAllPress,
  onEndReached,
  isLoading = false,
  testID,
}: ContentRowProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const handleEndReached = useCallback(() => {
    if (!isLoading && onEndReached) {
      onEndReached();
    }
  }, [isLoading, onEndReached]);

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

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: textColor }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {onSeeAllPress && (
          <Pressable
            onPress={onSeeAllPress}
            accessibilityRole="button"
            accessibilityLabel={`See all ${title}`}
            style={({ pressed }) => [
              styles.seeAllButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.seeAllText, { color: tintColor }]}>
              See All
            </Text>
          </Pressable>
        )}
      </View>
    ),
    [title, textColor, tintColor, onSeeAllPress]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      {renderHeader()}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => `content-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: ComponentTokens.mediaCard.medium.width + ITEM_SPACING,
          offset: (ComponentTokens.mediaCard.medium.width + ITEM_SPACING) * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: ComponentTokens.contentRow.titleHeight,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  seeAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    gap: ITEM_SPACING,
  },
  itemContainer: {
    marginRight: ITEM_SPACING,
  },
});

export default ContentRow;
