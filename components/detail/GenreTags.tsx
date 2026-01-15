/**
 * GenreTags Component
 * Displays genre tags in a horizontal scrollable row
 * 
 * Requirements: 4.2
 */

import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { Genre } from '@/types/media';

export interface GenreTagsProps {
  /** Array of genres */
  genres: Genre[];
  /** Callback when genre is pressed */
  onGenrePress?: (genre: Genre) => void;
  /** Test ID */
  testID?: string;
}

export function GenreTags({ genres, onGenrePress, testID }: GenreTagsProps) {
  const tintColor = useThemeColor({}, 'tint');

  if (!genres || genres.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {genres.map((genre) => (
          <Pressable
            key={genre.id}
            onPress={() => onGenrePress?.(genre)}
            style={({ pressed }) => [
              styles.tag,
              { borderColor: tintColor, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Genre: ${genre.name}`}
          >
            <Text style={[styles.tagText, { color: tintColor }]}>{genre.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});

export default GenreTags;
