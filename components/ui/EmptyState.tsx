/**
 * EmptyState Component
 * Displays empty state with suggestions
 * 
 * Requirements: 6.5, 17.2
 */

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export interface EmptyStateProps {
  /** Title to display */
  title: string;
  /** Description message */
  message?: string;
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Suggestions to display */
  suggestions?: string[];
  /** Action button text */
  actionText?: string;
  /** Callback when action button is pressed */
  onAction?: () => void;
  /** Test ID for testing purposes */
  testID?: string;
}

export function EmptyState({
  title,
  message,
  icon = 'search-outline',
  suggestions,
  actionText,
  onAction,
  testID,
}: EmptyStateProps) {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLabel={`${title}${message ? `. ${message}` : ''}`}
    >
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons
          name={icon}
          size={48}
          color={tintColor}
        />
      </View>
      
      <Text style={[styles.title, { color: textColor }]}>
        {title}
      </Text>
      
      {message && (
        <Text style={[styles.message, { color: textSecondary }]}>
          {message}
        </Text>
      )}
      
      {suggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <View
              key={index}
              style={[styles.suggestionItem, { backgroundColor: colors.backgroundSecondary }]}
            >
              <View style={[styles.suggestionBullet, { backgroundColor: tintColor }]} />
              <Text style={[styles.suggestionText, { color: textSecondary }]}>
                {suggestion}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {actionText && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionText}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: tintColor, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.actionText}>{actionText}</Text>
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
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xl,
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
  suggestionsContainer: {
    width: '100%',
    maxWidth: 280,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  suggestionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.sm,
  },
  suggestionText: {
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  actionButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});

export default EmptyState;