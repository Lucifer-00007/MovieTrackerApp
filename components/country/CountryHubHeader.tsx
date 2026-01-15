/**
 * Country Hub Header Component
 * Premium header design with enhanced visual elements and interactivity
 * 
 * Requirements: 3.1, 3.2
 */

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { getCountryConfig } from '@/constants/countries';

interface CountryHubHeaderProps {
  countryCode: string;
}

export function CountryHubHeader({ countryCode }: CountryHubHeaderProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'card');
  
  const country = getCountryConfig(countryCode);
  const countryName = country?.name || countryCode.toUpperCase();

  // Animation values
  const headerScale = useSharedValue(1);
  const flagRotation = useSharedValue(0);

  // Get comprehensive country information
  const getCountryInfo = (code: string) => {
    const countryData: Record<string, { 
      flag: string; 
      description: string; 
      timezone: string;
      popularGenres: string[];
      totalContent: string;
      gradient: string[];
    }> = {
      'DE': { 
        flag: '🇩🇪', 
        description: 'European Cinema Hub', 
        timezone: 'CET',
        popularGenres: ['Drama', 'Thriller', 'Documentary'],
        totalContent: '2.5K+',
        gradient: ['#FF6B6B', '#4ECDC4']
      },
      'US': { 
        flag: '🇺🇸', 
        description: 'Hollywood & Beyond', 
        timezone: 'PST/EST',
        popularGenres: ['Action', 'Comedy', 'Sci-Fi'],
        totalContent: '15K+',
        gradient: ['#667eea', '#764ba2']
      },
      'GB': { 
        flag: '🇬🇧', 
        description: 'British Productions', 
        timezone: 'GMT',
        popularGenres: ['Drama', 'Comedy', 'Mystery'],
        totalContent: '3.2K+',
        gradient: ['#f093fb', '#f5576c']
      },
      'FR': { 
        flag: '🇫🇷', 
        description: 'French Cinema', 
        timezone: 'CET',
        popularGenres: ['Romance', 'Drama', 'Art House'],
        totalContent: '2.8K+',
        gradient: ['#4facfe', '#00f2fe']
      },
      'JP': { 
        flag: '🇯🇵', 
        description: 'Anime & J-Drama', 
        timezone: 'JST',
        popularGenres: ['Anime', 'Drama', 'Horror'],
        totalContent: '8.5K+',
        gradient: ['#fa709a', '#fee140']
      },
      'KR': { 
        flag: '🇰🇷', 
        description: 'K-Drama & K-Movies', 
        timezone: 'KST',
        popularGenres: ['Romance', 'Thriller', 'Drama'],
        totalContent: '4.1K+',
        gradient: ['#a8edea', '#fed6e3']
      },
    };
    return countryData[code] || { 
      flag: '🌍', 
      description: 'International Content', 
      timezone: 'UTC',
      popularGenres: ['Drama', 'Action', 'Comedy'],
      totalContent: '1K+',
      gradient: ['#667eea', '#764ba2']
    };
  };

  const countryInfo = getCountryInfo(countryCode);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const flagAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flagRotation.value}deg` }],
  }));

  const handleHeaderPress = () => {
    headerScale.value = withSpring(0.98, { duration: 150 });
    setTimeout(() => {
      headerScale.value = withSpring(1, { duration: 150 });
    }, 100);
  };

  const handleFlagPress = () => {
    flagRotation.value = withSpring(flagRotation.value + 180, { duration: 800 });
  };

  return (
    <View style={styles.container}>
      {/* Dynamic background with country-specific gradient */}
      <LinearGradient
        colors={[
          countryInfo.gradient[0] + '40',
          countryInfo.gradient[1] + '30',
          countryInfo.gradient[0] + '20',
          'transparent'
        ]}
        style={styles.backgroundGradient}
        locations={[0, 0.4, 0.7, 1]}
      />
      
      {/* Animated decorative elements */}
      <View style={[styles.decorativeElement, styles.element1, { backgroundColor: countryInfo.gradient[0] + '15' }]} />
      <View style={[styles.decorativeElement, styles.element2, { backgroundColor: countryInfo.gradient[1] + '10' }]} />
      <View style={[styles.decorativeElement, styles.element3, { backgroundColor: countryInfo.gradient[0] + '08' }]} />
      
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        {/* Header Row with Navigation and Country Identity */}
        <View style={styles.headerRow}>
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backButton,
              { 
                backgroundColor: cardBackground + 'F0',
                transform: [{ scale: pressed ? 0.9 : 1 }]
              }
            ]}
          >
            <IconSymbol name="chevron.left" size={20} color={textColor} />
          </Pressable>

          {/* Country Identity - Main Content */}
          <Pressable onPress={handleHeaderPress} style={styles.mainContent}>
            <View style={styles.countryIdentity}>
              <Pressable onPress={handleFlagPress}>
                <Animated.View style={[styles.flagContainer, flagAnimatedStyle]}>
                  <LinearGradient
                    colors={[countryInfo.gradient[0] + '30', countryInfo.gradient[1] + '20']}
                    style={styles.flagBackground}
                  />
                  <Text style={styles.flag}>{countryInfo.flag}</Text>
                  <View style={[styles.flagRing, { borderColor: countryInfo.gradient[0] + '40' }]} />
                </Animated.View>
              </Pressable>
              
              <View style={styles.countryDetails}>
                <Text style={[styles.countryName, { color: textColor }]}>
                  {countryName}
                </Text>
                <Text style={[styles.countryDescription, { color: countryInfo.gradient[0] }]}>
                  {countryInfo.description}
                </Text>
                
                {/* Enhanced Meta Information */}
                <View style={styles.metaContainer}>
                  <View style={[styles.metaBadge, { backgroundColor: cardBackground + 'CC' }]}>
                    <Ionicons name="library-outline" size={12} color={textSecondary} />
                    <Text style={[styles.metaText, { color: textSecondary }]}>{countryInfo.totalContent}</Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: cardBackground + 'CC' }]}>
                    <Ionicons name="trending-up" size={12} color={textSecondary} />
                    <Text style={[styles.metaText, { color: textSecondary }]}>Live</Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Enhanced Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: cardBackground + 'E6' }]}>
            <LinearGradient
              colors={[countryInfo.gradient[0] + '20', countryInfo.gradient[0] + '10']}
              style={styles.statIconContainer}
            >
              <Ionicons name="film" size={18} color={countryInfo.gradient[0]} />
            </LinearGradient>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: textColor }]}>Movies</Text>
              <Text style={[styles.statSubtext, { color: textSecondary }]}>Popular</Text>
            </View>
            <View style={[styles.statIndicator, { backgroundColor: countryInfo.gradient[0] }]} />
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardBackground + 'E6' }]}>
            <LinearGradient
              colors={[countryInfo.gradient[1] + '20', countryInfo.gradient[1] + '10']}
              style={styles.statIconContainer}
            >
              <Ionicons name="tv" size={18} color={countryInfo.gradient[1]} />
            </LinearGradient>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: textColor }]}>Series</Text>
              <Text style={[styles.statSubtext, { color: textSecondary }]}>Trending</Text>
            </View>
            <View style={[styles.statIndicator, { backgroundColor: countryInfo.gradient[1] }]} />
          </View>
        </View>
      </Animated.View>

      {/* Enhanced Bottom Accent */}
      <LinearGradient
        colors={[countryInfo.gradient[0] + '80', countryInfo.gradient[1] + '60', 'transparent']}
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
    paddingTop: Spacing.xxxl,
    overflow: 'hidden',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeElement: {
    position: 'absolute',
    borderRadius: 100,
  },
  element1: {
    width: 150,
    height: 150,
    top: -60,
    right: -40,
  },
  element2: {
    width: 100,
    height: 100,
    top: 80,
    right: 120,
  },
  element3: {
    width: 80,
    height: 80,
    top: 40,
    left: -20,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainContent: {
    flex: 1,
  },
  moreButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countryIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  flagContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flagBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
  },
  flag: {
    fontSize: 32,
    zIndex: 2,
  },
  flagRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
  },
  countryDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  countryName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.xxl * 1.1,
  },
  countryDescription: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  genresPreview: {
    gap: Spacing.xs,
  },
  genresTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  genresList: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  genreChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  genreText: {
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
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.sizes.md * 1.2,
  },
  statSubtext: {
    fontSize: Typography.sizes.xs,
  },
  statIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  accentLine: {
    height: 4,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    marginTop: Spacing.xs,
  },
});