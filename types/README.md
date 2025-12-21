# Types Directory

This directory contains TypeScript type definitions, interfaces, and type utilities for the MovieTracker app.

## Structure

### Core Types
- **movie.ts** - Movie-related types and interfaces
- **tv.ts** - TV series and episode types
- **user.ts** - User profile and authentication types
- **api.ts** - API request/response types

### Domain Types
- **media.ts** - Common media types (shared between movies/TV)
- **search.ts** - Search query and filter types
- **watchlist.ts** - Watchlist and favorites types
- **downloads.ts** - Download and offline content types

### Utility Types
- **common.ts** - Shared utility types and generics
- **navigation.ts** - Expo Router navigation types
- **theme.ts** - Theme and styling types

## Type Categories

### Media Types
```typescript
// Movie interface
export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

// TV Series interface
export interface TVSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
}
```

### API Types
```typescript
// TMDB API response wrapper
export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// API error response
export interface APIError {
  status_code: number;
  status_message: string;
  success: boolean;
}

// Search parameters
export interface SearchParams {
  query: string;
  page?: number;
  language?: string;
  region?: string;
  year?: number;
  primary_release_year?: number;
}
```

### User Types
```typescript
// User profile
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  region: string;
  adult_content: boolean;
  notifications: NotificationSettings;
}
```

### Navigation Types
```typescript
// Expo Router navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  'modal': undefined;
  'movie/[id]': { id: string };
  'tv/[id]': { id: string };
  'country/[code]': { code: string };
  'trailer/[key]': { key: string };
};

// Tab navigation types
export type TabParamList = {
  'index': undefined;
  'explore': undefined;
};
```

## Type Conventions

### Naming
- Use **PascalCase** for interfaces and types
- Use **camelCase** for properties
- Prefix generic types with `T`: `TResponse<T>`
- Use descriptive names: `MovieDetails` not `Movie2`

### Interface vs Type
```typescript
// Use interfaces for object shapes
interface Movie {
  id: number;
  title: string;
}

// Use types for unions, primitives, and computed types
type MediaType = 'movie' | 'tv';
type MovieWithGenres = Movie & { genres: Genre[] };
```

### Generic Types
```typescript
// API response wrapper
export interface APIResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  total_pages: number;
  total_items: number;
}
```

## Utility Types

### Common Utilities
```typescript
// Make all properties optional
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Pick specific properties
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit specific properties
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

### Domain-Specific Utilities
```typescript
// Create types for different states
export type LoadingState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

// Form field types
export type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
};
```

## Type Guards

### Runtime Type Checking
```typescript
// Type guard for movies
export function isMovie(media: Movie | TVSeries): media is Movie {
  return 'title' in media && 'release_date' in media;
}

// Type guard for TV series
export function isTVSeries(media: Movie | TVSeries): media is TVSeries {
  return 'name' in media && 'first_air_date' in media;
}

// API response validation
export function isAPIError(response: any): response is APIError {
  return response && typeof response.status_code === 'number' && !response.success;
}
```

## Enums and Constants

### Media Enums
```typescript
export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv',
  PERSON = 'person'
}

export enum ImageSize {
  SMALL = 'w185',
  MEDIUM = 'w342',
  LARGE = 'w500',
  ORIGINAL = 'original'
}
```

### Status Enums
```typescript
export enum DownloadStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}
```

## Best Practices

### Type Safety
- Use strict TypeScript configuration
- Avoid `any` type - use `unknown` instead
- Use type assertions sparingly and with type guards
- Implement proper error types

### Organization
- Group related types in the same file
- Export types from index files for easy imports
- Use consistent naming conventions
- Document complex types with JSDoc

### Performance
- Use type-only imports when possible: `import type { Movie } from './movie'`
- Avoid circular dependencies between type files
- Use mapped types for transformations
- Consider using branded types for IDs

### Maintenance
- Keep types in sync with API responses
- Use code generation for API types when possible
- Regular type audits and cleanup
- Version control breaking type changes