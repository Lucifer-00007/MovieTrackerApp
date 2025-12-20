/**
 * EmptyState Component
 * Displays empty state with suggestions
 * 
 * Requirements: 6.5, 17.2
 */

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';

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
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textMuted = useThemeColor({}, 'textMuted');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View
      style={[styles.container, { backgroundColor }]}
      testID={testID}
      accessibilityLabel={`${title}${message ? `. ${message}` : ''}`}
    >
      <Ionicons
        name={icon}
        size={64}
        color={textMuted}
        style={styles.icon}
      />
      
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
          <Text style={[styles.suggestionsTitle, { color: textSecondary }]}>
            Try:
          </Text>
          {suggestions.map((suggestion, index) => (
            <View
              key={index}
              style={[styles.suggestionItem, { borderColor }]}
            >
              <Text style={[styles.suggestionText, { color: textColor }]}>
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
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
  },
  icon: {
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
    marginTop: Spacing.md,
  },
  suggestionsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  suggestionItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  suggestionText: {
    fontSize: Typography.sizes.sm,
  },
  actionButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
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
