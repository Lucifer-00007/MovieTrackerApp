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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import type { DownloadItem, DownloadQueueItem } from '@/types/downloads';

export default function DownloadsScreen() {
  const colorScheme = useEffectiveColorScheme();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return colors.tint;
      case 'paused':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'queued':
        return colors.textMuted;
      default:
        return colors.success;
    }
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
      style={[styles.downloadCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      {/* Poster Placeholder for Queue Items */}
      <View style={styles.posterContainer}>
        <View style={[styles.posterPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="film-outline" size={24} color={colors.textMuted} />
        </View>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons
            name={item.status === 'downloading' ? 'arrow-down' : item.status === 'paused' ? 'pause' : 'time'}
            size={10}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.downloadTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.metaRow}>
          <View style={[styles.typeBadge, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>
              {item.mediaType === 'movie' ? 'Movie' : 'Series'}
            </Text>
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${item.progress}%`,
                backgroundColor: getStatusColor(item.status),
              },
            ]}
          />
        </View>
        
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {item.status === 'error' && item.errorMessage
              ? item.errorMessage
              : `${Math.round(item.progress)}% complete`}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {item.status === 'downloading' && (
          <Pressable
            onPress={() => pauseDownload(item.id)}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.backgroundTertiary, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel="Pause download"
          >
            <Ionicons name="pause" size={18} color={colors.text} />
          </Pressable>
        )}
        
        {item.status === 'paused' && (
          <Pressable
            onPress={() => resumeDownload(item.id)}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel="Resume download"
          >
            <Ionicons name="play" size={18} color="#FFFFFF" />
          </Pressable>
        )}
        
        <Pressable
          onPress={() => handleCancelDownload(item)}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.errorLight, opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityLabel="Cancel download"
        >
          <Ionicons name="close" size={18} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );

  const renderDownloadItem = (item: DownloadItem) => (
    <Pressable
      key={item.id}
      style={({ pressed }) => [
        styles.downloadCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.9 : 1 },
      ]}
      accessibilityLabel={`${item.title}, ${formatFileSize(item.fileSize)}`}
    >
      {/* Poster Thumbnail */}
      <View style={styles.posterContainer}>
        {item.posterPath ? (
          <Image
            source={{ uri: item.posterPath }}
            style={styles.poster}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.posterPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
            <Ionicons name="film-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        {/* Downloaded Badge */}
        <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.downloadTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.metaRow}>
          <View style={[styles.typeBadge, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>
              {item.mediaType === 'movie' ? 'Movie' : 'Series'}
            </Text>
          </View>
          <Text style={[styles.fileSizeText, { color: colors.textMuted }]}>
            {formatFileSize(item.fileSize)}
          </Text>
        </View>
        
        <Text style={[styles.dateText, { color: colors.textMuted }]}>
          Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <Pressable
          onPress={() => handleRemoveDownload(item)}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.errorLight, opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityLabel="Remove download"
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderStorageCard = () => {
    const percentage = getStoragePercentage();
    const isLowStorage = percentage > 85;
    const gradientColors = isLowStorage
      ? [colors.errorLight, colors.error]
      : [colors.tint, colors.primaryLight];

    return (
      <View style={[styles.storageCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.storageHeader}>
          <View style={styles.storageHeaderText}>
            <Text style={[styles.storageTitle, { color: colors.text }]}>
              Storage
            </Text>
            <Text style={[styles.storageSubtitle, { color: colors.textSecondary }]}>
              {formatFileSize(storageAvailable)} available
            </Text>
          </View>
          {isLowStorage && (
            <View style={[styles.warningBadge, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="warning" size={14} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>Low</Text>
            </View>
          )}
        </View>
        
        <View style={[styles.storageBarContainer, { backgroundColor: colors.border }]}>
          <LinearGradient
            colors={gradientColors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.storageBarFill, { width: `${Math.min(percentage, 100)}%` }]}
          />
        </View>
        
        <View style={styles.storageStats}>
          <View style={styles.storageStat}>
            <Text style={[styles.storageStatValue, { color: colors.text }]}>
              {formatFileSize(storageUsed)}
            </Text>
            <Text style={[styles.storageStatLabel, { color: colors.textMuted }]}>
              Used
            </Text>
          </View>
          <View style={styles.storageStat}>
            <Text style={[styles.storageStatValue, { color: colors.text }]}>
              {downloads.length + queue.length}
            </Text>
            <Text style={[styles.storageStatLabel, { color: colors.textMuted }]}>
              Items
            </Text>
          </View>
          <View style={styles.storageStat}>
            <Text style={[styles.storageStatValue, { color: colors.text }]}>
              {percentage.toFixed(0)}%
            </Text>
            <Text style={[styles.storageStatLabel, { color: colors.textMuted }]}>
              Full
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Failed to Load Downloads"
          message={error}
          onRetry={() => {
            clearError();
            loadDownloads();
          }}
          testID="downloads-error"
        />
      </View>
    );
  }

  const hasContent = downloads.length > 0 || queue.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Downloads</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Watch offline anytime
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={hasContent ? styles.contentContainer : styles.emptyContainer}
        showsVerticalScrollIndicator={false}
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
            {/* Storage Card */}
            {renderStorageCard()}

            {/* Active Downloads */}
            {queue.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="arrow-down-circle" size={20} color={colors.tint} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Downloading
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.countBadgeText}>{queue.length}</Text>
                  </View>
                </View>
                {queue.map(renderQueueItem)}
              </View>
            )}

            {/* Completed Downloads */}
            {downloads.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Ready to Watch
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.success }]}>
                    <Text style={styles.countBadgeText}>{downloads.length}</Text>
                  </View>
                </View>
                {downloads.map(renderDownloadItem)}
              </View>
            )}

            <View style={styles.bottomSpacer} />
          </>
        ) : (
          <EmptyState
            title="No Downloads Yet"
            message="Download movies and series to watch offline"
            icon="download-outline"
            suggestions={[
              'Browse trending content',
              'Tap download on any title',
              'Watch without internet',
            ]}
            testID="downloads-empty"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  // Storage Card
  storageCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storageIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  storageHeaderText: {
    flex: 1,
  },
  storageTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  storageSubtitle: {
    fontSize: Typography.sizes.sm,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  warningText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  storageBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  storageStat: {
    alignItems: 'center',
  },
  storageStatValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  storageStatLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  // Download Card
  downloadCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: BorderRadius.sm,
  },
  posterPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  downloadTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  fileSizeText: {
    fontSize: Typography.sizes.xs,
  },
  dateText: {
    fontSize: Typography.sizes.xs,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: Typography.sizes.xs,
  },
  cardActions: {
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
