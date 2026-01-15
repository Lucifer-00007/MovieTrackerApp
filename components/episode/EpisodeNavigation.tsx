/**
 * EpisodeNavigation Component
 * Previous/Next episode navigation buttons
 */

import { StyleSheet, View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS } from '@/constants/colors';

export interface EpisodeNavigationProps {
  currentEpisode: number;
  onPrevious: () => void;
  onNext: () => void;
  testID?: string;
}

export function EpisodeNavigation({
  currentEpisode,
  onPrevious,
  onNext,
  testID,
}: EpisodeNavigationProps) {
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');

  const hasPrevious = currentEpisode > 1;

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        onPress={onPrevious}
        disabled={!hasPrevious}
        style={({ pressed }) => [
          styles.button,
          { 
            backgroundColor: backgroundSecondary,
            opacity: !hasPrevious ? 0.5 : pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Previous episode"
        accessibilityState={{ disabled: !hasPrevious }}
      >
        <Ionicons name="chevron-back" size={20} color={textColor} />
        <Text style={[styles.buttonText, { color: textColor }]}>Previous</Text>
      </Pressable>

      <Pressable
        onPress={onNext}
        style={({ pressed }) => [
          styles.button,
          { 
            backgroundColor: tintColor,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Next episode"
      >
        <Text style={[styles.buttonText, { color: SOLID_COLORS.WHITE }]}>Next</Text>
        <Ionicons name="chevron-forward" size={20} color={SOLID_COLORS.WHITE} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  buttonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});

export default EpisodeNavigation;
