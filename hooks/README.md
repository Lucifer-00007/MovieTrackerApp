# Hooks Directory

This directory contains custom React hooks for the MovieTracker app, providing reusable logic and state management.

## Structure

### Theme Hooks
- **use-color-scheme.ts** - Native color scheme detection
- **use-color-scheme.web.ts** - Web-specific color scheme implementation
- **use-theme-color.ts** - Theme color accessor hook

### Planned Hooks
- API data fetching hooks
- Local storage hooks
- Navigation hooks
- Media player hooks
- Search and filter hooks

## Hook Conventions

### Naming
- All hooks prefixed with `use-` (kebab-case files)
- Hook functions use camelCase: `useColorScheme`
- Platform-specific hooks use suffix: `.web.ts`, `.ios.ts`

### Structure
```typescript
// Hook interface (if needed)
interface UseHookOptions {
  // Options definition
}

// Hook implementation
export function useHookName(options?: UseHookOptions) {
  // Hook logic with useState, useEffect, etc.
  
  return {
    // Return values
  };
}
```

## Current Hooks

### `useColorScheme`
Detects system color scheme preference:
```typescript
import { useColorScheme } from '@/hooks/use-color-scheme';

function MyComponent() {
  const colorScheme = useColorScheme(); // 'light' | 'dark'
  // Use colorScheme for conditional styling
}
```

### `useThemeColor`
Provides theme-aware color access:
```typescript
import { useThemeColor } from '@/hooks/use-theme-color';

function MyComponent() {
  const backgroundColor = useThemeColor(
    { light: '#fff', dark: '#000' },
    'background'
  );
}
```

## Hook Categories

### Theme & Styling
- Color scheme detection
- Theme color access
- Dynamic styling
- Responsive design

### Data Management
- API data fetching
- Caching strategies
- Offline synchronization
- State persistence

### Navigation
- Route parameters
- Navigation state
- Deep linking
- Back button handling

### Media & Content
- Video player controls
- Image loading states
- Download progress
- Playback tracking

### User Interaction
- Search functionality
- Filter management
- Gesture handling
- Form validation

## Best Practices

- Keep hooks focused and single-purpose
- Use TypeScript for all hook parameters and return types
- Handle loading and error states appropriately
- Implement proper cleanup in useEffect
- Test hooks with React Testing Library
- Document complex hooks with JSDoc
- Consider performance implications (useMemo, useCallback)
- Follow React hooks rules and ESLint recommendations