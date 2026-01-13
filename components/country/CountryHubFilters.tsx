/**
 * Country Hub Filters Component
 * Provides filtering options for country content
 * 
 * Requirements: 3.4, 3.5, 3.6
 */

import { StyleSheet, View, ScrollView, Pressable, Text } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

/** Content type filter options */
export type ContentTypeFilter = 'all' | 'movie' | 'tv';

/** Filter state interface */
export interface CountryHubFilters {
  contentType: ContentTypeFilter;
  genre: number | null;
  year: number | null;
}

/** Genre options for filtering */
const GENRE_OPTIONS = [
  { id: null, name: 'All Genres' },
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
];

/** Year options for filtering */
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: null, label: 'All Years' },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
  })),
];

/** Content type filter options */
const CONTENT_TYPE_OPTIONS: { value: ContentTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'Series' },
];

/** Props for filter chip component */
interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

/** Filter chip component */
function FilterChip({ label, isSelected, onPress }: FilterChipProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: isSelected ? tintColor : backgroundColor,
          borderColor: isSelected ? tintColor : borderColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          {
            color: isSelected ? Colors.light.background : textColor,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface CountryHubFiltersProps {
  filters: CountryHubFilters;
  onFiltersChange: (filters: CountryHubFilters) => void;
}

export function CountryHubFilters({ filters, onFiltersChange }: CountryHubFiltersProps) {
  const backgroundColor = useThemeColor({}, 'background');

  const handleContentTypeChange = (contentType: ContentTypeFilter) => {
    onFiltersChange({ ...filters, contentType });
  };

  const handleGenreChange = (genre: number | null) => {
    onFiltersChange({ ...filters, genre });
  };

  const handleYearChange = (year: number | null) => {
    onFiltersChange({ ...filters, year });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Content Type Filter */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              isSelected={filters.contentType === option.value}
              onPress={() => handleContentTypeChange(option.value)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Genre Filter */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {GENRE_OPTIONS.map((genre) => (
            <FilterChip
              key={genre.id || 'all'}
              label={genre.name}
              isSelected={filters.genre === genre.id}
              onPress={() => handleGenreChange(genre.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Year Filter */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {YEAR_OPTIONS.map((year) => (
            <FilterChip
              key={year.value || 'all'}
              label={year.label}
              isSelected={filters.year === year.value}
              onPress={() => handleYearChange(year.value)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  filterSection: {
    marginBottom: Spacing.xs,
  },
  filterRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});