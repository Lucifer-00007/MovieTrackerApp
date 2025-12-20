/**
 * ContentRow utility functions
 * Pure logic functions for pagination and infinite scroll
 */

import type { MediaItem } from '@/types/media';

/** Pagination state for infinite scroll */
export interface PaginationState {
  page: number;
  totalPages: number;
  totalResults: number;
  items: MediaItem[];
}

/** Result of loading the next page */
export interface LoadNextPageResult {
  newState: PaginationState;
  hasMore: boolean;
}

/**
 * Calculate if there are more pages to load
 */
export function hasMorePages(state: PaginationState): boolean {
  return state.page < state.totalPages;
}

/**
 * Calculate the next page number
 */
export function getNextPage(state: PaginationState): number {
  return state.page + 1;
}

/**
 * Merge new items into existing pagination state
 * Ensures no duplicate items and maintains order
 */
export function mergePageResults(
  currentState: PaginationState,
  newItems: MediaItem[],
  newPage: number,
  totalPages: number,
  totalResults: number
): PaginationState {
  // Filter out duplicates based on id
  const existingIds = new Set(currentState.items.map(item => item.id));
  const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
  
  return {
    page: newPage,
    totalPages,
    totalResults,
    items: [...currentState.items, ...uniqueNewItems],
  };
}

/**
 * Create initial pagination state
 */
export function createInitialPaginationState(
  items: MediaItem[],
  page: number,
  totalPages: number,
  totalResults: number
): PaginationState {
  return {
    page,
    totalPages,
    totalResults,
    items,
  };
}

/**
 * Calculate expected item count after loading a page
 * Assumes consistent page size
 */
export function calculateExpectedItemCount(
  currentCount: number,
  pageSize: number,
  isLastPage: boolean,
  remainingItems: number
): number {
  if (isLastPage) {
    return currentCount + remainingItems;
  }
  return currentCount + pageSize;
}

/**
 * Validate pagination invariants
 */
export function validatePaginationState(state: PaginationState): boolean {
  // Page must be positive
  if (state.page < 1) return false;
  
  // Total pages must be non-negative
  if (state.totalPages < 0) return false;
  
  // Page cannot exceed total pages (unless total is 0)
  if (state.totalPages > 0 && state.page > state.totalPages) return false;
  
  // Total results must be non-negative
  if (state.totalResults < 0) return false;
  
  // Items count should not exceed total results
  if (state.items.length > state.totalResults) return false;
  
  return true;
}
