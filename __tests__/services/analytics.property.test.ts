/**
 * Property-based tests for Analytics service
 * Feature: moviestream-mvp
 * 
 * Property 30: Analytics Event Logging
 * Property 31: Analytics Batching
 * Property 32: Analytics Opt-Out
 * 
 * Validates: Requirements 13.1-13.6, 19.4
 */

import * as fc from 'fast-check';
import { analyticsService } from '@/services/analytics';
import type { AnalyticsEvent, AnalyticsEventName } from '@/types/analytics';

// Mock functions
const mockAsyncStorageGetItem = jest.fn();
const mockAsyncStorageSetItem = jest.fn();
const mockAsyncStorageRemoveItem = jest.fn();
const mockNetInfoFetch = jest.fn();
const mockPreferencesGetState = jest.fn();
const mockFetch = jest.fn();

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockAsyncStorageGetItem(...args),
    setItem: (...args: unknown[]) => mockAsyncStorageSetItem(...args),
    removeItem: (...args: unknown[]) => mockAsyncStorageRemoveItem(...args),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: (...args: unknown[]) => mockNetInfoFetch(...args),
  },
}));

jest.mock('@/stores/preferencesStore', () => ({
  usePreferencesStore: {
    getState: () => mockPreferencesGetState(),
  },
}));

// Mock fetch globally
global.fetch = mockFetch as unknown as typeof fetch;

// Arbitraries for generating test data
const analyticsEventNameArb = fc.constantFrom(
  'trailer_tap',
  'watchlist_add',
  'watchlist_remove',
  'media_impression',
  'search_query',
  'provider_tap',
  'screen_view',
  'download_start',
  'download_complete',
  'error'
) as fc.Arbitrary<AnalyticsEventName>;

const eventPropertiesArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.integer({ min: 0, max: 1000000 }),
    fc.boolean()
  ),
  { minKeys: 0, maxKeys: 10 }
);

const analyticsEventArb = fc.record({
  eventName: analyticsEventNameArb,
  properties: eventPropertiesArb,
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
    .map(d => d.toISOString()),
});

describe('Feature: moviestream-mvp, Property 30: Analytics Event Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mocks
    mockAsyncStorageGetItem.mockResolvedValue(null);
    mockAsyncStorageSetItem.mockResolvedValue(undefined);
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Property 30: Analytics Event Logging
   * For any tracked user action (trailer tap, watchlist change, search, provider tap, impression), 
   * an Analytics_Event SHALL be logged with the required properties (eventName, relevant IDs, timestamp).
   * 
   * **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
   */
  describe('Event Logging with Required Properties', () => {
    it('should log events with all required properties when analytics is enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          analyticsEventNameArb,
          eventPropertiesArb,
          async (eventName, properties) => {
            // Setup: Analytics enabled
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            // Initialize service
            await analyticsService.initialize();

            // Log event
            await (analyticsService as any).logEvent(eventName, properties);

            // Verify event was stored with required properties
            expect(storedEvents.length).toBeGreaterThan(0);
            
            const loggedEvent = storedEvents[storedEvents.length - 1];
            expect(loggedEvent.eventName).toBe(eventName);
            expect(loggedEvent.timestamp).toBeDefined();
            expect(typeof loggedEvent.timestamp).toBe('string');
            
            // Should include original properties plus platform and timestamp
            expect(loggedEvent.properties).toMatchObject(properties);
            expect(loggedEvent.properties.platform).toBeDefined();
            expect(loggedEvent.properties.timestamp).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include correct properties for trailer tap events', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000000 }),
          fc.constantFrom('movie', 'tv'),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (titleId, mediaType, sourceScreen) => {
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();
            await analyticsService.logTrailerTap(titleId, mediaType as 'movie' | 'tv', sourceScreen);

            const event = storedEvents[storedEvents.length - 1];
            expect(event.eventName).toBe('trailer_tap');
            expect(event.properties.title_id).toBe(titleId);
            expect(event.properties.media_type).toBe(mediaType);
            expect(event.properties.source_screen).toBe(sourceScreen);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include correct properties for watchlist action events', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000000 }),
          fc.constantFrom('movie', 'tv'),
          fc.constantFrom('add', 'remove'),
          async (titleId, mediaType, action) => {
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();
            await analyticsService.logWatchlistAction(
              titleId, 
              mediaType as 'movie' | 'tv', 
              action as 'add' | 'remove'
            );

            const event = storedEvents[storedEvents.length - 1];
            const expectedEventName = action === 'add' ? 'watchlist_add' : 'watchlist_remove';
            expect(event.eventName).toBe(expectedEventName);
            expect(event.properties.title_id).toBe(titleId);
            expect(event.properties.media_type).toBe(mediaType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include correct properties for search query events', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          async (query, resultCount) => {
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();
            await analyticsService.logSearchQuery(query, resultCount);

            const event = storedEvents[storedEvents.length - 1];
            expect(event.eventName).toBe('search_query');
            expect(event.properties.query_text).toBe(query);
            expect(event.properties.result_count).toBe(resultCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include correct properties for provider tap events', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000000 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (titleId, providerName) => {
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();
            await analyticsService.logProviderTap(titleId, providerName);

            const event = storedEvents[storedEvents.length - 1];
            expect(event.eventName).toBe('provider_tap');
            expect(event.properties.title_id).toBe(titleId);
            expect(event.properties.provider_name).toBe(providerName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include correct properties for media impression events', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 1000000 }), { minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (titleIds, sourceScreen) => {
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();
            await analyticsService.logMediaImpressions(titleIds, sourceScreen);

            // Should log one event per title ID
            const impressionEvents = storedEvents.filter(e => e.eventName === 'media_impression');
            expect(impressionEvents.length).toBe(titleIds.length);

            // Each event should have correct properties
            impressionEvents.forEach((event, index) => {
              expect(event.properties.title_id).toBe(titleIds[index]);
              expect(event.properties.source_screen).toBe(sourceScreen);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Feature: moviestream-mvp, Property 31: Analytics Batching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockAsyncStorageGetItem.mockResolvedValue(null);
    mockAsyncStorageSetItem.mockResolvedValue(undefined);
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Property 31: Analytics Batching
   * For any sequence of Analytics_Events, events SHALL be batched and sent when network becomes available.
   * 
   * **Validates: Requirements 13.6**
   */
  describe('Event Batching and Network-Aware Sending', () => {
    it('should batch multiple events before sending', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(analyticsEventArb, { minLength: 2, maxLength: 15 }),
          async (events) => {
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();

            // Log all events
            for (const event of events) {
              await (analyticsService as any).logEvent(event.eventName, event.properties);
            }

            // All events should be in the queue
            expect(storedEvents.length).toBe(events.length);

            // Events should be stored in order
            events.forEach((originalEvent, index) => {
              expect(storedEvents[index].eventName).toBe(originalEvent.eventName);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not send events when network is unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(analyticsEventArb, { minLength: 1, maxLength: 5 }),
          async (events) => {
            // Setup: Network unavailable
            mockNetInfoFetch.mockResolvedValue({ isConnected: false });
            
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();

            // Log events
            for (const event of events) {
              await (analyticsService as any).logEvent(event.eventName, event.properties);
            }

            // Force attempt to send
            await analyticsService.flush();

            // Events should remain in queue (not sent due to no network)
            expect(storedEvents.length).toBe(events.length);
            
            // Fetch should not have been called (no network)
            expect(mockFetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should send batched events when network is available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(analyticsEventArb, { minLength: 1, maxLength: 10 }),
          async (events) => {
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();

            // Log events
            for (const event of events) {
              await (analyticsService as any).logEvent(event.eventName, event.properties);
            }

            // Send events
            await analyticsService.flush();

            // Fetch should have been called with batched events
            expect(mockFetch).toHaveBeenCalledWith(
              expect.any(String),
              expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                  'Content-Type': 'application/json',
                }),
                body: expect.any(String),
              })
            );

            // Parse the sent batch
            const sentBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
            expect(sentBody.events).toHaveLength(events.length);
            expect(sentBody.deviceId).toBeDefined();
            expect(sentBody.appVersion).toBeDefined();
            expect(sentBody.platform).toBeDefined();

            // Queue should be cleared after successful send
            expect(storedEvents.length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain queue size limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 101, max: 200 }), // More than max queue size (100)
          async (eventCount) => {
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            // Prevent network sending to test queue limit
            mockNetInfoFetch.mockResolvedValue({ isConnected: false });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();

            // Log many events
            for (let i = 0; i < eventCount; i++) {
              await (analyticsService as any).logEvent('media_impression', { title_id: i });
            }

            // Queue should not exceed max size (100)
            expect(storedEvents.length).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

describe('Feature: moviestream-mvp, Property 32: Analytics Opt-Out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockAsyncStorageGetItem.mockResolvedValue(null);
    mockAsyncStorageSetItem.mockResolvedValue(undefined);
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Property 32: Analytics Opt-Out
   * For any UserPreferences with analyticsEnabled set to false, no Analytics_Events SHALL be logged.
   * 
   * **Validates: Requirements 19.4**
   */
  describe('Analytics Opt-Out Compliance', () => {
    it('should not log events when analytics is disabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          analyticsEventNameArb,
          eventPropertiesArb,
          async (eventName, properties) => {
            // Setup: Analytics disabled
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: false,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();

            // Attempt to log event
            await (analyticsService as any).logEvent(eventName, properties);

            // No events should be stored
            expect(storedEvents.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not log events when GDPR consent is not given', async () => {
      await fc.assert(
        fc.asyncProperty(
          analyticsEventNameArb,
          eventPropertiesArb,
          async (eventName, properties) => {
            // Setup: GDPR consent not given
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: true,
                gdprConsentGiven: false,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: null,
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();

            // Attempt to log event
            await (analyticsService as any).logEvent(eventName, properties);

            // No events should be stored
            expect(storedEvents.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect opt-out for all event logging methods', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000000 }),
          fc.constantFrom('movie', 'tv'),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (titleId, mediaType, sourceScreen) => {
            // Setup: Analytics disabled
            mockPreferencesGetState.mockReturnValue({
              preferences: {
                analyticsEnabled: false,
                gdprConsentGiven: true,
                themeMode: 'system',
                language: 'en',
                notificationsEnabled: true,
                notificationTypes: { downloads: true, newReleases: true },
                gdprConsentDate: new Date().toISOString(),
              },
            });

            let storedEvents: AnalyticsEvent[] = [];
            mockAsyncStorageSetItem.mockImplementation(async (_key: string, value: string) => {
              if (_key === '@moviestream/analytics_queue') {
                const state = JSON.parse(value);
                storedEvents = state.queue;
              }
            });

            await analyticsService.initialize();

            // Try all logging methods
            await analyticsService.logTrailerTap(titleId, mediaType as 'movie' | 'tv', sourceScreen);
            await analyticsService.logWatchlistAction(titleId, mediaType as 'movie' | 'tv', 'add');
            await analyticsService.logMediaImpressions([titleId], sourceScreen);
            await analyticsService.logSearchQuery('test query', 10);
            await analyticsService.logProviderTap(titleId, 'Netflix');
            await analyticsService.logScreenView('home');
            await analyticsService.logError('test error');

            // No events should be stored
            expect(storedEvents.length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
