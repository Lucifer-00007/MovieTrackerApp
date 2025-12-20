/**
 * AccessibleText Component
 * Text component with automatic dynamic type scaling support
 * 
 * Requirements: 12.4
 */

import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useDynamicTypeSize } from '@/hooks/use-accessibility';

export interface AccessibleTextProps extends TextProps {
  /** Base font size (will be scaled based on accessibility settings) */
  fontSize?: number;
  /** Whether to enable dynamic type scaling (default: true) */
  enableDynamicType?: boolean;
  /** Maximum scale factor to prevent text from becoming too large (default: 2.0) */
  maxScale?: number;
}

/**
 * Text component that automatically scales based on accessibility settings
 */
export function AccessibleText({
  fontSize,
  enableDynamicType = true,
  maxScale = 2.0,
  style,
  ...props
}: AccessibleTextProps) {
  // Get the base font size from style if not provided as prop
  const baseSize = fontSize || (style && typeof style === 'object' && 'fontSize' in style 
    ? (style as TextStyle).fontSize || 16 
    : 16);
  
  // Get scaled font size
  const scaledSize = useDynamicTypeSize(baseSize);
  
  // Apply scaling limit if specified
  const finalSize = enableDynamicType 
    ? Math.min(scaledSize, baseSize * maxScale)
    : baseSize;
  
  // Merge styles with scaled font size
  const mergedStyle = [
    style,
    enableDynamicType && { fontSize: finalSize },
  ].filter(Boolean);
  
  return (
    <Text
      {...props}
      style={mergedStyle}
      allowFontScaling={enableDynamicType}
    />
  );
}

export default AccessibleText;