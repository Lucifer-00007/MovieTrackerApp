/**
 * OfflineBanner Component
 * Displays offline status banner with retry functionality
 * 
 * Requirements: 16.1
 */

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography } from '@/constants/theme';

export interface OfflineBannerProps {
  /** Whether the device is offline */
  isOffline: boolean;
  /** Callback when retry button is pressed */
  onRetry?: () => void;
  /** Custom message to display */
  message?: string;
  /** Test ID for testing purposes */
  testID?: string;
}

export function OfflineBanner({
  isOffline,
  onRetry,
  message = "You're offline. Some features may be unavailable.",
  testID,
}: OfflineBannerProps) {
  const warningColor = useThemeColor({}, 'warning');
  const warningLightColor = useThemeColor({}, 'warningLight');
  const textColor = useThemeColor({}, 'text');

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: warningLightColor }]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={`Offline: ${message}`}
    >
      <View style={styles.content}>
        <Ionicons
          name="cloud-offline-outline"
          size={20}
          color={warningColor}
          style={styles.icon}
        />
        <Text style={[styles.message, { color: textColor }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
      
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
          style={({ pressed }) => [
            styles.retryButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="refresh" size={20} color={warningColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  retryButton: {
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OfflineBanner;
