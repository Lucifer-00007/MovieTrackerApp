import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useDynamicTypeSize } from '@/hooks/use-accessibility';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  /** Whether to enable dynamic type scaling (default: true) */
  enableDynamicType?: boolean;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  enableDynamicType = true,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  
  // Get base font size for the type
  const baseFontSize = getBaseFontSize(type);
  const scaledFontSize = useDynamicTypeSize(baseFontSize);
  
  // Apply dynamic type scaling if enabled
  const dynamicStyle = enableDynamicType ? { fontSize: scaledFontSize } : {};

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        dynamicStyle,
        style,
      ]}
      allowFontScaling={enableDynamicType}
      {...rest}
    />
  );
}

function getBaseFontSize(type: ThemedTextProps['type']): number {
  switch (type) {
    case 'title': return 32;
    case 'subtitle': return 20;
    case 'link': return 16;
    case 'defaultSemiBold': return 16;
    case 'default':
    default: return 16;
  }
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
