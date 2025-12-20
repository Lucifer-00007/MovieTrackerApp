/**
 * Downloads Service for MovieStream MVP
 * Handles background downloads with storage checks and notifications
 * 
 * Requirements: 8.4, 8.6, 8.7, 15.1
 */

import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { useDownloadsStore } from '@/stores/downloadsStore';
import type { DownloadItem, DownloadQueueItem } from '@/types/downloads';

// Download configuration
const DOWNLOAD_DIRECTORY = `${FileSystem.documentDirectory}downloads/`;
const MAX_CONCURRENT_DOWNLOADS = 3;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Active download tracking
const activeDownloads = new Map<string, FileSystem.DownloadResumable>();

/**
 * Initialize downloads service
 * Creates download directory and sets up notification handlers
 */
export async function initializeDownloadsService(): Promise<void> {
  try {
    // Create downloads directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOAD_DIRECTORY, { intermediates: true });
    }

    // Configure notifications for download completion
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    console.log('Downloads service initialized');
  } catch (error) {
    console.error('Failed to initialize downloads service:', error);
    throw error;
  }
}

/**
 * Get available storage space
 * Returns available bytes on device
 */
export async function getAvailableStorage(): Promise<number> {
  try {
    const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
    return freeDiskStorage;
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return 0;
  }
}

/**
 * Get used storage by downloads
 * Calculates total size of downloaded files
 */
export async function getUsedStorage(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIRECTORY);
    if (!dirInfo.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIRECTORY);
    let totalSize = 0;

    for (const file of files) {
      const filePath = `${DOWNLOAD_DIRECTORY}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && !fileInfo.isDirectory) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Failed to calculate used storage:', error);
    return 0;
  }
}

/**
 * Update storage information in store
 */
export async function updateStorageInfo(): Promise<void> {
  try {
    const [used, available] = await Promise.all([
      getUsedStorage(),
      getAvailableStorage(),
    ]);

    const store = useDownloadsStore.getState();
    store.updateStorageInfo(used, available);
  } catch (error) {
    console.error('Failed to update storage info:', error);
  }
}

/**
 * Check if there's enough storage for a download
 * Requirements: 8.6
 */
export function checkStorageAvailable(fileSize: number): boolean {
  const store = useDownloadsStore.getState();
  const availableSpace = store.storageAvailable;
  
  // Add 10% buffer for safety
  const requiredSpace = fileSize * 1.1;
  
  return availableSpace >= requiredSpace;
}

/**
 * Generate unique filename for download
 */
function generateFilename(title: string, mediaType: 'movie' | 'tv', mediaId: number): string {
  // Sanitize title for filename
  const sanitizedTitle = title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  const timestamp = Date.now();
  return `${mediaType}_${mediaId}_${sanitizedTitle}_${timestamp}.mp4`;
}

/**
 * Send download complete notification
 * Requirements: 15.1
 */
async function sendDownloadCompleteNotification(title: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Download Complete',
        body: `"${title}" is ready to watch offline`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Failed to send download notification:', error);
  }
}

/**
 * Create download resumable with progress tracking
 */
function createDownloadResumable(
  url: string,
  fileUri: string,
  queueItem: DownloadQueueItem
): FileSystem.DownloadResumable {
  const store = useDownloadsStore.getState();

  return FileSystem.createDownloadResumable(
    url,
    fileUri,
    {},
    (downloadProgress) => {
      const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
      store.updateProgress(queueItem.id, Math.round(progress));
    }
  );
}

/**
 * Start a download with retry logic
 * Requirements: 8.4, 8.7
 */
export async function startDownload(
  queueItem: DownloadQueueItem,
  downloadUrl: string,
  estimatedFileSize?: number
): Promise<void> {
  const store = useDownloadsStore.getState();

  try {
    // Check storage before starting
    if (estimatedFileSize && !checkStorageAvailable(estimatedFileSize)) {
      store.updateStatus(queueItem.id, 'error', 'Insufficient storage space');
      return;
    }

    // Generate filename and file path
    const filename = generateFilename(queueItem.title, queueItem.mediaType, queueItem.mediaId);
    const fileUri = `${DOWNLOAD_DIRECTORY}${filename}`;

    // Update status to downloading
    store.updateStatus(queueItem.id, 'downloading');

    // Create download resumable
    const downloadResumable = createDownloadResumable(downloadUrl, fileUri, queueItem);
    activeDownloads.set(queueItem.id, downloadResumable);

    // Start download with retry logic
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < RETRY_ATTEMPTS) {
      try {
        const result = await downloadResumable.downloadAsync();
        
        if (result && result.status === 200) {
          // Download successful
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          const fileSize = fileInfo.size || estimatedFileSize || 0;

          // Create download item
          const downloadItem: DownloadItem = {
            id: `download_${queueItem.mediaId}_${Date.now()}`,
            mediaId: queueItem.mediaId,
            mediaType: queueItem.mediaType,
            title: queueItem.title,
            posterPath: null, // Would be set from media details
            filePath: fileUri,
            fileSize,
            downloadedAt: new Date().toISOString(),
            expiresAt: null, // Could be set based on licensing
          };

          // Complete download in store
          store.completeDownload(queueItem.id, downloadItem);

          // Send notification
          await sendDownloadCompleteNotification(queueItem.title);

          // Update storage info
          await updateStorageInfo();

          // Clean up
          activeDownloads.delete(queueItem.id);
          return;
        } else {
          throw new Error(`Download failed with status: ${result?.status}`);
        }
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt < RETRY_ATTEMPTS) {
          // Wait before retry with exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Update status to show retry
          store.updateStatus(queueItem.id, 'downloading', `Retrying... (${attempt}/${RETRY_ATTEMPTS})`);
        }
      }
    }

    // All retries failed
    store.updateStatus(queueItem.id, 'error', lastError?.message || 'Download failed');
    activeDownloads.delete(queueItem.id);

    // Clean up partial file
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up partial download:', cleanupError);
    }

  } catch (error) {
    console.error('Download error:', error);
    store.updateStatus(queueItem.id, 'error', error instanceof Error ? error.message : 'Unknown error');
    activeDownloads.delete(queueItem.id);
  }
}

/**
 * Pause a download
 * Requirements: 8.3
 */
export async function pauseDownload(queueItemId: string): Promise<void> {
  const downloadResumable = activeDownloads.get(queueItemId);
  const store = useDownloadsStore.getState();

  if (downloadResumable) {
    try {
      await downloadResumable.pauseAsync();
      store.pauseDownload(queueItemId);
    } catch (error) {
      console.error('Failed to pause download:', error);
      store.updateStatus(queueItemId, 'error', 'Failed to pause download');
    }
  }
}

/**
 * Resume a paused download
 * Requirements: 8.3
 */
export async function resumeDownload(queueItemId: string): Promise<void> {
  const downloadResumable = activeDownloads.get(queueItemId);
  const store = useDownloadsStore.getState();

  if (downloadResumable) {
    try {
      await downloadResumable.resumeAsync();
      store.resumeDownload(queueItemId);
    } catch (error) {
      console.error('Failed to resume download:', error);
      store.updateStatus(queueItemId, 'error', 'Failed to resume download');
    }
  }
}

/**
 * Cancel a download and clean up files
 * Requirements: 17.3
 */
export async function cancelDownload(queueItemId: string): Promise<void> {
  const downloadResumable = activeDownloads.get(queueItemId);
  const store = useDownloadsStore.getState();

  if (downloadResumable) {
    try {
      // Cancel the download
      await downloadResumable.pauseAsync();
      
      // Get file path and delete partial file
      const fileUri = downloadResumable.fileUri;
      if (fileUri) {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(fileUri);
        }
      }

      // Clean up tracking
      activeDownloads.delete(queueItemId);
      
      // Remove from store
      store.cancelDownload(queueItemId);

    } catch (error) {
      console.error('Failed to cancel download:', error);
      // Still remove from store even if cleanup failed
      store.cancelDownload(queueItemId);
      activeDownloads.delete(queueItemId);
    }
  } else {
    // Not actively downloading, just remove from queue
    store.cancelDownload(queueItemId);
  }
}

/**
 * Delete a completed download
 */
export async function deleteDownload(downloadId: string): Promise<void> {
  const store = useDownloadsStore.getState();
  const download = store.downloads.find(d => d.id === downloadId);

  if (download) {
    try {
      // Delete the file
      const fileInfo = await FileSystem.getInfoAsync(download.filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(download.filePath);
      }

      // Remove from store
      store.removeDownload(downloadId);

      // Update storage info
      await updateStorageInfo();

    } catch (error) {
      console.error('Failed to delete download:', error);
      throw error;
    }
  }
}

/**
 * Get download progress for a queue item
 */
export function getDownloadProgress(queueItemId: string): number {
  const store = useDownloadsStore.getState();
  const queueItem = store.queue.find(item => item.id === queueItemId);
  return queueItem?.progress || 0;
}

/**
 * Check if a download is active
 */
export function isDownloadActive(queueItemId: string): boolean {
  return activeDownloads.has(queueItemId);
}

/**
 * Get all active downloads count
 */
export function getActiveDownloadsCount(): number {
  return activeDownloads.size;
}

/**
 * Process download queue
 * Starts downloads up to MAX_CONCURRENT_DOWNLOADS limit
 */
export async function processDownloadQueue(): Promise<void> {
  const store = useDownloadsStore.getState();
  const queuedItems = store.queue.filter(item => item.status === 'queued');
  const activeCount = getActiveDownloadsCount();

  if (activeCount >= MAX_CONCURRENT_DOWNLOADS) {
    return; // Already at max capacity
  }

  const slotsAvailable = MAX_CONCURRENT_DOWNLOADS - activeCount;
  const itemsToStart = queuedItems.slice(0, slotsAvailable);

  for (const item of itemsToStart) {
    // In a real implementation, you would get the download URL from your API
    // For now, we'll use a placeholder URL
    const downloadUrl = `https://example.com/download/${item.mediaType}/${item.mediaId}`;
    
    // Start download without awaiting (run in background)
    startDownload(item, downloadUrl).catch(error => {
      console.error(`Failed to start download for ${item.title}:`, error);
    });
  }
}

/**
 * Clean up expired downloads
 * Removes downloads that have passed their expiration date
 */
export async function cleanupExpiredDownloads(): Promise<void> {
  const store = useDownloadsStore.getState();
  const now = new Date();

  const expiredDownloads = store.downloads.filter(download => {
    if (!download.expiresAt) return false;
    return new Date(download.expiresAt) <= now;
  });

  for (const download of expiredDownloads) {
    try {
      await deleteDownload(download.id);
    } catch (error) {
      console.error(`Failed to cleanup expired download ${download.title}:`, error);
    }
  }
}