import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TrailerScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityLabel="Close trailer"
          accessibilityRole="button"
        >
          <IconSymbol name="xmark" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
      
      <View style={styles.playerContainer}>
        <View style={[styles.playerPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          <IconSymbol name="play.fill" size={48} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>Trailer Player</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Video key: {key}
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Video player will be implemented here
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
  },
  playerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerPlaceholder: {
    width: '90%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
});
