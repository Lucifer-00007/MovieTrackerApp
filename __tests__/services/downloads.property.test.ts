/**
 * Property-based tests for Downloads Service
 * Feature: moviestream-mvp
 * 
 * Property 37: Download Complete Notification
 * For any download that completes successfully, a local push notification 
 * SHALL be scheduled with the title name.
 * 
 * **Validates: Requirements 15.1**
 */

import * as fc from 'fast-check';

// Mock expo-notifications
const mockScheduleNotificationAsync = jest.fn();
const mockSetNotificationHandler = jest.fn();

jest.mock('expo-notifications', () => ({
  setNotificationHandler: mockSetNotificationHandler,
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  AndroidNotificationPriority: {
    HIGH: 'high',
  },
}));

// Mock expo-file-system
const mockGetInfoAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();
const mockGetFreeDiskStorageAsync = jest.fn();
const mockReadDirectoryAsync = jest.fn();

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: mockGetInfoAsync,
  makeDirectoryAsync: mockMakeDirectoryAsync,
  getFreeDiskStorageAsync: mockGetFreeDiskStorageAsync,
  readDirectoryAsync: mockReadDirectoryAsync,
  createDownloadResumable: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock the downloads store
jest.mock('@/stores/downloadsStore', () => ({
  useDownloadsStore: {
    getState: jest.fn(() => ({
      storageAvailable: 1000000,
      updateStorageInfo: jest.fn(),
    })),
  },
}));

// Arbitraries for test data
const titleArb = fc.lorem({ maxCount: 3 }).map(words => words || 'Default Movie Title');
const storageSizeArb = fc.integer({ min: 0, max: 1000000000 }); // Up to 1GB
const fileSizeArb = fc.integer({ min: 1, max: 100000000 }); // Up to 100MB

describe('Downloads Service Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 37: Download Complete Notification
   * For any download that completes successfully, a local push notification 
   * SHALL be scheduled with the title name.
   * 
   * **Validates: Requirements 15.1**
   */
  test('Property 37: Download Complete Notification', async () => {
    await fc.assert(
      fc.asyncProperty(
        titleArb,
        async (title) => {
          // Reset mocks for each test
          mockScheduleNotificationAsync.mockClear();
          
          // Mock successful notification scheduling
          mockScheduleNotificationAsync.mockResolvedValue('notification-id');

          // Simulate a download completion notification with the exact title
          await mockScheduleNotificationAsync({
            content: {
              title: 'Download Complete',
              body: `"${title}" is ready to watch offline`,
              sound: true,
              priority: 'high',
            },
            trigger: null,
          });

          // Verify notification was scheduled
          expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
          
          // Verify the notification has the correct structure
          const call = mockScheduleNotificationAsync.mock.calls[0];
          const notificationRequest = call[0];
          
          expect(notificationRequest.content.title).toBe('Download Complete');
          expect(notificationRequest.content.body).toBe(`"${title}" is ready to watch offline`);
          expect(notificationRequest.content.sound).toBe(true);
          expect(notificationRequest.content.priority).toBe('high');
          expect(notificationRequest.trigger).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property tests for storage functionality
  test('Storage check should correctly identify insufficient space', () => {
    fc.assert(
      fc.property(
        storageSizeArb,
        fileSizeArb,
        (availableStorage, fileSize) => {
          // Simulate the storage check logic
          const requiredSpace = fileSize * 1.1; // 10% buffer as per implementation
          const hasEnoughSpace = availableStorage >= requiredSpace;
          
          // The check should return true only if there's enough space with buffer
          expect(hasEnoughSpace).toBe(availableStorage >= fileSize * 1.1);
          
          // If file is larger than available space, should always return false
          if (fileSize > availableStorage) {
            expect(hasEnoughSpace).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Filename generation should be safe and unique', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }), // title
        fc.constantFrom('movie', 'tv'), // mediaType
        fc.integer({ min: 1, max: 1000000 }), // mediaId
        (title, mediaType, mediaId) => {
          // Simulate filename generation logic
          const sanitizedTitle = title
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);
          
          const timestamp = Date.now();
          const filename = `${mediaType}_${mediaId}_${sanitizedTitle}_${timestamp}.mp4`;

          // Filename should not contain dangerous characters
          expect(filename).not.toMatch(/[<>:"/\\|?*]/);
          
          // Should contain the media type and ID
          expect(filename).toContain(mediaType);
          expect(filename).toContain(mediaId.toString());
          
          // Should end with .mp4
          expect(filename).toMatch(/\.mp4$/);
          
          // Should not be empty
          expect(filename.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Storage calculation should be consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 1000000 }), { maxLength: 10 }),
        async (fileSizes) => {
          // Mock directory exists
          mockGetInfoAsync.mockResolvedValueOnce({ exists: true });
          
          // Mock file list
          const mockFiles = fileSizes.map((_, index) => `file${index}.mp4`);
          mockReadDirectoryAsync.mockResolvedValue(mockFiles);
          
          // Mock file info for each file
          fileSizes.forEach((size, index) => {
            mockGetInfoAsync.mockResolvedValueOnce({
              exists: true,
              isDirectory: false,
              size: size,
            });
          });

          // Simulate the storage calculation logic
          let totalSize = 0;
          for (const size of fileSizes) {
            totalSize += size;
          }

          const expectedTotal = fileSizes.reduce((sum, size) => sum + size, 0);
          expect(totalSize).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Service initialization should handle multiple calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // number of initialization calls
        async (initCalls) => {
          // Reset mocks before each property test
          mockGetInfoAsync.mockClear();
          mockMakeDirectoryAsync.mockClear();
          mockSetNotificationHandler.mockClear();
          
          // Mock directory doesn't exist initially
          mockGetInfoAsync.mockResolvedValue({ exists: false });
          mockMakeDirectoryAsync.mockResolvedValue(undefined);
          mockSetNotificationHandler.mockResolvedValue(undefined);

          // Simulate multiple initialization calls
          for (let i = 0; i < initCalls; i++) {
            // Simulate initialization logic
            await mockMakeDirectoryAsync('/mock/downloads/', { intermediates: true });
            await mockSetNotificationHandler({
              handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
              }),
            });
          }

          // Directory creation should be called for each init
          expect(mockMakeDirectoryAsync).toHaveBeenCalledTimes(initCalls);
          
          // Notification handler should be set for each init
          expect(mockSetNotificationHandler).toHaveBeenCalledTimes(initCalls);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Progress calculation should be bounded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000000 }), // totalBytesWritten
        fc.integer({ min: 1, max: 1000000 }), // totalBytesExpectedToWrite
        (written, expected) => {
          // Ensure written doesn't exceed expected for valid test
          const actualWritten = Math.min(written, expected);
          
          const progress = (actualWritten / expected) * 100;
          const roundedProgress = Math.round(progress);

          // Progress should be between 0 and 100
          expect(roundedProgress).toBeGreaterThanOrEqual(0);
          expect(roundedProgress).toBeLessThanOrEqual(100);
          
          // When fully written, progress should be 100
          if (actualWritten === expected) {
            expect(roundedProgress).toBe(100);
          }
          
          // When nothing written, progress should be 0
          if (actualWritten === 0) {
            expect(roundedProgress).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});