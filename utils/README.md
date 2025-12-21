# Utils Directory

This directory contains utility functions, helpers, and common functionality used throughout the MovieTracker app.

## Structure

### Core Utilities
- **format.ts** - Date, number, and text formatting functions
- **validation.ts** - Input validation and sanitization
- **storage.ts** - AsyncStorage helpers and utilities
- **network.ts** - Network status and connectivity utilities

### Media Utilities
- **image.ts** - Image URL generation and optimization
- **video.ts** - Video player helpers and utilities
- **metadata.ts** - Media metadata processing
- **search.ts** - Search and filtering utilities

### UI Utilities
- **theme.ts** - Theme calculation and color utilities
- **layout.ts** - Layout and dimension calculations
- **animation.ts** - Animation helpers and easing functions
- **accessibility.ts** - Accessibility utilities and helpers

### Data Utilities
- **api.ts** - API request helpers and utilities
- **cache.ts** - Caching strategies and helpers
- **transform.ts** - Data transformation utilities
- **constants.ts** - Shared constants and enums

## Utility Categories

### Formatting Utilities
```typescript
// Date formatting
export function formatDate(date: string | Date, locale = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Duration formatting
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Rating formatting
export function formatRating(rating: number, maxRating = 10): string {
  return `${rating.toFixed(1)}/${maxRating}`;
}
```

### Validation Utilities
```typescript
// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// URL validation
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
```

### Image Utilities
```typescript
// TMDB image URL generation
export function getTMDBImageURL(
  path: string | null, 
  size: ImageSize = ImageSize.MEDIUM
): string {
  if (!path) return getPlaceholderImage();
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Placeholder image generation
export function getPlaceholderImage(width = 300, height = 450): string {
  return `https://via.placeholder.com/${width}x${height}/333/fff?text=No+Image`;
}

// Image aspect ratio calculation
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}
```

### Storage Utilities
```typescript
// Typed storage operations
export async function getStoredData<T>(key: string): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return null;
  }
}

export async function setStoredData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
  }
}
```

### Network Utilities
```typescript
// Network status checking
export async function checkNetworkStatus(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    return true;
  } catch {
    return false;
  }
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(baseDelay * Math.pow(2, i));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Search Utilities
```typescript
// Fuzzy search implementation
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string
): T[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  return items.filter(item => {
    const searchText = getSearchText(item).toLowerCase();
    return searchText.includes(normalizedQuery);
  });
}

// Search result highlighting
export function highlightSearchTerm(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
```

### Theme Utilities
```typescript
// Color manipulation
export function hexToRgba(hex: string, alpha = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Contrast ratio calculation
export function getContrastRatio(color1: string, color2: string): number {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

### Layout Utilities
```typescript
// Screen dimension utilities
export function getScreenDimensions() {
  return {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    scale: PixelRatio.get(),
  };
}

// Responsive sizing
export function responsiveSize(size: number, baseWidth = 375): number {
  const { width } = getScreenDimensions();
  return (size * width) / baseWidth;
}

// Safe area calculations
export function getSafeAreaInsets() {
  return {
    top: StatusBar.currentHeight || 0,
    bottom: 0, // Use react-native-safe-area-context for accurate values
  };
}
```

## Helper Functions

### Async Utilities
```typescript
// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Delay utility
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Array Utilities
```typescript
// Chunk array into smaller arrays
export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

// Remove duplicates by key
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// Sort by multiple criteria
export function sortBy<T>(
  array: T[],
  ...criteria: Array<(item: T) => any>
): T[] {
  return [...array].sort((a, b) => {
    for (const criterion of criteria) {
      const aVal = criterion(a);
      const bVal = criterion(b);
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}
```

## Best Practices

### Function Design
- Keep functions pure when possible (no side effects)
- Use descriptive function names
- Implement proper error handling
- Add TypeScript types for all parameters and return values

### Performance
- Use memoization for expensive calculations
- Implement proper caching strategies
- Avoid creating functions in render loops
- Use lazy evaluation when appropriate

### Testing
- Write unit tests for all utility functions
- Use property-based testing for mathematical functions
- Test edge cases and error conditions
- Mock external dependencies

### Documentation
- Add JSDoc comments for complex functions
- Provide usage examples
- Document performance characteristics
- Keep utility functions focused and single-purpose