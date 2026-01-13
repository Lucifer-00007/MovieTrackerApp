/**
 * Analytics Network Utilities
 * Handles sending analytics events to the server with retry logic
 * 
 * Requirements: 13.6, 19.4
 */

import NetInfo from '@react-native-community/netinfo';
import type { AnalyticsBatch } from '@/types/analytics';
import { calculateBackoffDelay, type RetryConfig } from '../api';

// Analytics configuration
export const ANALYTICS_CONFIG = {
  batchSize: 10,
  maxQueueSize: 100,
  sendIntervalMs: 30000, // 30 seconds
  maxRetryAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
} as const;

// Mock analytics endpoint (replace with real endpoint)
const ANALYTICS_ENDPOINT = 'https://api.moviestream.app/analytics';

/**
 * Check if device is connected to the internet
 */
export async function isNetworkConnected(): Promise<boolean> {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  } catch (error) {
    console.error('Failed to check network connectivity:', error);
    return false; // Assume no connection on error
  }
}

/**
 * Get platform info for analytics
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
 * Create analytics batch for sending
 */
export function createAnalyticsBatch(
  events: Array<{ eventName: string; properties: Record<string, unknown>; timestamp: string }>,
  deviceId: string,
  appVersion: string = '1.0.0'
): AnalyticsBatch {
  return {
    events,
    deviceId,
    appVersion,
    platform: getPlatform(),
  };
}

/**
 * Send analytics batch to server
 */
export async function sendAnalyticsBatch(
  batch: AnalyticsBatch,
  endpoint: string = ANALYTICS_ENDPOINT
): Promise<void> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `MovieStream/${batch.appVersion} (${batch.platform})`,
    },
    body: JSON.stringify(batch),
  });

  if (!response.ok) {
    const isRetryable = response.status >= 500 || response.status === 429;
    throw new AnalyticsNetworkError(
      `Analytics API error: ${response.status} ${response.statusText}`,
      response.status,
      isRetryable
    );
  }
}

/**
 * Send analytics batch with retry logic
 */
export async function sendAnalyticsBatchWithRetry(
  batch: AnalyticsBatch,
  config: RetryConfig = {
    maxAttempts: ANALYTICS_CONFIG.maxRetryAttempts,
    baseDelayMs: ANALYTICS_CONFIG.baseDelayMs,
    maxDelayMs: ANALYTICS_CONFIG.maxDelayMs,
  },
  endpoint: string = ANALYTICS_ENDPOINT
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      await sendAnalyticsBatch(batch, endpoint);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's the last attempt
      if (attempt === config.maxAttempts - 1) {
        throw lastError;
      }

      // Check if error is retryable
      const isRetryable = 
        lastError instanceof AnalyticsNetworkError ? lastError.isRetryable :
        lastError.message.includes('fetch') || // Network errors
        lastError.message.includes('timeout'); // Timeout errors

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

/**
 * Validate analytics batch before sending
 */
export function validateAnalyticsBatch(batch: AnalyticsBatch): boolean {
  if (!batch || typeof batch !== 'object') {
    return false;
  }

  return (
    Array.isArray(batch.events) &&
    typeof batch.deviceId === 'string' &&
    typeof batch.appVersion === 'string' &&
    typeof batch.platform === 'string' &&
    batch.events.every(event => 
      typeof event.eventName === 'string' &&
      typeof event.properties === 'object' &&
      typeof event.timestamp === 'string'
    )
  );
}

/**
 * Sanitize analytics batch for transmission
 */
export function sanitizeAnalyticsBatch(batch: AnalyticsBatch): AnalyticsBatch {
  return {
    ...batch,
    events: batch.events.map(event => ({
      ...event,
      properties: sanitizeProperties(event.properties),
    })),
  };
}

/**
 * Sanitize properties object
 */
function sanitizeProperties(
  properties: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  Object.entries(properties).forEach(([key, value]) => {
    // Ensure key is safe
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Ensure value is safe
    if (typeof value === 'string') {
      // Truncate long strings
      sanitized[safeKey] = value.substring(0, 1000);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[safeKey] = value;
    } else if (typeof value === 'boolean') {
      sanitized[safeKey] = value;
    } else if (value === null || value === undefined) {
      sanitized[safeKey] = null;
    } else {
      // Convert other types to string
      sanitized[safeKey] = String(value).substring(0, 1000);
    }
  });
  
  return sanitized;
}

/**
 * Analytics network error class
 */
export class AnalyticsNetworkError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AnalyticsNetworkError';
  }
}

/**
 * Check if analytics should be disabled based on environment
 */
export function isAnalyticsDisabled(): boolean {
  return process.env.EXPO_PUBLIC_DISABLE_ANALYTICS === 'true';
}

/**
 * Get analytics endpoint from environment or use default
 */
export function getAnalyticsEndpoint(): string {
  return process.env.EXPO_PUBLIC_ANALYTICS_ENDPOINT || ANALYTICS_ENDPOINT;
}