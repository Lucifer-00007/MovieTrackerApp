# API Integration Guide

This guide explains how to configure the MovieTracker app to use different data sources, including mock data for development and custom API providers.

## Environment Configuration

The app uses environment variables to control data sources. Configure these in your `.env` file:

```bash
# API Key for your provider (TMDB by default)
EXPO_PUBLIC_TMDB_API_KEY=your_api_key_here

# Enable mock data mode (bypasses all API calls)
EXPO_PUBLIC_USE_MOCK_DATA=false

# API provider selection: 'tmdb' (default) or 'custom'
EXPO_PUBLIC_API_PROVIDER=tmdb
```

## Using Mock Data

When the TMDB API is unavailable or you're developing offline, enable mock data:

```bash
EXPO_PUBLIC_USE_MOCK_DATA=true
```

This will:
- Return static mock data for all API calls
- Simulate network delays (300ms) for realistic behavior
- Work completely offline
- Provide sample movies, TV shows, cast, and providers

Mock data is defined in `constants/mock-data.ts` and can be customized.

## API Response Format

All API adapters must return data matching these interfaces:

### MediaItem
```typescript
interface MediaItem {
  id: number;
  title: string;
  originalTitle: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  releaseDate: string;           // ISO date string (YYYY-MM-DD)
  voteAverage: number | null;    // 0-10 scale
  voteCount: number;
  mediaType: 'movie' | 'tv';
  genreIds: number[];
  ageRating?: string | null;
}
```

### TrendingItem
```typescript
interface TrendingItem extends MediaItem {
  rank: number;                  // Position in trending list (1-based)
}
```

### MediaDetails
```typescript
interface MediaDetails extends MediaItem {
  runtime: number | null;        // Minutes for movies, episode length for TV
  genres: Genre[];               // Array of { id: number, name: string }
  tagline: string;
  status: string;                // 'Released', 'Returning Series', etc.
  productionCountries: Country[];
  spokenLanguages: Language[];
  budget?: number;               // Movies only
  revenue?: number;              // Movies only
  numberOfSeasons?: number;      // TV only
  numberOfEpisodes?: number;     // TV only
}
```

### CastMember
```typescript
interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;                 // Display order (0 = lead)
}
```

### StreamingProvider
```typescript
interface StreamingProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
  link: string;                  // Deep link to provider
  type: 'flatrate' | 'rent' | 'buy';
  isAvailable: boolean;
}
```

### SearchResults
```typescript
interface SearchResults {
  movies: MediaItem[];
  tvShows: MediaItem[];
  totalResults: number;
  page: number;
  totalPages: number;
}
```

### PaginatedResponse
```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalPages: number;
  totalResults: number;
}
```

## Creating a Custom API Adapter

To integrate a different API provider, create a new adapter in `services/api/adapters/`:

### 1. Create the Adapter File

```typescript
// services/api/adapters/custom-adapter.ts
import type { MediaApiAdapter, PaginatedResponse } from '../types';
import type {
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
  MediaItem,
} from '@/types/media';
import type { SearchResults } from '@/types/user';

// Your API configuration
const API_BASE_URL = 'https://your-api.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_CUSTOM_API_KEY || '';

export const customAdapter: MediaApiAdapter = {
  async getTrending(
    mediaType: 'all' | 'movie' | 'tv',
    timeWindow: 'day' | 'week',
    page: number
  ): Promise<PaginatedResponse<TrendingItem>> {
    // Fetch from your API and transform to TrendingItem[]
    const response = await fetch(`${API_BASE_URL}/trending?type=${mediaType}&page=${page}`);
    const data = await response.json();
    
    return {
      items: data.results.map(transformToTrendingItem),
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  },

  async getMovieDetails(movieId: number): Promise<MediaDetails> {
    // Implement movie details fetch
  },

  async getTvDetails(tvId: number): Promise<MediaDetails> {
    // Implement TV details fetch
  },

  async searchMulti(query: string, page: number): Promise<SearchResults> {
    // Implement search
  },

  async getMovieCredits(movieId: number): Promise<CastMember[]> {
    // Implement cast fetch
  },

  async getTvCredits(tvId: number): Promise<CastMember[]> {
    // Implement cast fetch
  },

  async getWatchProviders(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    countryCode: string
  ): Promise<StreamingProvider[]> {
    // Implement providers fetch
  },

  async getRecommendations(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    page: number
  ): Promise<PaginatedResponse<MediaItem>> {
    // Implement recommendations fetch
  },

  async discoverByCountry(
    mediaType: 'movie' | 'tv',
    countryCode: string,
    options: { page?: number; genre?: number; year?: number; sortBy?: string }
  ): Promise<PaginatedResponse<TrendingItem>> {
    // Implement country discovery
  },

  async getTrailerKey(
    mediaType: 'movie' | 'tv',
    mediaId: number
  ): Promise<string | null> {
    // Return YouTube video key or null
  },

  getImageUrl(path: string | null, size?: string): string | null {
    if (!path) return null;
    return `${YOUR_IMAGE_CDN}/${size || 'w500'}${path}`;
  },
};
```

### 2. Register the Adapter

Update `services/api/adapters/index.ts`:

```typescript
export { tmdbAdapter } from './tmdb-adapter';
export { mockAdapter } from './mock-adapter';
export { customAdapter } from './custom-adapter';
```

### 3. Add Provider Selection

Update `services/api/index.ts`:

```typescript
import { customAdapter } from './adapters/custom-adapter';

function getAdapter(): MediaApiAdapter {
  if (useMockData()) {
    return mockAdapter;
  }

  const provider = getApiProvider();
  
  switch (provider) {
    case 'tmdb':
      return tmdbAdapter;
    case 'custom':
      return customAdapter;
    case 'mock':
      return mockAdapter;
    default:
      return tmdbAdapter;
  }
}
```

### 4. Configure Environment

```bash
EXPO_PUBLIC_API_PROVIDER=custom
EXPO_PUBLIC_CUSTOM_API_KEY=your_custom_api_key
```

## Field Mapping Reference

When mapping from your API to MovieTracker's format:

| MovieTracker Field | TMDB Equivalent | Notes |
|-------------------|-----------------|-------|
| `id` | `id` | Unique identifier |
| `title` | `title` (movie) / `name` (tv) | Display title |
| `originalTitle` | `original_title` / `original_name` | Original language title |
| `posterPath` | `poster_path` | Relative path to poster image |
| `backdropPath` | `backdrop_path` | Relative path to backdrop image |
| `overview` | `overview` | Synopsis/description |
| `releaseDate` | `release_date` / `first_air_date` | ISO date string |
| `voteAverage` | `vote_average` | 0-10 rating scale |
| `voteCount` | `vote_count` | Number of votes |
| `mediaType` | `media_type` | 'movie' or 'tv' |
| `genreIds` | `genre_ids` | Array of genre IDs |
| `runtime` | `runtime` / `episode_run_time[0]` | Duration in minutes |

## Image URL Construction

The `getImageUrl` function should construct full image URLs from relative paths:

```typescript
// TMDB example
getImageUrl(path: string | null, size?: string): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size || 'w500'}${path}`;
}

// Custom CDN example
getImageUrl(path: string | null, size?: string): string | null {
  if (!path) return null;
  const sizeMap = { w185: 'small', w500: 'medium', original: 'large' };
  return `https://cdn.yourapi.com/images/${sizeMap[size] || 'medium'}${path}`;
}
```

## Testing Your Adapter

1. Set `EXPO_PUBLIC_USE_MOCK_DATA=false`
2. Set `EXPO_PUBLIC_API_PROVIDER=custom`
3. Run the app and verify:
   - Home screen loads trending content
   - Search returns results
   - Movie/TV detail pages display correctly
   - Images load properly
   - Cast and providers appear on detail pages

## Troubleshooting

### API Not Responding
Set `EXPO_PUBLIC_USE_MOCK_DATA=true` to use offline mock data.

### Images Not Loading
Check your `getImageUrl` implementation returns valid URLs.

### Missing Data
Ensure all required fields are mapped. Use `null` for optional fields.

### Type Errors
Verify your response transformations match the TypeScript interfaces.
