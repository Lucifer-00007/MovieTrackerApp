/**
 * Layout constants
 * Dimensions and sizing values used throughout the app
 */

/** Common dimensions */
export const DIMENSIONS = {
  /** Button and touchable sizes */
  TOUCH_TARGET_MIN: 44,
  BUTTON_HEIGHT: 48,
  
  /** Icon sizes */
  ICON_XS: 16,
  ICON_SM: 20,
  ICON_MD: 24,
  ICON_LG: 28,
  ICON_XL: 32,
  ICON_XXL: 48,
  ICON_XXXL: 64,
  
  /** Card and container sizes */
  CARD_BORDER_RADIUS: 12,
  POSTER_ASPECT_RATIO: 1.5, // height = width * 1.5
  
  /** Specific component sizes */
  HEADER_ICON_SIZE: 44,
  SYNC_INDICATOR_SIZE: 20,
  REMOVE_BUTTON_SIZE: 24,
  PROGRESS_BAR_HEIGHT: 4,
  
  /** Media card dimensions */
  POSTER_SMALL_WIDTH: 60,
  POSTER_SMALL_HEIGHT: 90,
  POSTER_MEDIUM_WIDTH: 100,
  POSTER_MEDIUM_HEIGHT: 150,
  POSTER_CARD_WIDTH: 80,
  POSTER_CARD_HEIGHT: 120,
  
  /** Layout measurements */
  SEPARATOR_HEIGHT: 1,
  DIVIDER_HEIGHT: 30,
  SEARCH_INPUT_HEIGHT: 48,
  FILTER_CHIP_HEIGHT: 36,
  DROPDOWN_MAX_HEIGHT: 250,
  
  /** Circle sizes */
  CIRCLE_SM: 28,
  CIRCLE_MD: 36,
  CIRCLE_LG: 44,
  CIRCLE_XL: 70,
  CIRCLE_XXL: 100,
  
  /** Parallax scroll view */
  PARALLAX_HEADER_HEIGHT: 250,
  PARALLAX_CONTENT_PADDING: 32,
  PARALLAX_CONTENT_GAP: 16,
  
  /** GDPR Modal */
  GDPR_MODAL_MAX_WIDTH: 400,
  GDPR_ICON_CONTAINER_SIZE: 64,
} as const;

/** Z-index values */
export const Z_INDEX = {
  DROPDOWN: 100,
  MODAL: 1000,
  OVERLAY: 10,
  FILTERS: 10,
} as const;

/** Shadow properties */
export const SHADOWS = {
  DROPDOWN: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
} as const;