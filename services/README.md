# Services Directory

This directory contains service layer implementations for the MovieTracker app, including API clients, data management, and external service integrations.

## Structure

### API Services
- **api/tmdb.ts** - TMDB (The Movie Database) API client
- **api/cloudflare.ts** - Cloudflare Worker API client (TMDB + IMDB data)
- **api/cloudflare-extended.ts** - Extended Cloudflare features (IMDB, seasons, regions)
- **api/streaming.ts** - Streaming service availability API
- **api/subtitles.ts** - Subtitle and caption services

### Core Services
- **analytics.ts** - Analytics and tracking service
- **downloads.ts** - Download manager for offline content
- **localization.ts** - Internationalization service
- **storage.ts** - AsyncStorage wrapper and data persistence

### Utility Services
- **cache.ts** - Caching strategies and management
- **network.ts** - Network status and connectivity
- **notifications.ts** - Push notifications and alerts
- **auth.ts** - Authentication and user management

## Service Architecture

### Base Service Pattern
```typescript
interface ServiceConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

abstract class BaseService {
  protected config: ServiceConfig;
  
  constructor(config: ServiceConfig) {
    this.config = config;
  }
  
  protected async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    // Common request logic
  }
}
```

### Error Handling
```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
```

## Core Services

### TMDB API Service
```typescript
import { TMDBService } from '@/services/api/tmdb';

const tmdb = new TMDBService({
  apiKey: process.env.TMDB_API_KEY,
  baseURL: 'https://api.themoviedb.org/3'
});

// Get trending movies
const trending = await tmdb.getTrendingMovies();

// Search for content
const results = await tmdb.search('Inception');
```

### Cloudflare Worker API Service
```typescript
// Use the unified adapter (auto-switches based on EXPO_PUBLIC_API_PROVIDER)
import { mediaApi } from '@/services/api';

// Get trending content
const trending = await mediaApi.getTrending('all', 'week', 1);

// Or use Cloudflare-specific features directly
import * as cfExtended from '@/services/api/cloudflare-extended';

// Get IMDB upcoming movies by region
const upcoming = await cfExtended.getIMDBUpcoming('IN');

// Get IMDB entertainment news
const news = await cfExtended.getIMDBNews(10);

// Get TV season details
const season = await cfExtended.getSeasonDetails(tvId, 1);

// Discover by region (bollywood, korean, anime, etc.)
const bollywood = await cfExtended.discoverMovies({ region: 'bollywood' });
```

### Storage Service
```typescript
import { StorageService } from '@/services/storage';

// Store data
await StorageService.setItem('watchlist', movies);

// Retrieve data
const watchlist = await StorageService.getItem('watchlist');

// Remove data
await StorageService.removeItem('watchlist');
```

### Download Service
```typescript
import { DownloadService } from '@/services/downloads';

// Start download
const downloadId = await DownloadService.startDownload(movieUrl, {
  quality: 'HD',
  subtitles: ['en', 'es']
});

// Monitor progress
DownloadService.onProgress(downloadId, (progress) => {
  console.log(`Download progress: ${progress.percentage}%`);
});
```

## Service Categories

### Data Services
- **API Clients** - External API integrations (TMDB, streaming services)
- **Storage** - Local data persistence and caching
- **Sync** - Data synchronization between devices
- **Cache** - Intelligent caching strategies

### Media Services
- **Downloads** - Offline content management
- **Streaming** - Video playback and streaming
- **Images** - Image loading and optimization
- **Subtitles** - Caption and subtitle handling

### User Services
- **Authentication** - User login and session management
- **Analytics** - Usage tracking and metrics
- **Notifications** - Push notifications and alerts
- **Preferences** - User settings and customization

### System Services
- **Network** - Connectivity monitoring
- **Localization** - Language and region handling
- **Performance** - App performance monitoring
- **Logging** - Error tracking and debugging

## Configuration

### Environment Variables
```typescript
// Service configuration
export const serviceConfig = {
  tmdb: {
    apiKey: process.env.TMDB_API_KEY!,
    baseURL: 'https://api.themoviedb.org/3',
    timeout: 10000
  },
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    apiKey: process.env.ANALYTICS_API_KEY
  }
};
```

### Service Registry
```typescript
// Centralized service management
export const services = {
  tmdb: new TMDBService(serviceConfig.tmdb),
  storage: new StorageService(),
  downloads: new DownloadService(),
  analytics: new AnalyticsService(serviceConfig.analytics)
};
```

## Best Practices

### Error Handling
- Implement consistent error handling across all services
- Use typed errors with meaningful messages
- Handle network failures gracefully
- Provide fallback mechanisms

### Performance
- Implement request caching where appropriate
- Use request deduplication for identical calls
- Implement retry logic with exponential backoff
- Monitor and optimize API usage

### Security
- Never expose API keys in client code
- Validate all input parameters
- Implement rate limiting
- Use secure storage for sensitive data

### Testing
- Mock external services in tests
- Test error scenarios and edge cases
- Use property-based testing for data validation
- Test offline functionality

### Documentation
- Document all public methods and interfaces
- Provide usage examples
- Document error conditions
- Keep API documentation up to date