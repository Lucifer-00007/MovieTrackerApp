/**
 * Analytics Storage Utilities
 * Handles persistence of analytics events and device identification
 * 
 * Requirements: 13.4, 13.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalyticsEvent, AnalyticsState } from '@/types/analytics';

// Storage keys
const ANALYTICS_STORAGE_KEY = '@moviestream/analytics_queue';
const DEVICE_ID_KEY = '@moviestream/device_id';

/**
 * Get or create a unique device ID
 */
export async function getOrCreateDeviceId(): Promise<string> {
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
export async function loadAnalyticsQueue(): Promise<AnalyticsEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (stored) {
      const state: AnalyticsState = JSON.parse(stored);
      return state.queue || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to load analytics queue:', error);
    return [];
  }
}

/**
 * Save analytics queue to storage
 */
export async function saveAnalyticsQueue(queue: AnalyticsEvent[]): Promise<void> {
  try {
    const state: AnalyticsState = {
      queue,
      isEnabled: true, // This is managed by preferences store
      lastSentAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save analytics queue:', error);
  }
}

/**
 * Clear analytics queue from storage
 */
export async function clearAnalyticsQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear analytics queue:', error);
  }
}

/**
 * Get analytics queue size without loading full queue
 */
export async function getAnalyticsQueueSize(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (stored) {
      const state: AnalyticsState = JSON.parse(stored);
      return state.queue?.length || 0;
    }
    return 0;
  } catch (error) {
    console.error('Failed to get analytics queue size:', error);
    return 0;
  }
}

/**
 * Trim analytics queue to maximum size
 */
export function trimAnalyticsQueue(
  queue: AnalyticsEvent[], 
  maxSize: number
): AnalyticsEvent[] {
  if (queue.length <= maxSize) {
    return queue;
  }
  
  // Keep the most recent events
  return queue.slice(-maxSize);
}

/**
 * Validate analytics state structure
 */
export function validateAnalyticsState(state: unknown): state is AnalyticsState {
  if (!state || typeof state !== 'object') {
    return false;
  }
  
  const s = state as Record<string, unknown>;
  
  return (
    Array.isArray(s.queue) &&
    typeof s.isEnabled === 'boolean' &&
    typeof s.lastSentAt === 'string'
  );
}

/**
 * Migrate old analytics storage format if needed
 */
export async function migrateAnalyticsStorage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!stored) {
      return; // No data to migrate
    }
    
    const data = JSON.parse(stored);
    
    // Check if it's already in the new format
    if (validateAnalyticsState(data)) {
      return; // Already migrated
    }
    
    // Handle old format (if it was just an array of events)
    if (Array.isArray(data)) {
      const newState: AnalyticsState = {
        queue: data,
        isEnabled: true,
        lastSentAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(newState));
      console.log('Migrated analytics storage to new format');
    }
  } catch (error) {
    console.error('Failed to migrate analytics storage:', error);
    // Clear corrupted data
    await clearAnalyticsQueue();
  }
}