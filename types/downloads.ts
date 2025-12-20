/**
 * Downloads type definitions for MovieStream MVP
 * Defines download items, queue management, and storage info
 */

/** Download status for queue items */
export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'error';

/** Completed download stored locally */
export interface DownloadItem {
  id: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  filePath: string;
  fileSize: number;
  downloadedAt: string;
  expiresAt: string | null;
}

/** Download queue item with progress tracking */
export interface DownloadQueueItem {
  id: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  progress: number; // 0-100
  status: DownloadStatus;
  errorMessage?: string;
  fileSize?: number;
}

/** Downloads state for the store */
export interface DownloadsState {
  downloads: DownloadItem[];
  queue: DownloadQueueItem[];
  storageUsed: number;
  storageAvailable: number;
}
