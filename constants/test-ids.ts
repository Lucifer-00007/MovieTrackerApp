/**
 * Test ID constants
 * Centralized test identifiers for UI testing
 */

/** Screen test IDs */
export const SCREEN_TEST_IDS = {
  HOME: 'home-screen',
  SEARCH: 'search-screen',
  BROWSE: 'browse-screen',
  DOWNLOADS: 'downloads-screen',
  PROFILE: 'profile-screen',
  MOVIE_DETAIL: 'movie-detail-screen',
  TV_DETAIL: 'tv-detail-screen',
  COUNTRY_HUB: 'country-hub-screen',
} as const;

/** Component test IDs */
export const COMPONENT_TEST_IDS = {
  // Home screen components
  RECENTLY_VIEWED_ROW: 'home-recently-viewed-row',
  RECOMMENDATIONS_ROW: 'home-recommendations-row',
  TRENDING_MOVIES_ROW: 'home-trending-movies-row',
  POPULAR_MOVIES_ROW: 'home-popular-movies-row',
  TOP_WEB_SERIES_ROW: 'home-top-web-series-row',
  TRENDING_TV_ROW: 'home-trending-tv-row',
  
  // Search components
  SEARCH_INPUT: 'search-input',
  SEARCH_RESULTS_CONTAINER: 'search-results-container',
  SEARCH_MOVIES_SECTION: 'search-movies-section',
  SEARCH_TV_SECTION: 'search-tv-section',
  SEARCH_EMPTY_STATE: 'search-empty-state',
  
  // Profile components
  WATCHLIST_GRID: 'watchlist-grid',
  WATCHLIST_EMPTY: 'watchlist-empty',
  PROFILE_ERROR: 'profile-error',
  SYNC_STATUS_INDICATOR: 'sync-status-indicator',
  
  // Settings components
  APPEARANCE_SECTION: 'appearance-section',
  NOTIFICATIONS_SECTION: 'notifications-section',
  PRIVACY_SECTION: 'privacy-section',
  THEME_SETTING: 'theme-setting',
  LANGUAGE_SETTING: 'language-setting',
  NOTIFICATIONS_SETTING: 'notifications-setting',
  NOTIFICATIONS_TOGGLE: 'notifications-toggle',
  DOWNLOADS_NOTIFICATIONS_SETTING: 'downloads-notifications-setting',
  DOWNLOADS_NOTIFICATIONS_TOGGLE: 'downloads-notifications-toggle',
  NEW_RELEASES_NOTIFICATIONS_SETTING: 'new-releases-notifications-setting',
  NEW_RELEASES_NOTIFICATIONS_TOGGLE: 'new-releases-notifications-toggle',
  ANALYTICS_SETTING: 'analytics-setting',
  ANALYTICS_TOGGLE: 'analytics-toggle',
  
  // Country hub components
  COUNTRY_HUB_CONTENT_LIST: 'country-hub-content-list',
  
  // Downloads components
  DOWNLOADS_ERROR: 'downloads-error',
  DOWNLOADS_EMPTY: 'downloads-empty',
  
  // Movie detail components
  MOVIE_RECOMMENDATIONS: 'movie-recommendations',
  
  // Common UI components
  ERROR_STATE: 'error-state',
  EMPTY_STATE: 'empty-state',
  LOADING_STATE: 'loading-state',
} as const;

/** Action test IDs */
export const ACTION_TEST_IDS = {
  RETRY_BUTTON: 'retry-button',
  CLOSE_BUTTON: 'close-button',
  PLAY_BUTTON: 'play-button',
  PAUSE_BUTTON: 'pause-button',
  REMOVE_BUTTON: 'remove-button',
  ADD_TO_WATCHLIST: 'add-to-watchlist',
  REMOVE_FROM_WATCHLIST: 'remove-from-watchlist',
} as const;

/** Storage keys */
export const STORAGE_KEYS = {
  USER_LOCALE_PREFERENCE: 'user_locale_preference',
  THEME_PREFERENCE: 'theme_preference',
  ANALYTICS_CONSENT: 'analytics_consent',
  WATCHLIST_DATA: 'watchlist_data',
  DOWNLOADS_DATA: 'downloads_data',
} as const;


/** Icon names used throughout the app */
export const ICON_NAMES = {
  ALERT_CIRCLE: 'alert-circle-outline',
  CLOUD_OFFLINE: 'cloud-offline-outline',
  CHECKMARK_CIRCLE: 'checkmark-circle',
  CLOSE_CIRCLE: 'close-circle',
  SYNC: 'sync',
} as const;
