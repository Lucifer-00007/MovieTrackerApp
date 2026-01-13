/**
 * ErrorState Component
 * Displays error messages with retry functionality
 * 
 * Requirements: 16.2, 16.5, 16.6
 */

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { SOLID_COLORS } from '@/constants/colors';
import { ICON_NAMES } from '@/constants/test-ids';

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message to display */
  message: string;
  /** Callback when retry button is pressed */
  onRetry?: () => void;
  /** Custom retry button text */
  retryText?: string;
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Test ID for testing purposes */
  testID?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  icon = ICON_NAMES.ALERT_CIRCLE,
  testID,
}: ErrorStateProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const errorColor = useThemeColor({}, 'error');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  return (
    <View
      style={[styles.container, { backgroundColor }]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${title}. ${message}`}
    >
      <Ionicons
        name={icon}
        size={48}
        color={errorColor}
        style={styles.icon}
      />
      
      <Text style={[styles.title, { color: textColor }]}>
        {title}
      </Text>
      
      <Text style={[styles.message, { color: textSecondary }]}>
        {message}
      </Text>
      
      {onRetry && (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryText}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: tintColor, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="refresh" size={20} color={SOLID_COLORS.WHITE} />
          <Text style={styles.retryText}>{retryText}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
  },
  icon: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
  },
  retryText: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});

export default ErrorState;
