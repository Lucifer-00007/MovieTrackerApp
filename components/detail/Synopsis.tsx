/**
 * Synopsis Component
 * Displays expandable/collapsible synopsis text
 * 
 * Requirements: 4.3
 */

import { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, ComponentTokens } from '@/constants/theme';
import { shouldSynopsisExpand } from './detail-utils';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLLAPSED_LINES = ComponentTokens.synopsis.collapsedLines;

export interface SynopsisProps {
  /** Synopsis text to display */
  overview: string;
  /** Test ID for testing */
  testID?: string;
}

export function Synopsis({ overview, testID }: SynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  const isExpandable = shouldSynopsisExpand(overview);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  }, []);

  if (!overview) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text
        style={[styles.sectionTitle, { color: textColor }]}
        accessibilityRole="header"
      >
        Synopsis
      </Text>
      
      <Text
        style={[styles.overview, { color: textSecondary }]}
        numberOfLines={isExpanded ? undefined : COLLAPSED_LINES}
        testID={testID ? `${testID}-text` : undefined}
      >
        {overview}
      </Text>

      {isExpandable && (
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [
            styles.toggleButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Show less' : 'Show more'}
          accessibilityHint={isExpanded ? 'Collapse synopsis' : 'Expand synopsis'}
          testID={testID ? `${testID}-toggle` : undefined}
        >
          <Text style={[styles.toggleText, { color: tintColor }]}>
            {isExpanded ? 'Show Less' : 'Show More'}
          </Text>
        </Pressable>
      )}
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
    marginBottom: Spacing.sm,
  },
  overview: {
    fontSize: Typography.sizes.md,
    lineHeight: Typography.sizes.md * Typography.lineHeights.relaxed,
  },
  toggleButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});

export default Synopsis;
