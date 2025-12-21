# Constants Directory

This directory contains app-wide constants, configuration values, and theme definitions for the MovieTracker app.

## Structure

### Core Files
- **theme.ts** - Colors, fonts, and spacing for light/dark themes

## Theme System

### Colors
The theme system provides consistent colors across light and dark modes:

```typescript
// Light theme colors
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    // ... more colors
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    // ... more colors
  },
};
```

### Typography
Font definitions and text styles:
- Font families and weights
- Text sizes and line heights
- Platform-specific font handling

### Spacing & Layout
Consistent spacing values:
- Margins and padding scales
- Border radius values
- Component dimensions

## Usage

### Accessing Theme Colors
```typescript
import { useThemeColor } from '@/hooks/use-theme-color';

function MyComponent() {
  const backgroundColor = useThemeColor(
    { light: Colors.light.background, dark: Colors.dark.background },
    'background'
  );
  
  return <View style={{ backgroundColor }} />;
}
```

### Using Constants
```typescript
import { Colors } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    padding: 16,
  },
});
```

## Configuration Categories

### Theme Constants
- Color palettes for light/dark modes
- Typography scales and font families
- Spacing and layout values
- Animation durations and easing

### App Constants
- API endpoints and keys
- Screen dimensions and breakpoints
- Default values and limits
- Feature flags and toggles

### Platform Constants
- iOS/Android specific values
- Web-specific configurations
- Device capability flags

## Best Practices

- Use semantic color names (primary, secondary, background)
- Maintain 4.5:1 contrast ratio for accessibility
- Keep constants organized by category
- Use TypeScript for type safety
- Document color usage and purpose
- Test theme switching functionality