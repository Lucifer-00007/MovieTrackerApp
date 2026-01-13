/**
 * Completed Downloads List Component
 * Displays downloaded content that's ready to watch
 * 
 * Requirements: 11.1, 11.6
 */

import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { EmptyState } from '@/components/ui/EmptyState';
import type { DownloadItem } from '@/types/downloads';

interface CompletedDownloadsListProps {
  downloads: DownloadItem[];
  onRemove: (item: DownloadItem) => void;
}

interface DownloadItemProps {
  item: DownloadItem;
  onRemove: (item: DownloadItem) => void;
}

function DownloadItemComponent({ item, onRemove }: DownloadItemProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handlePress = () => {
    // Navigate to detail screen or play content
    const route = item.mediaType === 'movie' ? '/movie/[id]' : '/tv/[id]';
    router.push({
      pathname: route,
      params: { id: item.mediaId.toString() },
    });
  };

  const handleRemovePress = () => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${item.title}" from your downloads?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(item),
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.downloadItem,
        {
          backgroundColor,
          borderColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title}`}
    >
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
          <View style={styles.typeContainer}>
            <Ionicons
              name={item.mediaType === 'movie' ? 'film' : 'tv'}
              size={14}
              color={textColor}
              style={{ opacity: 0.7 }}
            />
            <Text style={[styles.typeText, { color: textColor, opacity: 0.7 }]}>
              {item.mediaType === 'movie' ? 'Movie' : 'Series'}
            </Text>
          </View>

          <Text style={[styles.quality, { color: textColor, opacity: 0.7 }]}>
            {item.quality}
          </Text>
        </View>

        <View style={styles.details}>
          <Text style={[styles.size, { color: textColor, opacity: 0.7 }]}>
            {formatFileSize(item.fileSize)}
          </Text>
          <Text style={[styles.date, { color: textColor, opacity: 0.7 }]}>
            Downloaded {formatDate(item.downloadedAt)}
          </Text>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: Colors.light.success }]} />
          <Text style={[styles.statusText, { color: Colors.light.success }]}>
            Ready to Watch
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.playButton,
            {
              backgroundColor: Colors.light.tint,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityLabel="Play content"
        >
          <Ionicons name="play" size={20} color={Colors.light.background} />
        </Pressable>

        <Pressable
          onPress={handleRemovePress}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityLabel="Remove download"
        >
          <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export function CompletedDownloadsList({ downloads, onRemove }: CompletedDownloadsListProps) {
  const textColor = useThemeColor({}, 'text');

  if (downloads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No Downloads"
          message="Downloaded content will appear here"
          iconName="download-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        Downloaded ({downloads.length})
      </Text>

      {downloads.map((item) => (
        <DownloadItemComponent
          key={item.id}
          item={item}
          onRemove={onRemove}
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
  downloadItem: {
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
    alignItems: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  quality: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  size: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  date: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
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
    alignItems: 'center',
    gap: Spacing.xs,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    padding: Spacing.md,
  },
});