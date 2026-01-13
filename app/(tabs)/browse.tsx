/**
 * Browse Screen - Country Selection
 * Displays a grid of supported countries for browsing regional content
 * 
 * Requirements: 3.1
 */

import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SUPPORTED_COUNTRIES, type CountryConfig } from '@/types/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = Spacing.md;
const GRID_GAP = Spacing.md;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

/** Props for country card component */
interface CountryCardProps {
  country: CountryConfig;
  onPress: () => void;
}

/** Country card component */
function CountryCard({ country, onPress }: CountryCardProps) {
  const cardBackground = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Browse content from ${country.name}`}
      accessibilityHint="Double tap to view top content from this country"
      style={({ pressed }) => [
        styles.countryCard,
        {
          backgroundColor: cardBackground,
          borderColor: cardBorder,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={styles.countryFlag} accessibilityLabel={`${country.name} flag`}>
        {country.flag}
      </Text>
      <Text style={[styles.countryName, { color: textColor }]}>
        {country.name}
      </Text>
      <Text style={[styles.countryRegion, { color: textSecondary }]}>
        {getRegionLabel(country.code)}
      </Text>
    </Pressable>
  );
}

/**
 * Get a friendly region label for a country
 */
function getRegionLabel(code: string): string {
  const labels: Record<string, string> = {
    US: 'Hollywood & More',
    JP: 'Anime & J-Drama',
    IN: 'Bollywood & Regional',
    CN: 'Chinese Cinema',
    RU: 'Russian Films',
    ES: 'Spanish Content',
    DE: 'German Productions',
  };
  return labels[code] || 'Regional Content';
}

export default function BrowseScreen() {
  const router = useRouter();
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleCountryPress = useCallback(
    (countryCode: string) => {
      router.push(`/country/${countryCode}` as any);
    },
    [router]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: textColor }]}
          accessibilityRole="header"
        >
          Browse by Country
        </Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Discover the best content from around the world
        </Text>
      </View>

      {/* Country Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="browse-country-grid"
      >
        <View style={styles.grid}>
          {SUPPORTED_COUNTRIES.map((country) => (
            <CountryCard
              key={country.code}
              country={country}
              onPress={() => handleCountryPress(country.code)}
            />
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GRID_PADDING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  countryCard: {
    width: CARD_WIDTH,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  countryFlag: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  countryName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  countryRegion: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
