/**
 * Analytics Service Main Module
 * Provides the main AnalyticsService class and convenience functions
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 19.4
 */

import { usePreferencesStore } from '@/stores/preferencesStore';
import type { AnalyticsEvent, AnalyticsEventName } from '@/types/analytics';
import { 
  createEvent, 
  validateEventProperties, 
  sanitizeEventProperties,
  type EventTypeMap 
} from './events';
import {
  getOrCreateDeviceId,
  loadAnalyticsQueue,
  saveAnalyticsQueue,
  clearAnalyticsQueue as clearStoredQueue,
  trimAnalyticsQueue,
  migrateAnalyticsStorage,
} from './storage';
import {
  isNetworkConnected,
  createAnalyticsBatch,
  sendAnalyticsBatchWithRetry,
  validateAnalyticsBatch,
  sanitizeAnalyticsBatch,
  isAnalyticsDisabled,
  getAnalyticsEndpoint,
  ANALYTICS_CONFIG,
  type AnalyticsNetworkError,
} from './network';

/** Analytics service class */
class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private isInitialized = false;
  private sendTimer: ReturnType<typeof setInterval> | null = null;
  private deviceId: string | null = null;
  private appVersion: string = '1.0.0'; // Should come from app.json in real app

  /**
   * Initialize the analytics service
   * Loads persisted queue and starts periodic sending
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Migrate storage format if needed
      await migrateAnalyticsStorage();
      
      // Generate or retrieve device ID
      this.deviceId = await getOrCreateDeviceId();
      
      // Load persisted queue
      this.queue = await loadAnalyticsQueue();
      
      // Trim queue if it's too large
      this.queue = trimAnalyticsQueue(this.queue, ANALYTICS_CONFIG.maxQueueSize);
      
      // Start periodic sending
      this.startPeriodicSending();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
    }
  }

  /**
   * Log an analytics event
   * @param eventName - Name of the event
   * @param properties - Event properties
   */
  async logEvent(
    eventName: AnalyticsEventName,
    properties: Record<string, string | number | boolean> = {}
  ): Promise<void> {
    // Check if analytics is disabled via environment
    if (isAnalyticsDisabled()) {
      return;
    }

    // Check if analytics is enabled in preferences
    const preferences = usePreferencesStore.getState().preferences;
    if (!preferences.analyticsEnabled || !preferences.gdprConsentGiven) {
      return;
    }

    // Validate event properties
    if (!validateEventProperties(eventName, properties)) {
      console.warn(`[Analytics] Invalid properties for event ${eventName}:`, properties);
      return;
    }

    // Sanitize properties
    const sanitizedProperties = sanitizeEventProperties(properties);

    const event = createEvent(eventName, sanitizedProperties as EventTypeMap[typeof eventName]);

    // Add to queue
    this.queue.push(event);

    // Trim queue if it exceeds max size
    this.queue = trimAnalyticsQueue(this.queue, ANALYTICS_CONFIG.maxQueueSize);

    // Persist queue
    await saveAnalyticsQueue(this.queue);

    // Send immediately if batch size reached
    if (this.queue.length >= ANALYTICS_CONFIG.batchSize) {
      await this.sendEvents();
    }
  }

  /**
   * Log trailer tap event
   */
  async logTrailerTap(
    titleId: number,
    mediaType: 'movie' | 'tv',
    sourceScreen: string
  ): Promise<void> {
    await this.logEvent('trailer_tap', {
      title_id: titleId,
      media_type: mediaType,
      source_screen: sourceScreen,
    });
  }

  /**
   * Log watchlist action event
   */
  async logWatchlistAction(
    titleId: number,
    mediaType: 'movie' | 'tv',
    action: 'add' | 'remove'
  ): Promise<void> {
    const eventName = action === 'add' ? 'watchlist_add' : 'watchlist_remove';
    await this.logEvent(eventName, {
      title_id: titleId,
      media_type: mediaType,
    });
  }

  /**
   * Log media impression events
   */
  async logMediaImpressions(
    titleIds: number[],
    sourceScreen: string
  ): Promise<void> {
    for (const titleId of titleIds) {
      await this.logEvent('media_impression', {
        title_id: titleId,
        source_screen: sourceScreen,
      });
    }
  }

  /**
   * Log search query event
   */
  async logSearchQuery(query: string, resultCount: number): Promise<void> {
    await this.logEvent('search_query', {
      query_text: query,
      result_count: resultCount,
    });
  }

  /**
   * Log provider tap event
   */
  async logProviderTap(titleId: number, providerName: string): Promise<void> {
    await this.logEvent('provider_tap', {
      title_id: titleId,
      provider_name: providerName,
    });
  }

  /**
   * Log screen view event
   */
  async logScreenView(
    screenName: string,
    params: Record<string, string | number> = {}
  ): Promise<void> {
    await this.logEvent('screen_view', {
      screen_name: screenName,
      ...params,
    });
  }

  /**
   * Log error event
   */
  async logError(
    error: Error | string,
    context: Record<string, string | number> = {}
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    await this.logEvent('error', {
      error_message: errorMessage,
      error_stack: errorStack || '',
      ...context,
    });
  }

  /**
   * Force send all queued events
   */
  async flush(): Promise<void> {
    await this.sendEvents();
  }

  /**
   * Clear all queued events
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await clearStoredQueue();
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Shutdown the analytics service
   */
  shutdown(): void {
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
    }
    this.isInitialized = false;
  }

  // Private methods

  /**
   * Start periodic sending of analytics events
   */
  private startPeriodicSending(): void {
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
    }

    this.sendTimer = setInterval(() => {
      this.sendEvents().catch(error => {
        console.error('Periodic analytics send failed:', error);
      });
    }, ANALYTICS_CONFIG.sendIntervalMs);
  }

  /**
   * Send queued events to analytics endpoint
   */
  private async sendEvents(): Promise<void> {
    // Check if analytics is disabled via environment
    if (isAnalyticsDisabled()) {
      this.queue = [];
      return;
    }

    if (this.queue.length === 0 || !this.deviceId) {
      return;
    }

    // Check network connectivity
    if (!(await isNetworkConnected())) {
      return;
    }

    // Check if analytics is still enabled
    const preferences = usePreferencesStore.getState().preferences;
    if (!preferences.analyticsEnabled || !preferences.gdprConsentGiven) {
      // Clear queue if analytics was disabled
      await this.clearQueue();
      return;
    }

    // Create batch
    const batch = createAnalyticsBatch(
      [...this.queue],
      this.deviceId,
      this.appVersion
    );

    // Validate and sanitize batch
    if (!validateAnalyticsBatch(batch)) {
      console.error('Invalid analytics batch, clearing queue');
      await this.clearQueue();
      return;
    }

    const sanitizedBatch = sanitizeAnalyticsBatch(batch);

    try {
      await sendAnalyticsBatchWithRetry(sanitizedBatch, undefined, getAnalyticsEndpoint());
      
      // Clear queue on successful send
      this.queue = [];
      await saveAnalyticsQueue(this.queue);
    } catch (error) {
      console.error('Failed to send analytics batch:', error);
      // Keep events in queue for next attempt
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export service instance and convenience functions
export { analyticsService };

// Export types and utilities
export type { AnalyticsEvent, AnalyticsEventName, EventTypeMap };
export { AnalyticsNetworkError } from './network';
export { ANALYTICS_CONFIG } from './network';

/**
 * Initialize analytics service
 * Call this once during app startup
 */
export const initializeAnalytics = () => analyticsService.initialize();

/**
 * Log trailer tap event
 */
export const logTrailerTap = (
  titleId: number,
  mediaType: 'movie' | 'tv',
  sourceScreen: string
) => analyticsService.logTrailerTap(titleId, mediaType, sourceScreen);

/**
 * Log watchlist action event
 */
export const logWatchlistAction = (
  titleId: number,
  mediaType: 'movie' | 'tv',
  action: 'add' | 'remove'
) => analyticsService.logWatchlistAction(titleId, mediaType, action);

/**
 * Log media impression events
 */
export const logMediaImpressions = (
  titleIds: number[],
  sourceScreen: string
) => analyticsService.logMediaImpressions(titleIds, sourceScreen);

/**
 * Log search query event
 */
export const logSearchQuery = (query: string, resultCount: number) =>
  analyticsService.logSearchQuery(query, resultCount);

/**
 * Log provider tap event
 */
export const logProviderTap = (titleId: number, providerName: string) =>
  analyticsService.logProviderTap(titleId, providerName);

/**
 * Log screen view event
 */
export const logScreenView = (
  screenName: string,
  params?: Record<string, string | number>
) => analyticsService.logScreenView(screenName, params);

/**
 * Log error event
 */
export const logError = (
  error: Error | string,
  context?: Record<string, string | number>
) => analyticsService.logError(error, context);

/**
 * Force send all queued events
 */
export const flushAnalytics = () => analyticsService.flush();

/**
 * Clear all queued events
 */
export const clearAnalyticsQueue = () => analyticsService.clearQueue();

/**
 * Get current queue size
 */
export const getAnalyticsQueueSize = () => analyticsService.getQueueSize();

/**
 * Shutdown analytics service
 */
export const shutdownAnalytics = () => analyticsService.shutdown();