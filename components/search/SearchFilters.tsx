/**
 * Search Filters Component
 * Provides filtering options for search results
 * 
 * Requirements: 6.3, 6.4, 6.5
 */

import { StyleSheet, View, ScrollView, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { SearchFilters } from '@/types/user';

/** Filter dropdown type */
export type FilterType = 'genre' | 'country' | 'year' | null;

/** Genre filter options */
export const SEARCH_GENRE_OPTIONS = [
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

/** Country filter options */
export const SEARCH_COUNTRY_OPTIONS = [
  { code: null, name: 'All Countries' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
];

/** Year filter options */
const currentYear = new Date().getFullYear();
export const SEARCH_YEAR_OPTIONS = [
  { value: null, label: 'All Years' },
  ...Array.from({ length: 15 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
  })),
];

/** Default search filters */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  genre: null,
  country: null,
  year: null,
  sortBy: 'popularity',
};

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  hasDropdown?: boolean;
  onPress: () => void;
}

function FilterChip({ label, isSelected, hasDropdown = false, onPress }: FilterChipProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
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
      {hasDropdown && (
        <Ionicons
          name="chevron-down"
          size={14}
          color={isSelected ? Colors.light.background : textColor}
          style={{ opacity: 0.7 }}
        />
      )}
    </Pressable>
  );
}

interface SearchFiltersComponentProps {
  filters: SearchFilters;
  activeDropdown: FilterType;
  onFiltersChange: (filters: SearchFilters) => void;
  onDropdownToggle: (type: FilterType) => void;
}

export function SearchFiltersComponent({ 
  filters, 
  activeDropdown, 
  onFiltersChange, 
  onDropdownToggle 
}: SearchFiltersComponentProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  const getGenreLabel = () => {
    const genre = SEARCH_GENRE_OPTIONS.find(g => g.id === filters.genre);
    return genre?.name || 'All Genres';
  };

  const getCountryLabel = () => {
    const country = SEARCH_COUNTRY_OPTIONS.find(c => c.code === filters.country);
    return country?.name || 'All Countries';
  };

  const getYearLabel = () => {
    const year = SEARCH_YEAR_OPTIONS.find(y => y.value === filters.year);
    return year?.label || 'All Years';
  };

  const handleGenreSelect = (genreId: number | null) => {
    onFiltersChange({ ...filters, genre: genreId });
    onDropdownToggle(null);
  };

  const handleCountrySelect = (countryCode: string | null) => {
    onFiltersChange({ ...filters, country: countryCode });
    onDropdownToggle(null);
  };

  const handleYearSelect = (year: number | null) => {
    onFiltersChange({ ...filters, year });
    onDropdownToggle(null);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        <FilterChip
          label={getGenreLabel()}
          isSelected={activeDropdown === 'genre' || filters.genre !== null}
          hasDropdown
          onPress={() => onDropdownToggle(activeDropdown === 'genre' ? null : 'genre')}
        />
        
        <FilterChip
          label={getCountryLabel()}
          isSelected={activeDropdown === 'country' || filters.country !== null}
          hasDropdown
          onPress={() => onDropdownToggle(activeDropdown === 'country' ? null : 'country')}
        />
        
        <FilterChip
          label={getYearLabel()}
          isSelected={activeDropdown === 'year' || filters.year !== null}
          hasDropdown
          onPress={() => onDropdownToggle(activeDropdown === 'year' ? null : 'year')}
        />
      </ScrollView>

      {/* Dropdown Menus */}
      {activeDropdown === 'genre' && (
        <View style={[styles.dropdown, { backgroundColor: cardBackground, borderColor }]}>
          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
            {SEARCH_GENRE_OPTIONS.map((genre) => (
              <Pressable
                key={genre.id || 'all'}
                onPress={() => handleGenreSelect(genre.id)}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Text style={[styles.dropdownItemText, { color: textColor }]}>
                  {genre.name}
                </Text>
                {filters.genre === genre.id && (
                  <Ionicons name="checkmark" size={16} color={textColor} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {activeDropdown === 'country' && (
        <View style={[styles.dropdown, { backgroundColor: cardBackground, borderColor }]}>
          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
            {SEARCH_COUNTRY_OPTIONS.map((country) => (
              <Pressable
                key={country.code || 'all'}
                onPress={() => handleCountrySelect(country.code)}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Text style={[styles.dropdownItemText, { color: textColor }]}>
                  {country.name}
                </Text>
                {filters.country === country.code && (
                  <Ionicons name="checkmark" size={16} color={textColor} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {activeDropdown === 'year' && (
        <View style={[styles.dropdown, { backgroundColor: cardBackground, borderColor }]}>
          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
            {SEARCH_YEAR_OPTIONS.map((year) => (
              <Pressable
                key={year.value || 'all'}
                onPress={() => handleYearSelect(year.value)}
                style={({ pressed }) => [
                  styles.dropdownItem,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Text style={[styles.dropdownItemText, { color: textColor }]}>
                  {year.label}
                </Text>
                {filters.year === year.value && (
                  <Ionicons name="checkmark" size={16} color={textColor} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filtersRow: {
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  dropdown: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dropdownItemText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
});