/**
 * Analytics Service for MovieStream MVP
 * Provides event logging, batching, and network-aware sending
 * Respects analytics opt-out preference
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 19.4
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { 
  AnalyticsEvent, 
  AnalyticsBatch, 
  AnalyticsState, 
  AnalyticsEventName 
} from '@/types/analytics';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { calculateBackoffDelay, type RetryConfig } from './api/tmdb';

// Get platform info
const getPlatform = (): 'ios' | 'android' | 'web' => {
  // In tests, this will return 'web' as fallback
  if (typeof jest !== 'undefined') {
    return 'web';
  }
  
  try {
    const { Platform } = require('react-native');
    return Platform.OS as 'ios' | 'android' | 'web';
  } catch {
    return 'web'; // Fallback for tests
  }
};

// Storage key for analytics queue
const ANALYTICS_STORAGE_KEY = '@moviestream/analytics_queue';

// Analytics configuration
const ANALYTICS_CONFIG = {
  batchSize: 10,
  maxQueueSize: 100,
  sendIntervalMs: 30000, // 30 seconds
  maxRetryAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
} as const;

// Mock analytics endpoint (replace with real endpoint)
const ANALYTICS_ENDPOINT = 'https://api.moviestream.app/analytics';

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
      // Generate or retrieve device ID
      this.deviceId = await this.getOrCreateDeviceId();
      
      // Load persisted queue
      await this.loadQueue();
      
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
    // Check if analytics is enabled
    const preferences = usePreferencesStore.getState().preferences;
    if (!preferences.analyticsEnabled || !preferences.gdprConsentGiven) {
      return;
    }

    const event: AnalyticsEvent = {
      eventName,
      properties: {
        ...properties,
        platform: getPlatform(),
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Add to queue
    this.queue.push(event);

    // Trim queue if it exceeds max size
    if (this.queue.length > ANALYTICS_CONFIG.maxQueueSize) {
      this.queue = this.queue.slice(-ANALYTICS_CONFIG.maxQueueSize);
    }

    // Persist queue
    await this.saveQueue();

    // Send immediately if batch size reached
    if (this.queue.length >= ANALYTICS_CONFIG.batchSize) {
      await this.sendEvents();
    }
  }

  /**
   * Log trailer tap event
   * @param titleId - Media ID
   * @param mediaType - Media type
   * @param sourceScreen - Screen where tap occurred
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
   * @param titleId - Media ID
   * @param mediaType - Media type
   * @param action - Action type (add/remove)
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
   * Log media impression event
   * @param titleIds - Array of visible media IDs
   * @param sourceScreen - Screen where impression occurred
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
   * @param query - Search query text
   * @param resultCount - Number of results returned
   */
  async logSearchQuery(query: string, resultCount: number): Promise<void> {
    await this.logEvent('search_query', {
      query_text: query,
      result_count: resultCount,
    });
  }

  /**
   * Log provider tap event
   * @param titleId - Media ID
   * @param providerName - Name of the streaming provider
   */
  async logProviderTap(titleId: number, providerName: string): Promise<void> {
    await this.logEvent('provider_tap', {
      title_id: titleId,
      provider_name: providerName,
    });
  }

  /**
   * Log screen view event
   * @param screenName - Name of the screen
   * @param params - Additional screen parameters
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
   * @param error - Error object or message
   * @param context - Additional context
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
    await this.saveQueue();
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
   * Get or create a unique device ID
   */
  private async getOrCreateDeviceId(): Promise<string> {
    const DEVICE_ID_KEY = '@moviestream/device_id';
    
    try {
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      
      if (!deviceId) {
        // Generate a new device ID
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Failed to get/create device ID:', error);
      // Fallback to a session-based ID
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Load persisted analytics queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        const state: AnalyticsState = JSON.parse(stored);
        this.queue = state.queue || [];
      }
    } catch (error) {
      console.error('Failed to load analytics queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save analytics queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      const state: AnalyticsState = {
        queue: this.queue,
        isEnabled: true, // This is managed by preferences store
        lastSentAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save analytics queue:', error);
    }
  }

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
    if (this.queue.length === 0 || !this.deviceId) {
      return;
    }

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
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
    const batch: AnalyticsBatch = {
      events: [...this.queue],
      deviceId: this.deviceId,
      appVersion: this.appVersion,
      platform: getPlatform(),
    };

    // Send with retry logic
    const retryConfig: RetryConfig = {
      maxAttempts: ANALYTICS_CONFIG.maxRetryAttempts,
      baseDelayMs: ANALYTICS_CONFIG.baseDelayMs,
      maxDelayMs: ANALYTICS_CONFIG.maxDelayMs,
    };

    try {
      await this.sendBatchWithRetry(batch, retryConfig);
      
      // Clear queue on successful send
      this.queue = [];
      await this.saveQueue();
    } catch (error) {
      console.error('Failed to send analytics batch:', error);
      // Keep events in queue for next attempt
    }
  }

  /**
   * Send analytics batch with retry logic
   */
  private async sendBatchWithRetry(
    batch: AnalyticsBatch,
    config: RetryConfig
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        const response = await fetch(ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `MovieStream/${this.appVersion} (${getPlatform()})`,
          },
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          const isRetryable = response.status >= 500 || response.status === 429;
          throw new Error(
            `Analytics API error: ${response.status} ${response.statusText}${
              isRetryable ? ' (retryable)' : ''
            }`
          );
        }

        // Success
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if it's the last attempt or a client error
        if (attempt === config.maxAttempts - 1) {
          throw lastError;
        }

        // Check if error is retryable (network errors and 5xx/429 responses)
        const isRetryable = 
          lastError.message.includes('fetch') || 
          lastError.message.includes('(retryable)');

        if (!isRetryable) {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        const delay = calculateBackoffDelay(attempt, config);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Unknown error during analytics send');
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export service instance and convenience functions
export { analyticsService };

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