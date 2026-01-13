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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { COUNTRY_GRADIENTS, OVERLAY_COLORS } from '@/constants/colors';
import { DIMENSIONS } from '@/constants/layout';
import {
  SUPPORTED_COUNTRIES,
  getCountryIcon,
  getRegionLabel,
  getContentCount,
  type CountryConfig,
} from '@/constants/countries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = Spacing.md;
const GRID_GAP = Spacing.sm;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

/** Get gradient colors for each country */
function getCountryGradient(code: string, isDark: boolean): readonly [string, string] {
  const countryGradient = COUNTRY_GRADIENTS[code as keyof typeof COUNTRY_GRADIENTS];
  if (countryGradient) {
    return isDark ? countryGradient.dark : countryGradient.light;
  }
  return isDark ? COUNTRY_GRADIENTS.default.dark : COUNTRY_GRADIENTS.default.light;
}

/** Props for country card component */
interface CountryCardProps {
  country: CountryConfig;
  onPress: () => void;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  isDark: boolean;
}

/** Country card component */
function CountryCard({ country, onPress, colors, isDark }: CountryCardProps) {
  const gradient = getCountryGradient(country.code, isDark);
  const icon = getCountryIcon(country.code);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Browse content from ${country.name}`}
      accessibilityHint="Double tap to view top content from this country"
      style={({ pressed }) => [
        styles.countryCard,
        {
          borderColor: colors.cardBorder,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Flag and Icon Row */}
        <View style={styles.cardHeader}>
          <Text style={styles.countryFlag} accessibilityLabel={`${country.name} flag`}>
            {country.flag}
          </Text>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? OVERLAY_COLORS.WHITE_10 : OVERLAY_COLORS.BLACK_05 }]}>
            <Ionicons name={icon} size={16} color={colors.textSecondary} />
          </View>
        </View>

        {/* Country Info */}
        <View style={styles.cardBody}>
          <Text style={[styles.countryName, { color: colors.text }]}>
            {country.name}
          </Text>
          <Text style={[styles.countryRegion, { color: colors.textSecondary }]}>
            {getRegionLabel(country.code)}
          </Text>
        </View>

        {/* Footer with count */}
        <View style={styles.cardFooter}>
          <View style={[styles.countBadge, { backgroundColor: isDark ? OVERLAY_COLORS.WHITE_10 : OVERLAY_COLORS.BLACK_05 }]}>
            <Ionicons name="play-circle" size={12} color={colors.tint} />
            <Text style={[styles.countText, { color: colors.textMuted }]}>
              {getContentCount(country.code)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
              Browse by Country
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Discover regional content worldwide
            </Text>
          </View>
        </View>
        
        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>7</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Regions</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>34K+</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Titles</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>15+</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Languages</Text>
          </View>
        </View>
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
              colors={colors}
              isDark={isDark}
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
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerIcon: {
    width: DIMENSIONS.BROWSE_HEADER_ICON,
    height: DIMENSIONS.BROWSE_HEADER_ICON,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  headerText: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: DIMENSIONS.BROWSE_STAT_DIVIDER,
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: Spacing.md,
    minHeight: 160,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  countryFlag: {
    fontSize: DIMENSIONS.BROWSE_FLAG_SIZE,
  },
  iconBadge: {
    width: DIMENSIONS.ICON_LG,
    height: DIMENSIONS.ICON_LG,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  countryName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: 2,
  },
  countryRegion: {
    fontSize: Typography.sizes.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  countText: {
    fontSize: Typography.sizes.xs,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
