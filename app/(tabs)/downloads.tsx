/**
 * Downloads Screen
 * Displays download queue and completed downloads with storage management
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors, Spacing } from '@/constants/theme';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { DownloadsHeader } from '@/components/downloads/DownloadsHeader';
import { DownloadQueueList } from '@/components/downloads/DownloadQueueList';
import { CompletedDownloadsList } from '@/components/downloads/CompletedDownloadsList';
import { ErrorState } from '@/components/ui/ErrorState';
import type { DownloadQueueItem, DownloadItem } from '@/types/downloads';

export default function DownloadsScreen() {
  const backgroundColor = useThemeColor({}, 'background');

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

  const handleRefresh = () => {
    if (error) {
      clearError();
    }
    loadDownloads();
  };

  const handleCancelDownload = (item: DownloadQueueItem) => {
    cancelDownload(item.id);
  };

  const handleRemoveDownload = (item: DownloadItem) => {
    removeDownload(item.id);
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ErrorState
          title="Failed to load downloads"
          message={error}
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  const activeDownloads = queue.filter(item => 
    item.status === 'downloading' || item.status === 'paused'
  ).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={Colors.light.tint}
        />
      }
    >
      <DownloadsHeader
        storageUsed={storageUsed}
        storageAvailable={storageAvailable}
        totalDownloads={downloads.length}
        activeDownloads={activeDownloads}
      />

      <DownloadQueueList
        queue={queue}
        onPause={pauseDownload}
        onResume={resumeDownload}
        onCancel={handleCancelDownload}
      />

      <CompletedDownloadsList
        downloads={downloads}
        onRemove={handleRemoveDownload}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
});