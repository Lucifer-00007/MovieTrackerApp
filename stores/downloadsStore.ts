/**
 * Downloads Zustand Store for MovieStream MVP
 * Manages download queue with pause/resume/cancel actions
 * 
 * Requirements: 8.2
 * - Show download progress in Downloads screen
 * - Support pausing and resuming downloads
 * - Queue management
 */

import { create } from 'zustand';
import type { DownloadItem, DownloadQueueItem, DownloadStatus } from '@/types/downloads';

interface DownloadsStore {
  // State
  downloads: DownloadItem[];
  queue: DownloadQueueItem[];
  storageUsed: number;
  storageAvailable: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadDownloads: () => Promise<void>;
  addToQueue: (item: Omit<DownloadQueueItem, 'progress' | 'status'>) => void;
  removeFromQueue: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: DownloadStatus, errorMessage?: string) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  completeDownload: (queueId: string, downloadItem: DownloadItem) => void;
  removeDownload: (id: string) => void;
  updateStorageInfo: (used: number, available: number) => void;
  clearError: () => void;
}

export const useDownloadsStore = create<DownloadsStore>((set, get) => ({
  // Initial state
  downloads: [],
  queue: [],
  storageUsed: 0,
  storageAvailable: 0,
  isLoading: false,
  error: null,

  // Load downloads from storage (placeholder - actual implementation would load from file system)
  loadDownloads: async () => {
    set({ isLoading: true, error: null });
    try {
      // In a real implementation, this would scan local storage for downloaded files
      // For now, we just set loading to false
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load downloads',
      });
    }
  },

  // Add item to download queue
  addToQueue: (item) => {
    const queueItem: DownloadQueueItem = {
      ...item,
      progress: 0,
      status: 'queued',
    };

    set((state) => {
      // Check if already in queue
      const existsInQueue = state.queue.some(q => q.id === item.id);
      if (existsInQueue) {
        return state;
      }

      return {
        queue: [...state.queue, queueItem],
      };
    });
  },

  // Remove item from queue
  removeFromQueue: (id) => {
    set((state) => ({
      queue: state.queue.filter(item => item.id !== id),
    }));
  },

  // Update download progress
  updateProgress: (id, progress) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progress));

    set((state) => ({
      queue: state.queue.map(item =>
        item.id === id
          ? { ...item, progress: clampedProgress }
          : item
      ),
    }));
  },

  // Update download status
  updateStatus: (id, status, errorMessage) => {
    set((state) => ({
      queue: state.queue.map(item =>
        item.id === id
          ? { ...item, status, errorMessage: errorMessage || item.errorMessage }
          : item
      ),
    }));
  },

  // Pause a download
  pauseDownload: (id) => {
    const item = get().queue.find(q => q.id === id);
    if (item && item.status === 'downloading') {
      get().updateStatus(id, 'paused');
    }
  },

  // Resume a paused download
  resumeDownload: (id) => {
    const item = get().queue.find(q => q.id === id);
    if (item && item.status === 'paused') {
      get().updateStatus(id, 'downloading');
    }
  },

  // Cancel a download and remove from queue
  cancelDownload: (id) => {
    get().removeFromQueue(id);
  },

  // Complete a download - move from queue to downloads
  completeDownload: (queueId, downloadItem) => {
    set((state) => ({
      queue: state.queue.filter(item => item.id !== queueId),
      downloads: [...state.downloads, downloadItem],
      storageUsed: state.storageUsed + downloadItem.fileSize,
    }));
  },

  // Remove a completed download
  removeDownload: (id) => {
    set((state) => {
      const download = state.downloads.find(d => d.id === id);
      const sizeToRemove = download?.fileSize || 0;

      return {
        downloads: state.downloads.filter(item => item.id !== id),
        storageUsed: Math.max(0, state.storageUsed - sizeToRemove),
      };
    });
  },

  // Update storage information
  updateStorageInfo: (used, available) => {
    set({ storageUsed: used, storageAvailable: available });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));
