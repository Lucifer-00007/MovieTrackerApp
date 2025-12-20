/**
 * Route change announcements for screen readers
 * Announces navigation changes to improve accessibility
 * 
 * Requirements: 12.5
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useScreenReaderAnnouncement, generateNavigationLabel } from './use-accessibility';

/**
 * Map of route patterns to user-friendly screen names
 */
const ROUTE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/(tabs)': 'Home',
  '/(tabs)/index': 'Home',
  '/(tabs)/browse': 'Browse',
  '/(tabs)/downloads': 'Downloads',
  '/(tabs)/search': 'Search',
  '/(tabs)/profile': 'Profile',
  '/movie/[id]': 'Movie Details',
  '/tv/[id]': 'TV Show Details',
  '/country/[code]': 'Country Hub',
  '/trailer/[key]': 'Trailer Player',
  '/modal': 'Modal',
};

/**
 * Get user-friendly screen name from pathname
 * @param pathname - Current route pathname
 * @returns User-friendly screen name
 */
function getScreenName(pathname: string): string {
  // Check for exact matches first
  if (ROUTE_NAMES[pathname]) {
    return ROUTE_NAMES[pathname];
  }
  
  // Check for pattern matches
  for (const [pattern, name] of Object.entries(ROUTE_NAMES)) {
    if (pattern.includes('[') && matchesPattern(pathname, pattern)) {
      return name;
    }
  }
  
  // Fallback: convert pathname to readable name
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Home';
  
  const lastSegment = segments[segments.length - 1];
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
}

/**
 * Check if pathname matches a route pattern
 * @param pathname - Actual pathname
 * @param pattern - Route pattern with [param] syntax
 * @returns True if pathname matches pattern
 */
function matchesPattern(pathname: string, pattern: string): boolean {
  const pathSegments = pathname.split('/').filter(Boolean);
  const patternSegments = pattern.split('/').filter(Boolean);
  
  if (pathSegments.length !== patternSegments.length) {
    return false;
  }
  
  return patternSegments.every((segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return true; // Dynamic segment matches anything
    }
    return segment === pathSegments[index];
  });
}

/**
 * Hook to announce route changes to screen readers
 * Automatically announces when the user navigates to a new screen
 */
export function useRouteAnnouncements() {
  const pathname = usePathname();
  const announceMessage = useScreenReaderAnnouncement();
  const previousPathnameRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Don't announce on initial load
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname;
      return;
    }
    
    // Don't announce if pathname hasn't changed
    if (previousPathnameRef.current === pathname) {
      return;
    }
    
    // Announce the new screen
    const screenName = getScreenName(pathname);
    const announcement = generateNavigationLabel(screenName);
    
    // Small delay to ensure the screen has loaded
    const timeoutId = setTimeout(() => {
      announceMessage(announcement);
    }, 500);
    
    previousPathnameRef.current = pathname;
    
    return () => clearTimeout(timeoutId);
  }, [pathname, announceMessage]);
}

/**
 * Hook to manually announce custom navigation events
 * @returns Function to announce custom navigation messages
 */
export function useCustomRouteAnnouncement() {
  const announceMessage = useScreenReaderAnnouncement();
  
  return (screenName: string, additionalInfo?: string) => {
    const announcement = generateNavigationLabel(screenName, additionalInfo);
    announceMessage(announcement);
  };
}