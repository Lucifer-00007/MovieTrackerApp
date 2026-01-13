/**
 * Download Queue List Component
 * Displays active downloads and queue
 * 
 * Requirements: 11.3, 11.4, 11.5
 */

import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DownloadQueueItem } from '@/types/downloads';

interface DownloadQueueListProps {
  queue: DownloadQueueItem[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (item: DownloadQueueItem) => void;
}

interface QueueItemProps {
  item: DownloadQueueItem;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (item: DownloadQueueItem) => void;
}

function QueueItem({ item, onPause, onResume, onCancel }: QueueItemProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return Colors.light.tint;
      case 'paused':
        return Colors.light.warning;
      case 'error':
        return Colors.light.error;
      case 'queued':
        return Colors.light.textSecondary;
      default:
        return Colors.light.success;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Download',
      `Are you sure you want to cancel downloading "${item.title}"?`,
      [
        { text: 'Keep Downloading', style: 'cancel' },
        {
          text: 'Cancel Download',
          style: 'destructive',
          onPress: () => onCancel(item),
        },
      ]
    );
  };

  return (
    <View style={[styles.queueItem, { backgroundColor, borderColor }]}>
      {/* Poster */}
      <Image
        source={{ uri: item.posterUrl }}
        style={styles.poster}
        contentFit="cover"
        transition={200}
      />

      {/* Content Info */}
      <View style={styles.contentInfo}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.metadata}>
          <Text style={[styles.quality, { color: textColor, opacity: 0.7 }]}>
            {item.quality}
          </Text>
          <Text style={[styles.size, { color: textColor, opacity: 0.7 }]}>
            {formatFileSize(item.totalSize)}
          </Text>
        </View>

        {/* Progress */}
        {item.status === 'downloading' && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: Colors.light.border }]}>
              <LinearGradient
                colors={[Colors.light.tint, Colors.light.tint]}
                style={[
                  styles.progressBarFill,
                  { width: `${item.progress}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: textColor, opacity: 0.7 }]}>
              {item.progress.toFixed(1)}%
            </Text>
          </View>
        )}

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {item.status === 'downloading' && (
          <Pressable
            onPress={() => onPause(item.id)}
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel="Pause download"
          >
            <Ionicons name="pause" size={20} color={textColor} />
          </Pressable>
        )}

        {item.status === 'paused' && (
          <Pressable
            onPress={() => onResume(item.id)}
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel="Resume download"
          >
            <Ionicons name="play" size={20} color={textColor} />
          </Pressable>
        )}

        <Pressable
          onPress={handleCancelPress}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityLabel="Cancel download"
        >
          <Ionicons name="close" size={20} color={Colors.light.error} />
        </Pressable>
      </View>
    </View>
  );
}

export function DownloadQueueList({ queue, onPause, onResume, onCancel }: DownloadQueueListProps) {
  const textColor = useThemeColor({}, 'text');

  if (queue.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No Active Downloads"
          message="Your download queue is empty"
          iconName="download-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Download Queue ({queue.length})
      </Text>

      {queue.map((item) => (
        <QueueItem
          key={item.id}
          item={item}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  queueItem: {
    flexDirection: 'row',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: BorderRadius.sm,
  },
  contentInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    lineHeight: Typography.lineHeights.tight,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quality: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  size: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  progressContainer: {
    gap: 4,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    padding: Spacing.md,
  },
});