/**
 * Country Hub Filters Component
 * Provides filtering options for country content with enhanced UI
 * 
 * Requirements: 3.4, 3.5, 3.6
 */

import { StyleSheet, View, ScrollView, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS } from '@/constants/colors';

/** Content type filter options */
export type ContentTypeFilter = 'all' | 'movie' | 'tv';

/** Filter state interface */
export interface CountryHubFiltersState {
  contentType: ContentTypeFilter;
  genre: number | null;
  year: number | null;
}

/** Genre options for filtering */
const GENRE_OPTIONS = [
  { id: null, name: 'All Genres', icon: 'apps' as const },
  { id: 28, name: 'Action', icon: 'flash' as const },
  { id: 35, name: 'Comedy', icon: 'happy' as const },
  { id: 18, name: 'Drama', icon: 'heart' as const },
  { id: 27, name: 'Horror', icon: 'skull' as const },
  { id: 10749, name: 'Romance', icon: 'heart-circle' as const },
  { id: 878, name: 'Sci-Fi', icon: 'rocket' as const },
  { id: 53, name: 'Thriller', icon: 'warning' as const },
  { id: 16, name: 'Animation', icon: 'color-palette' as const },
  { id: 99, name: 'Documentary', icon: 'videocam' as const },
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
const CONTENT_TYPE_OPTIONS: { value: ContentTypeFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'all', label: 'All', icon: 'apps' },
  { value: 'movie', label: 'Movies', icon: 'film' },
  { value: 'tv', label: 'Series', icon: 'tv' },
];

/** Props for filter chip component */
interface FilterChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onPress: () => void;
}

/** Enhanced filter chip component */
function FilterChip({ label, icon, isSelected, onPress }: FilterChipProps) {
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
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={isSelected ? SOLID_COLORS.WHITE : textColor}
        />
      ) : null}
      <Text
        style={[
          styles.filterChipText,
          {
            color: isSelected ? SOLID_COLORS.WHITE : textColor,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Filter section header */
interface FilterSectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function FilterSectionHeader({ title, icon }: FilterSectionHeaderProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={tintColor} />
      <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
    </View>
  );
}

interface CountryHubFiltersComponentProps {
  filters: CountryHubFiltersState;
  onFiltersChange: (filters: CountryHubFiltersState) => void;
}

export function CountryHubFilters({ filters, onFiltersChange }: CountryHubFiltersComponentProps) {
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'cardBorder');

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
    <View style={[styles.container, { backgroundColor: cardBackground, borderColor }]}>
      {/* Content Type Filter */}
      <View style={styles.filterSection}>
        <FilterSectionHeader title="Content Type" icon="layers" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CONTENT_TYPE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              icon={option.icon}
              isSelected={filters.contentType === option.value}
              onPress={() => handleContentTypeChange(option.value)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Genre Filter */}
      <View style={styles.filterSection}>
        <FilterSectionHeader title="Genre" icon="library" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {GENRE_OPTIONS.map((genre) => (
            <FilterChip
              key={genre.id || 'all'}
              label={genre.name}
              icon={genre.icon}
              isSelected={filters.genre === genre.id}
              onPress={() => handleGenreChange(genre.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Year Filter */}
      <View style={styles.filterSection}>
        <FilterSectionHeader title="Release Year" icon="calendar" />
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
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  filterRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});