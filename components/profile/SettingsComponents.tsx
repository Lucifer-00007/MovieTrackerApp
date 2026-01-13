/**
 * Settings Components for Profile Screen
 * Reusable settings UI components
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

/** Settings section props */
export interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  testID?: string;
}

/** Settings section component */
export function SettingsSection({ title, children, testID }: SettingsSectionProps) {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.settingsSection} testID={testID}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {children}
      </View>
    </View>
  );
}

/** Settings row props */
export interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  testID?: string;
}

/** Settings row component */
export function SettingsRow({
  title,
  subtitle,
  icon,
  onPress,
  rightElement,
  testID,
}: SettingsRowProps) {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
    >
      <View style={styles.settingsRowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.tint} />
        <View style={styles.settingsRowText}>
          <Text style={[styles.settingsRowTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingsRowSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

/** Settings separator component */
export function SettingsSeparator() {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  return <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />;
}

const styles = StyleSheet.create({
  settingsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 60,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsRowText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingsRowTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  settingsRowSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  separator: {
    height: 1,
    marginLeft: Spacing.md + 20 + Spacing.md,
  },
});
