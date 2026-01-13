/**
 * Downloads Header Component
 * Displays storage usage and download statistics
 * 
 * Requirements: 11.1, 11.2
 */

import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

interface DownloadsHeaderProps {
  storageUsed: number;
  storageAvailable: number;
  totalDownloads: number;
  activeDownloads: number;
}

export function DownloadsHeader({
  storageUsed,
  storageAvailable,
  totalDownloads,
  activeDownloads,
}: DownloadsHeaderProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStoragePercentage = (): number => {
    const total = storageUsed + storageAvailable;
    return total > 0 ? (storageUsed / total) * 100 : 0;
  };

  const storagePercentage = getStoragePercentage();

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={[styles.title, { color: textColor }]}>
        Downloads
      </Text>

      {/* Storage Usage */}
      <View style={[styles.storageContainer, { backgroundColor }]}>
        <View style={styles.storageHeader}>
          <Text style={[styles.storageTitle, { color: textColor }]}>
            Storage Usage
          </Text>
          <Text style={[styles.storagePercentage, { color: textColor }]}>
            {storagePercentage.toFixed(1)}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBarContainer, { backgroundColor: Colors.light.border }]}>
          <LinearGradient
            colors={[tintColor, tintColor]}
            style={[
              styles.progressBar,
              { width: `${Math.min(storagePercentage, 100)}%` },
            ]}
          />
        </View>

        <View style={styles.storageDetails}>
          <Text style={[styles.storageText, { color: textColor, opacity: 0.7 }]}>
            Used: {formatFileSize(storageUsed)}
          </Text>
          <Text style={[styles.storageText, { color: textColor, opacity: 0.7 }]}>
            Available: {formatFileSize(storageAvailable)}
          </Text>
        </View>
      </View>

      {/* Download Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor }]}>
          <Text style={[styles.statNumber, { color: textColor }]}>
            {totalDownloads}
          </Text>
          <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
            Total Downloads
          </Text>
        </View>

        <View style={[styles.statItem, { backgroundColor }]}>
          <Text style={[styles.statNumber, { color: tintColor }]}>
            {activeDownloads}
          </Text>
          <Text style={[styles.statLabel, { color: textColor, opacity: 0.7 }]}>
            Active Downloads
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  storageContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  storagePercentage: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  storageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    marginTop: 4,
  },
});