/**
 * Error state utility functions
 * Pure logic functions for error handling and display
 */

/** Error types that can occur in the app */
export type ErrorType = 
  | 'network_offline'
  | 'server_error'
  | 'not_found'
  | 'timeout'
  | 'unknown';

/** Error state configuration */
export interface ErrorConfig {
  type: ErrorType;
  title: string;
  message: string;
  icon: string;
  canRetry: boolean;
}

/** Filter result state */
export interface FilterResultState {
  hasResults: boolean;
  totalResults: number;
  appliedFilters: string[];
}

/**
 * Determine if offline banner should be displayed
 */
export function shouldShowOfflineBanner(isOffline: boolean): boolean {
  return isOffline === true;
}

/**
 * Determine if server error should be displayed
 */
export function shouldShowServerError(
  statusCode: number | null,
  hasError: boolean
): boolean {
  if (!hasError) return false;
  if (statusCode === null) return false;
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Get error configuration based on error type
 */
export function getErrorConfig(type: ErrorType): ErrorConfig {
  const configs: Record<ErrorType, ErrorConfig> = {
    network_offline: {
      type: 'network_offline',
      title: "You're offline",
      message: 'Please check your internet connection and try again.',
      icon: 'cloud-offline-outline',
      canRetry: true,
    },
    server_error: {
      type: 'server_error',
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      icon: 'server-outline',
      canRetry: true,
    },
    not_found: {
      type: 'not_found',
      title: 'Not Found',
      message: 'The content you are looking for could not be found.',
      icon: 'search-outline',
      canRetry: false,
    },
    timeout: {
      type: 'timeout',
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      icon: 'time-outline',
      canRetry: true,
    },
    unknown: {
      type: 'unknown',
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again.',
      icon: 'alert-circle-outline',
      canRetry: true,
    },
  };
  
  return configs[type];
}

/**
 * Determine error type from HTTP status code
 */
export function getErrorTypeFromStatusCode(statusCode: number | null): ErrorType {
  if (statusCode === null) return 'network_offline';
  if (statusCode === 404) return 'not_found';
  if (statusCode === 408) return 'timeout';
  if (statusCode >= 500) return 'server_error';
  return 'unknown';
}

/**
 * Check if empty filter results should show suggestions
 */
export function shouldShowFilterSuggestions(state: FilterResultState): boolean {
  return !state.hasResults && state.appliedFilters.length > 0;
}

/**
 * Generate filter suggestions based on applied filters
 */
export function generateFilterSuggestions(appliedFilters: string[]): string[] {
  if (appliedFilters.length === 0) return [];
  
  const suggestions: string[] = [];
  
  if (appliedFilters.length > 1) {
    suggestions.push('Try removing some filters');
  }
  
  if (appliedFilters.includes('year')) {
    suggestions.push('Try a different year range');
  }
  
  if (appliedFilters.includes('genre')) {
    suggestions.push('Try a different genre');
  }
  
  if (appliedFilters.includes('country')) {
    suggestions.push('Try a different country');
  }
  
  if (appliedFilters.includes('contentType')) {
    suggestions.push('Try a different content type');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Try adjusting your filters');
  }
  
  return suggestions;
}

/**
 * Validate error state is properly configured
 */
export function validateErrorConfig(config: ErrorConfig): boolean {
  if (!config.type) return false;
  if (!config.title || config.title.length === 0) return false;
  if (!config.message || config.message.length === 0) return false;
  if (!config.icon || config.icon.length === 0) return false;
  if (typeof config.canRetry !== 'boolean') return false;
  return true;
}
