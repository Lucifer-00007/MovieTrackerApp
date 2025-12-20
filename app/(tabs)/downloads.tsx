import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import type { DownloadItem, DownloadQueueItem } from '@/types/downloads';

export default function DownloadsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    downloads,
    queue,
    storageUsed,
    storageAvailable,
    isLoading,
    error,
    loadDownloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    clearError,
  } = useDownloadsStore();

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

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

  const handleCancelDownload = (item: DownloadQueueItem) => {
    Alert.alert(
      'Cancel Download',
      `Are you sure you want to cancel downloading "${item.title}"?`,
      [
        { text: 'Keep Downloading', style: 'cancel' },
        {
          text: 'Cancel Download',
          style: 'destructive',
          onPress: () => cancelDownload(item.id),
        },
      ]
    );
  };

  const handleRemoveDownload = (item: DownloadItem) => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${item.title}" from your downloads?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeDownload(item.id),
        },
      ]
    );
  };

  const renderQueueItem = (item: DownloadQueueItem) => (
    <View
      key={item.id}
      style={[styles.downloadItem, { backgroundColor: colors.backgroundSecondary }]}
    >
      <View style={styles.downloadInfo}>
        <Text style={[styles.downloadTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.downloadType, { color: colors.textSecondary }]}>
          {item.mediaType === 'movie' ? 'Movie' : 'TV Series'}
        </Text>
        
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${item.progress}%`,
                backgroundColor: item.status === 'error' ? colors.error : colors.tint,
              },
            ]}
          />
        </View>
        
        <View style={styles.downloadStatus}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {item.status === 'error' && item.errorMessage
              ? item.errorMessage
              : `${Math.round(item.progress)}%`}
          </Text>
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.downloadActions}>
        {item.status === 'downloading' && (
          <Pressable
            onPress={() => pauseDownload(item.id)}
            style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
            accessibilityLabel="Pause download"
          >
            <Ionicons name="pause" size={20} color={colors.text} />
          </Pressable>
        )}
        
        {item.status === 'paused' && (
          <Pressable
            onPress={() => resumeDownload(item.id)}
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            accessibilityLabel="Resume download"
          >
            <Ionicons name="play" size={20} color="#FFFFFF" />
          </Pressable>
        )}
        
        <Pressable
          onPress={() => handleCancelDownload(item)}
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          accessibilityLabel="Cancel download"
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderDownloadItem = (item: DownloadItem) => (
    <View
      key={item.id}
      style={[styles.downloadItem, { backgroundColor: colors.backgroundSecondary }]}
    >
      <View style={styles.downloadInfo}>
        <Text style={[styles.downloadTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.downloadType, { color: colors.textSecondary }]}>
          {item.mediaType === 'movie' ? 'Movie' : 'TV Series'}
        </Text>
        <Text style={[styles.downloadSize, { color: colors.textMuted }]}>
          {formatFileSize(item.fileSize)} • Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.downloadActions}>
        <Pressable
          onPress={() => handleRemoveDownload(item)}
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          accessibilityLabel="Remove download"
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderStorageInfo = () => {
    const percentage = getStoragePercentage();
    const isLowStorage = percentage > 85;

    return (
      <View style={[styles.storageContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.storageHeader}>
          <Ionicons
            name="phone-portrait-outline"
            size={24}
            color={isLowStorage ? colors.error : colors.text}
          />
          <Text style={[styles.storageTitle, { color: colors.text }]}>
            Storage Usage
          </Text>
          {isLowStorage && (
            <Ionicons name="warning" size={20} color={colors.error} />
          )}
        </View>
        
        <View style={[styles.storageBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.storageProgress,
              {
                width: `${percentage}%`,
                backgroundColor: isLowStorage ? colors.error : colors.tint,
              },
            ]}
          />
        </View>
        
        <View style={styles.storageDetails}>
          <Text style={[styles.storageText, { color: colors.textSecondary }]}>
            {formatFileSize(storageUsed)} used of {formatFileSize(storageUsed + storageAvailable)}
          </Text>
          <Text style={[styles.storagePercentage, { color: colors.textMuted }]}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
        
        {isLowStorage && (
          <Text style={[styles.storageWarning, { color: colors.error }]}>
            Storage is running low. Consider removing some downloads.
          </Text>
        )}
      </View>
    );
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Downloads"
        message={error}
        onRetry={() => {
          clearError();
          loadDownloads();
        }}
        testID="downloads-error"
      />
    );
  }

  const hasContent = downloads.length > 0 || queue.length > 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={hasContent ? styles.contentContainer : styles.emptyContainer}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadDownloads}
          tintColor={colors.tint}
        />
      }
    >
      {hasContent ? (
        <>
          {/* Storage Info */}
          {renderStorageInfo()}

          {/* Active Downloads */}
          {queue.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Active Downloads ({queue.length})
              </Text>
              {queue.map(renderQueueItem)}
            </View>
          )}

          {/* Completed Downloads */}
          {downloads.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Downloaded ({downloads.length})
              </Text>
              {downloads.map(renderDownloadItem)}
            </View>
          )}
        </>
      ) : (
        <EmptyState
          title="No Downloads"
          message="Your downloaded content will appear here"
          icon="download-outline"
          suggestions={[
            'Browse movies and series',
            'Tap the download button on detail pages',
            'Downloads work offline',
          ]}
          testID="downloads-empty"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.md,
  },
  downloadItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  downloadInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  downloadTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  downloadType: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.sm,
  },
  downloadSize: {
    fontSize: Typography.sizes.sm,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  downloadStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    textTransform: 'capitalize',
  },
  downloadActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  storageTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
  storageBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
  storageProgress: {
    height: '100%',
    borderRadius: 4,
  },
  storageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageText: {
    fontSize: Typography.sizes.sm,
  },
  storagePercentage: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  storageWarning: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
