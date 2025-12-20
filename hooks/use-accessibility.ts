/**
 * Accessibility hooks for MovieStream MVP
 * Provides utilities for screen reader support, dynamic type, and accessibility state
 * 
 * Requirements: 12.1, 12.4, 12.5
 */

import { useEffect, useState, useCallback } from 'react';
import { AccessibilityInfo, PixelRatio } from 'react-native';

/**
 * Hook to get current accessibility state
 * @returns Object with accessibility information
 */
export function useAccessibilityInfo() {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    // Get initial accessibility state
    const getInitialState = async () => {
      try {
        const [screenReader, reduceMotion] = await Promise.all([
          AccessibilityInfo.isScreenReaderEnabled(),
          AccessibilityInfo.isReduceMotionEnabled(),
        ]);
        
        setIsScreenReaderEnabled(screenReader);
        setIsReduceMotionEnabled(reduceMotion);
        setFontScale(PixelRatio.getFontScale());
      } catch (error) {
        console.warn('Failed to get accessibility info:', error);
      }
    };

    getInitialState();

    // Listen for accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );

    return () => {
      screenReaderListener?.remove();
      reduceMotionListener?.remove();
    };
  }, []);

  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    fontScale,
  };
}

/**
 * Hook to announce messages to screen readers
 * @returns Function to announce messages
 */
export function useScreenReaderAnnouncement() {
  const announceMessage = useCallback((message: string) => {
    if (message.trim()) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  return announceMessage;
}

/**
 * Hook to get scaled font size based on accessibility settings
 * @param baseSize - Base font size
 * @returns Scaled font size
 */
export function useDynamicTypeSize(baseSize: number): number {
  const { fontScale } = useAccessibilityInfo();
  
  // Limit scaling to prevent text from becoming too large
  const maxScale = 2.0;
  const limitedScale = Math.min(fontScale, maxScale);
  
  return Math.round(baseSize * limitedScale);
}

/**
 * Hook to get accessibility-aware animation duration
 * @param baseDuration - Base animation duration in ms
 * @returns Adjusted duration (0 if reduce motion is enabled)
 */
export function useAccessibleAnimationDuration(baseDuration: number): number {
  const { isReduceMotionEnabled } = useAccessibilityInfo();
  return isReduceMotionEnabled ? 0 : baseDuration;
}

/**
 * Generate accessibility label for navigation
 * @param screenName - Name of the screen
 * @param additionalInfo - Additional context information
 * @returns Formatted accessibility label
 */
export function generateNavigationLabel(screenName: string, additionalInfo?: string): string {
  const baseLabel = `${screenName} screen`;
  return additionalInfo ? `${baseLabel}, ${additionalInfo}` : baseLabel;
}

/**
 * Generate accessibility hint for interactive elements
 * @param action - Primary action (e.g., "view details", "play video")
 * @param secondaryAction - Optional secondary action (e.g., "long press for options")
 * @returns Formatted accessibility hint
 */
export function generateAccessibilityHint(action: string, secondaryAction?: string): string {
  const primaryHint = `Double tap to ${action}`;
  return secondaryAction ? `${primaryHint}. ${secondaryAction}` : primaryHint;
}

/**
 * Check if touch target meets minimum accessibility requirements
 * @param width - Touch target width
 * @param height - Touch target height
 * @param minSize - Minimum required size (default 44)
 * @returns True if touch target is accessible
 */
export function isAccessibleTouchTarget(
  width: number, 
  height: number, 
  minSize: number = 44
): boolean {
  return width >= minSize && height >= minSize;
}

/**
 * Get accessibility role for common UI elements
 * @param elementType - Type of UI element
 * @returns Appropriate accessibility role
 */
export function getAccessibilityRole(elementType: string): string {
  const roleMap: Record<string, string> = {
    'card': 'button',
    'tab': 'tab',
    'header': 'header',
    'section': 'header',
    'list': 'list',
    'item': 'button',
    'toggle': 'switch',
    'slider': 'adjustable',
    'link': 'link',
    'image': 'image',
    'text': 'text',
    'search': 'search',
  };
  
  return roleMap[elementType] || 'button';
}