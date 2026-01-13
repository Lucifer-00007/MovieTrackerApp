/**
 * Country Hub Header Component
 * Displays country information and navigation
 * 
 * Requirements: 3.1, 3.2
 */

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Typography } from '@/constants/theme';
import { getCountryConfig } from '@/constants/countries';

interface CountryHubHeaderProps {
  countryCode: string;
}

export function CountryHubHeader({ countryCode }: CountryHubHeaderProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  
  const country = getCountryConfig(countryCode);
  const countryName = country?.name || countryCode.toUpperCase();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [
          styles.backButton,
          { opacity: pressed ? 0.7 : 1 }
        ]}
      >
        <IconSymbol
          name="chevron.left"
          size={24}
          color={tintColor}
        />
      </Pressable>
      
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {countryName}
        </Text>
        <Text style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
          Popular Content
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    lineHeight: Typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
});