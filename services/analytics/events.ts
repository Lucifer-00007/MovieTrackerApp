/**
 * Analytics Event Types and Logging Functions
 * Provides typed event logging for different user actions
 * 
 * Requirements: 13.1, 13.2, 13.3
 */

import type { AnalyticsEventName } from '@/types/analytics';

/** Event properties for trailer tap */
export interface TrailerTapEventProps {
  title_id: number;
  media_type: 'movie' | 'tv';
  source_screen: string;
}

/** Event properties for watchlist actions */
export interface WatchlistEventProps {
  title_id: number;
  media_type: 'movie' | 'tv';
}

/** Event properties for media impressions */
export interface MediaImpressionEventProps {
  title_id: number;
  source_screen: string;
}

/** Event properties for search queries */
export interface SearchQueryEventProps {
  query_text: string;
  result_count: number;
}

/** Event properties for provider taps */
export interface ProviderTapEventProps {
  title_id: number;
  provider_name: string;
}

/** Event properties for screen views */
export interface ScreenViewEventProps {
  screen_name: string;
  [key: string]: string | number;
}

/** Event properties for errors */
export interface ErrorEventProps {
  error_message: string;
  error_stack: string;
  [key: string]: string | number;
}

/** Base analytics event structure */
export interface AnalyticsEvent {
  eventName: AnalyticsEventName;
  properties: Record<string, string | number | boolean>;
  timestamp: string;
}

/** Event type mapping for type safety */
export interface EventTypeMap {
  'trailer_tap': TrailerTapEventProps;
  'watchlist_add': WatchlistEventProps;
  'watchlist_remove': WatchlistEventProps;
  'media_impression': MediaImpressionEventProps;
  'search_query': SearchQueryEventProps;
  'provider_tap': ProviderTapEventProps;
  'screen_view': ScreenViewEventProps;
  'error': ErrorEventProps;
}

/**
 * Create a typed analytics event
 */
export function createEvent<T extends AnalyticsEventName>(
  eventName: T,
  properties: EventTypeMap[T]
): AnalyticsEvent {
  return {
    eventName,
    properties: {
      ...properties,
      platform: getPlatform(),
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get platform info
 */
function getPlatform(): 'ios' | 'android' | 'web' {
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
}

/**
 * Validate event properties
 */
export function validateEventProperties(
  eventName: AnalyticsEventName,
  properties: Record<string, string | number | boolean>
): boolean {
  // Basic validation - ensure required properties exist
  switch (eventName) {
    case 'trailer_tap':
      return typeof properties.title_id === 'number' && 
             typeof properties.media_type === 'string' &&
             typeof properties.source_screen === 'string';
    
    case 'watchlist_add':
    case 'watchlist_remove':
      return typeof properties.title_id === 'number' && 
             typeof properties.media_type === 'string';
    
    case 'media_impression':
      return typeof properties.title_id === 'number' && 
             typeof properties.source_screen === 'string';
    
    case 'search_query':
      return typeof properties.query_text === 'string' && 
             typeof properties.result_count === 'number';
    
    case 'provider_tap':
      return typeof properties.title_id === 'number' && 
             typeof properties.provider_name === 'string';
    
    case 'screen_view':
      return typeof properties.screen_name === 'string';
    
    case 'error':
      return typeof properties.error_message === 'string';
    
    default:
      return true; // Allow unknown events for extensibility
  }
}

/**
 * Sanitize event properties to ensure they're safe for transmission
 */
export function sanitizeEventProperties(
  properties: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
  const sanitized: Record<string, string | number | boolean> = {};
  
  Object.entries(properties).forEach(([key, value]) => {
    // Ensure key is safe
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Ensure value is safe
    if (typeof value === 'string') {
      // Truncate long strings and remove sensitive patterns
      let safeValue = value.substring(0, 1000);
      // Remove potential PII patterns (basic)
      safeValue = safeValue.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED]'); // Credit cards
      safeValue = safeValue.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]'); // Emails
      sanitized[safeKey] = safeValue;
    } else if (typeof value === 'number') {
      // Ensure number is finite
      sanitized[safeKey] = Number.isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      sanitized[safeKey] = value;
    }
  });
  
  return sanitized;
}