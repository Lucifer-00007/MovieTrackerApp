/**
 * Analytics type definitions for MovieStream MVP
 * Defines analytics events and tracking properties
 */

/** Analytics event names */
export type AnalyticsEventName =
  | 'trailer_tap'
  | 'watchlist_add'
  | 'watchlist_remove'
  | 'media_impression'
  | 'search_query'
  | 'provider_tap'
  | 'screen_view'
  | 'download_start'
  | 'download_complete'
  | 'error';

/** Analytics event with properties */
export interface AnalyticsEvent {
  eventName: AnalyticsEventName;
  properties: Record<string, string | number | boolean>;
  timestamp: string;
}

/** Analytics batch for network transmission */
export interface AnalyticsBatch {
  events: AnalyticsEvent[];
  deviceId: string;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
}

/** Analytics state for the service */
export interface AnalyticsState {
  queue: AnalyticsEvent[];
  isEnabled: boolean;
  lastSentAt: string | null;
}
