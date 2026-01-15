/**
 * Country Hub Header Component
 * Displays country information and navigation with enhanced visual design
 * 
 * Requirements: 3.1, 3.2
 */

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS } from '@/constants/colors';
import { getCountryConfig } from '@/constants/countries';

interface CountryHubHeaderProps {
  countryCode: string;
}

export function CountryHubHeader({ countryCode }: CountryHubHeaderProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'card');
  
  const country = getCountryConfig(countryCode);
  const countryName = country?.name || countryCode.toUpperCase();

  // Get country flag emoji and info
  const getCountryInfo = (code: string) => {
    const countryData: Record<string, { flag: string; description: string; timezone: string }> = {
      'DE': { flag: '🇩🇪', description: 'European Cinema Hub', timezone: 'CET' },
      'US': { flag: '🇺🇸', description: 'Hollywood & Beyond', timezone: 'PST/EST' },
      'GB': { flag: '🇬🇧', description: 'British Productions', timezone: 'GMT' },
      'FR': { flag: '🇫🇷', description: 'French Cinema', timezone: 'CET' },
      'IT': { flag: '🇮🇹', description: 'Italian Films', timezone: 'CET' },
      'ES': { flag: '🇪🇸', description: 'Spanish Content', timezone: 'CET' },
      'JP': { flag: '🇯🇵', description: 'Anime & J-Drama', timezone: 'JST' },
      'KR': { flag: '🇰🇷', description: 'K-Drama & K-Movies', timezone: 'KST' },
      'IN': { flag: '🇮🇳', description: 'Bollywood & Regional', timezone: 'IST' },
      'CN': { flag: '🇨🇳', description: 'Chinese Cinema', timezone: 'CST' },
    };
    return countryData[code] || { flag: '🌍', description: 'International Content', timezone: 'UTC' };
  };

  const countryInfo = getCountryInfo(countryCode);

  return (
    <View style={styles.container}>
      {/* Enhanced background with multiple gradients */}
      <LinearGradient
        colors={[
          tintColor + '30',
          tintColor + '20', 
          tintColor + '10',
          'transparent'
        ]}
        style={styles.backgroundGradient}
        locations={[0, 0.3, 0.7, 1]}
      />
      
      {/* Decorative elements */}
      <View style={[styles.decorativeCircle, styles.circle1, { backgroundColor: tintColor + '15' }]} />
      <View style={[styles.decorativeCircle, styles.circle2, { backgroundColor: tintColor + '10' }]} />
      
      <View style={styles.header}>
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.backButton,
            { 
              backgroundColor: cardBackground + 'E6',
              transform: [{ scale: pressed ? 0.95 : 1 }]
            }
          ]}
        >
          <IconSymbol
            name="chevron.left"
            size={20}
            color={textColor}
          />
        </Pressable>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Country Flag and Name */}
          <View style={styles.countrySection}>
            <View style={[styles.flagContainer, { backgroundColor: cardBackground + 'CC' }]}>
              <Text style={styles.flag}>{countryInfo.flag}</Text>
              <View style={[styles.flagGlow, { backgroundColor: tintColor + '20' }]} />
            </View>
            
            <View style={styles.countryDetails}>
              <Text style={[styles.countryName, { color: textColor }]}>
                {countryName}
              </Text>
              <Text style={[styles.countryDescription, { color: tintColor }]}>
                {countryInfo.description}
              </Text>
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={textSecondary} />
                  <Text style={[styles.metaText, { color: textSecondary }]}>
                    {countryInfo.timezone}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="trending-up" size={12} color={textSecondary} />
                  <Text style={[styles.metaText, { color: textSecondary }]}>
                    Trending Now
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={[styles.statCard, { backgroundColor: cardBackground + 'B3' }]}>
              <View style={[styles.statIcon, { backgroundColor: tintColor + '20' }]}>
                <Ionicons name="film" size={16} color={tintColor} />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statNumber, { color: textColor }]}>Movies</Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Popular</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: cardBackground + 'B3' }]}>
              <View style={[styles.statIcon, { backgroundColor: tintColor + '20' }]}>
                <Ionicons name="tv" size={16} color={tintColor} />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statNumber, { color: textColor }]}>Series</Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Trending</Text>
              </View>
            </View>
          </View>
        </View>      
      </View>

      {/* Bottom accent line */}
      <LinearGradient
        colors={[tintColor + '60', tintColor + '20', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentLine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingTop: Spacing.xxl + Spacing.md,
    overflow: 'hidden',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  circle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    top: 60,
    right: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  mainContent: {
    flex: 1,
    gap: Spacing.md,
  },
  countrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  flag: {
    fontSize: 25,
    zIndex: 1,
  },
  flagGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xs,
  },
  countryDetails: {
    flex: 1,
  },
  countryName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.xxxl * 1.1,
    marginBottom: 2,
  },
  countryDescription: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  statsSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.sm * 1.2,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  accentLine: {
    height: 3,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
  },
});