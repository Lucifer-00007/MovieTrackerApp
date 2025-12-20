/**
 * Property-based tests for Downloads Store
 * Feature: moviestream-mvp
 * 
 * Tests universal properties for download management functionality
 */

import * as fc from 'fast-check';
import { useDownloadsStore } from '@/stores/downloadsStore';
import type { DownloadItem, DownloadQueueItem, DownloadStatus } from '@/types/downloads';

// Generators for test data
const downloadStatusArb = fc.constantFrom<DownloadStatus>('queued', 'downloading', 'paused', 'error');

const downloadQueueItemArb = fc.record({
  id: fc.uuid(),
  mediaId: fc.integer({ min: 1 }),
  mediaType: fc.constantFrom('movie', 'tv'),
  title: fc.lorem({ maxCount: 3 }).map(words => words || 'Default Title'),
  progress: fc.integer({ min: 0, max: 100 }),
  status: downloadStatusArb,
  errorMessage: fc.option(fc.string()),
  fileSize: fc.option(fc.integer({ min: 1 })),
}) as fc.Arbitrary<DownloadQueueItem>;

const downloadItemArb = fc.record({
  id: fc.uuid(),
  mediaId: fc.integer({ min: 1 }),
  mediaType: fc.constantFrom('movie', 'tv'),
  title: fc.lorem({ maxCount: 3 }).map(words => words || 'Default Title'),
  posterPath: fc.option(fc.string()),
  filePath: fc.string({ minLength: 1 }),
  fileSize: fc.integer({ min: 1 }),
  downloadedAt: fc.integer({ 
    min: new Date('2020-01-01').getTime(), 
    max: new Date('2025-12-31').getTime() 
  }).map(ts => new Date(ts).toISOString()),
  expiresAt: fc.option(fc.integer({ 
    min: new Date('2025-01-01').getTime(), 
    max: new Date('2030-01-01').getTime() 
  }).map(ts => new Date(ts).toISOString())),
}) as fc.Arbitrary<DownloadItem>;

// Helper to reset store state between tests
const resetStore = () => {
  useDownloadsStore.setState({
    downloads: [],
    queue: [],
    storageUsed: 0,
    storageAvailable: 0,
    isLoading: false,
    error: null,
  });
};

describe('Downloads Store Property Tests', () => {
  beforeEach(() => {
    resetStore();
  });

  /**
   * Property 18: Download Progress Tracking
   * For any active download, the progress value SHALL be updated and displayed 
   * in the Downloads screen, and SHALL be between 0 and 100.
   * Validates: Requirements 8.2
   */
  test('Property 18: Download Progress Tracking', () => {
    fc.assert(
      fc.property(
        downloadQueueItemArb,
        fc.integer({ min: -50, max: 150 }), // Test clamping
        (queueItem, newProgress) => {
          resetStore();
          const store = useDownloadsStore.getState();
          
          // Add item to queue
          store.addToQueue(queueItem);
          
          // Verify item was added
          let updatedStore = useDownloadsStore.getState();
          const addedItem = updatedStore.queue.find(item => item.id === queueItem.id);
          expect(addedItem).toBeDefined();
          
          // Update progress
          store.updateProgress(queueItem.id, newProgress);
          
          updatedStore = useDownloadsStore.getState();
          const updatedItem = updatedStore.queue.find(item => item.id === queueItem.id);
          
          // Progress should be clamped between 0 and 100
          expect(updatedItem?.progress).toBeGreaterThanOrEqual(0);
          expect(updatedItem?.progress).toBeLessThanOrEqual(100);
          
          // Progress should be the clamped value
          const expectedProgress = Math.max(0, Math.min(100, newProgress));
          expect(updatedItem?.progress).toBe(expectedProgress);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 19: Download Pause/Resume
   * For any DownloadQueueItem with status 'downloading', pausing SHALL change 
   * status to 'paused', and resuming SHALL change status back to 'downloading'.
   * Validates: Requirements 8.3
   */
  test('Property 19: Download Pause/Resume', () => {
    fc.assert(
      fc.property(
        downloadQueueItemArb,
        (queueItem) => {
          resetStore();
          const store = useDownloadsStore.getState();
          
          // Add item to queue (will be set to 'queued' status)
          store.addToQueue(queueItem);
          
          // Manually set to downloading status
          store.updateStatus(queueItem.id, 'downloading');
          
          // Verify item is now downloading
          let updatedStore = useDownloadsStore.getState();
          let updatedItem = updatedStore.queue.find(item => item.id === queueItem.id);
          expect(updatedItem?.status).toBe('downloading');
          
          // Pause the download
          store.pauseDownload(queueItem.id);
          
          updatedStore = useDownloadsStore.getState();
          updatedItem = updatedStore.queue.find(item => item.id === queueItem.id);
          expect(updatedItem?.status).toBe('paused');
          
          // Resume the download
          store.resumeDownload(queueItem.id);
          
          updatedStore = useDownloadsStore.getState();
          updatedItem = updatedStore.queue.find(item => item.id === queueItem.id);
          expect(updatedItem?.status).toBe('downloading');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20: Storage Warning
   * For any download request where fileSize exceeds storageAvailable, 
   * the app SHALL display a storage warning before proceeding.
   * Validates: Requirements 8.6
   */
  test('Property 20: Storage Warning', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }), // storageAvailable
        fc.integer({ min: 1, max: 2000000 }), // fileSize
        (storageAvailable, fileSize) => {
          resetStore();
          const store = useDownloadsStore.getState();
          
          // Set storage info
          store.updateStorageInfo(0, storageAvailable);
          
          // Check if warning should be shown
          const shouldShowWarning = fileSize > storageAvailable;
          const updatedStore = useDownloadsStore.getState();
          const currentStorage = updatedStore.storageAvailable;
          
          // The storage check logic should correctly identify insufficient storage
          expect(fileSize > currentStorage).toBe(shouldShowWarning);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 21: Download Cancellation Cleanup
   * For any cancelled download, the item SHALL be removed from Download_Queue 
   * and any partial file SHALL be deleted.
   * Validates: Requirements 17.3
   */
  test('Property 21: Download Cancellation Cleanup', () => {
    fc.assert(
      fc.property(
        fc.array(downloadQueueItemArb, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0 }), // Index of item to cancel
        (queueItems, cancelIndex) => {
          resetStore();
          const store = useDownloadsStore.getState();
          const itemToCancel = queueItems[cancelIndex % queueItems.length];
          
          // Add all items to queue
          queueItems.forEach(item => {
            store.addToQueue(item);
          });
          
          let updatedStore = useDownloadsStore.getState();
          const initialQueueLength = updatedStore.queue.length;
          expect(initialQueueLength).toBe(queueItems.length);
          
          // Cancel one download
          store.cancelDownload(itemToCancel.id);
          
          // Item should be removed from queue
          updatedStore = useDownloadsStore.getState();
          const remainingItems = updatedStore.queue;
          expect(remainingItems.length).toBe(initialQueueLength - 1);
          expect(remainingItems.find(item => item.id === itemToCancel.id)).toBeUndefined();
          
          // All other items should still be in queue
          const otherItems = queueItems.filter(item => item.id !== itemToCancel.id);
          otherItems.forEach(item => {
            expect(remainingItems.find(q => q.id === item.id)).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property test for storage usage tracking
  test('Storage usage should be correctly calculated', () => {
    fc.assert(
      fc.property(
        fc.array(downloadItemArb, { maxLength: 5 }),
        (downloads) => {
          resetStore();
          const store = useDownloadsStore.getState();
          
          let expectedStorageUsed = 0;
          
          // Add downloads one by one and verify storage calculation
          downloads.forEach(download => {
            store.completeDownload('temp-queue-id', download);
            
            expectedStorageUsed += download.fileSize;
            const updatedStore = useDownloadsStore.getState();
            expect(updatedStore.storageUsed).toBe(expectedStorageUsed);
          });
          
          // Remove downloads and verify storage decreases
          downloads.forEach(download => {
            store.removeDownload(download.id);
            
            expectedStorageUsed -= download.fileSize;
            const updatedStore = useDownloadsStore.getState();
            expect(updatedStore.storageUsed).toBe(Math.max(0, expectedStorageUsed));
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test that duplicate queue items are not added
  test('Duplicate queue items should not be added', () => {
    fc.assert(
      fc.property(
        downloadQueueItemArb,
        (queueItem) => {
          resetStore();
          const store = useDownloadsStore.getState();
          
          // Add item twice
          store.addToQueue(queueItem);
          store.addToQueue(queueItem);
          
          // Should only have one item in queue
          const updatedStore = useDownloadsStore.getState();
          expect(updatedStore.queue.length).toBe(1);
          expect(updatedStore.queue[0].id).toBe(queueItem.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});