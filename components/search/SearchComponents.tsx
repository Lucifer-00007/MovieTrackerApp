/**
 * Search Screen Components
 * Reusable components for the search screen
 */

import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { MediaCard } from '@/components/media/MediaCard';
import type { MediaItem } from '@/types/media';

/** Filter chip props */
export interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

/** Filter chip component */
export function FilterChip({ label, isActive, onPress }: FilterChipProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${label}`}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: isActive ? tintColor : backgroundColor,
          borderColor: isActive ? tintColor : borderColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: isActive ? '#FFFFFF' : textColor },
        ]}
      >
        {label}
      </Text>
      <Ionicons
        name="chevron-down"
        size={14}
        color={isActive ? '#FFFFFF' : textColor}
        style={styles.filterChipIcon}
      />
    </Pressable>
  );
}

/** Result section props */
export interface ResultSectionProps {
  title: string;
  items: MediaItem[];
  onItemPress: (id: number, mediaType: 'movie' | 'tv') => void;
  testID?: string;
}

/** Result section component */
export function ResultSection({ title, items, onItemPress, testID }: ResultSectionProps) {
  const textColor = useThemeColor({}, 'text');

  if (items.length === 0) return null;

  return (
    <View style={styles.resultSection} testID={testID}>
      <Text
        style={[styles.sectionTitle, { color: textColor }]}
        accessibilityRole="header"
      >
        {title} ({items.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.resultRow}
      >
        {items.map((item) => (
          <View key={`${item.mediaType}-${item.id}`} style={styles.resultItem}>
            <MediaCard
              id={item.id}
              title={item.title}
              posterPath={item.posterPath}
              rating={item.voteAverage}
              ageRating={item.ageRating}
              variant="medium"
              onPress={() => onItemPress(item.id, item.mediaType)}
              testID={testID ? `${testID}-item-${item.id}` : undefined}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 36,
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  filterChipIcon: {
    marginLeft: Spacing.xs,
  },
  resultSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  resultItem: {
    marginRight: Spacing.sm,
  },
});
