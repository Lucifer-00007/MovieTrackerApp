import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useDynamicTypeSize } from '@/hooks/use-accessibility';
import { SOLID_COLORS, Typography } from '@/constants/colors';

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
    case 'title': return Typography.sizes.xxxl;
    case 'subtitle': return Typography.sizes.xl;
    case 'link': return Typography.sizes.md;
    case 'defaultSemiBold': return Typography.sizes.md;
    case 'default':
    default: return Typography.sizes.md;
  }
}

const styles = StyleSheet.create({
  default: {
    fontSize: Typography.sizes.md,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: Typography.sizes.md,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: Typography.sizes.md,
    color: SOLID_COLORS.BLUE_LINK,
  },
});
