/**
 * ProviderList Component
 * Displays streaming providers with logos and availability status
 * Groups providers by type (subscription, rent, buy)
 * 
 * Requirements: 4.6, 16.3
 */

import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { StreamingProvider } from '@/types/media';
import {
  getProviderLogoUrl,
  shouldShowProviders,
  groupProvidersByType,
  generateProviderAccessibilityLabel,
} from './detail-utils';

const LOGO_SIZE = 48;

export interface ProviderListProps {
  /** Array of streaming providers */
  providers: StreamingProvider[];
  /** Test ID for testing */
  testID?: string;
}

interface ProviderGroupProps {
  title: string;
  providers: StreamingProvider[];
  onProviderPress: (provider: StreamingProvider) => void;
  testID?: string;
}

function ProviderGroup({ title, providers, onProviderPress, testID }: ProviderGroupProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const providerUnavailable = useThemeColor({}, 'providerUnavailable');

  if (providers.length === 0) return null;

  return (
    <View style={styles.groupContainer}>
      <Text style={[styles.groupTitle, { color: textSecondary }]}>
        {title}
      </Text>
      <View style={styles.providersRow}>
        {providers.map((provider) => {
          const logoUrl = getProviderLogoUrl(provider.logoPath);
          const accessibilityLabel = generateProviderAccessibilityLabel(provider);
          const isUnavailable = !provider.isAvailable;

          return (
            <Pressable
              key={`${provider.providerId}-${provider.type}`}
              onPress={() => onProviderPress(provider)}
              disabled={isUnavailable}
              style={({ pressed }) => [
                styles.providerItem,
                { 
                  backgroundColor: cardBackground,
                  borderColor: cardBorder,
                  opacity: pressed ? 0.7 : isUnavailable ? 0.5 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              accessibilityHint={isUnavailable ? 'Currently unavailable' : 'Double tap to open streaming service'}
              accessibilityState={{ disabled: isUnavailable }}
              testID={testID ? `${testID}-provider-${provider.providerId}` : undefined}
            >
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={[
                    styles.providerLogo,
                    isUnavailable && styles.unavailableLogo,
                  ]}
                  contentFit="contain"
                  transition={200}
                />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: cardBorder }]}>
                  <Text style={[styles.logoPlaceholderText, { color: textSecondary }]}>
                    {provider.providerName.charAt(0)}
                  </Text>
                </View>
              )}
              
              <Text
                style={[
                  styles.providerName,
                  { color: isUnavailable ? providerUnavailable : textColor },
                ]}
                numberOfLines={1}
              >
                {provider.providerName}
              </Text>
              
              {isUnavailable && (
                <Text style={[styles.unavailableLabel, { color: providerUnavailable }]}>
                  Unavailable
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ProviderList({ providers, testID }: ProviderListProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleProviderPress = useCallback(async (provider: StreamingProvider) => {
    if (!provider.isAvailable || !provider.link) return;
    
    try {
      const canOpen = await Linking.canOpenURL(provider.link);
      if (canOpen) {
        await Linking.openURL(provider.link);
      }
    } catch (error) {
      console.error('Failed to open provider link:', error);
    }
  }, []);

  // Show "not available" message if no providers
  if (!shouldShowProviders(providers)) {
    return (
      <View style={styles.container} testID={testID}>
        <Text
          style={[styles.sectionTitle, { color: textColor }]}
          accessibilityRole="header"
        >
          Where to Watch
        </Text>
        <Text
          style={[styles.emptyMessage, { color: textSecondary }]}
          testID={testID ? `${testID}-empty` : undefined}
        >
          Not available for streaming
        </Text>
      </View>
    );
  }

  const grouped = groupProvidersByType(providers);

  return (
    <View style={styles.container} testID={testID}>
      <Text
        style={[styles.sectionTitle, { color: textColor }]}
        accessibilityRole="header"
      >
        Where to Watch
      </Text>
      
      <ProviderGroup
        title="Stream"
        providers={grouped.flatrate}
        onProviderPress={handleProviderPress}
        testID={testID ? `${testID}-flatrate` : undefined}
      />
      
      <ProviderGroup
        title="Rent"
        providers={grouped.rent}
        onProviderPress={handleProviderPress}
        testID={testID ? `${testID}-rent` : undefined}
      />
      
      <ProviderGroup
        title="Buy"
        providers={grouped.buy}
        onProviderPress={handleProviderPress}
        testID={testID ? `${testID}-buy` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
  },
  emptyMessage: {
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
  },
  groupContainer: {
    marginBottom: Spacing.md,
  },
  groupTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  providerItem: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 80,
    minHeight: 44,
  },
  providerLogo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  unavailableLogo: {
    opacity: 0.5,
  },
  logoPlaceholder: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  logoPlaceholderText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  providerName: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
  unavailableLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
});

export default ProviderList;
