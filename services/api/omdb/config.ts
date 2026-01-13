/**
 * OMDb API Configuration
 * Configuration and setup utilities for OMDb API
 */

import { API_BASE_URLS, ANIMATION_DURATION } from '@/constants';
import type { OMDbConfig, RetryConfig } from './types';

/** Get API key from environment variable */
export const getOMDbApiKey = (): string => {
  return process.env.EXPO_PUBLIC_OMDB_API_KEY || '';
};

/** Get OMDb configuration */
export const getOMDbConfig = (): OMDbConfig => ({
  baseUrl: API_BASE_URLS.OMDB,
  apiKey: getOMDbApiKey(),
  timeout: ANIMATION_DURATION.API_TIMEOUT,
});

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: ANIMATION_DURATION.API_RETRY_DELAY,
  maxDelayMs: ANIMATION_DURATION.API_TIMEOUT,
  backoffFactor: 2,
  jitter: true,
};