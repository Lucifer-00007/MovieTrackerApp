# Design Document: OMDb API Integration

## Overview

This design implements OMDb (Open Movie Database) API integration as an alternative data provider for the MovieTracker application. The integration follows the existing adapter pattern, allowing seamless switching between TMDB and OMDb APIs via environment configuration. The design addresses the differences between OMDb and TMDB API structures while maintaining compatibility with the existing application interface.

## Architecture

The OMDb integration follows the established adapter pattern:

```
Environment Config (EXPO_PUBLIC_API_PROVIDER=omdb)
    ↓
API Service Layer (services/api/index.ts)
    ↓
OMDb Adapter (services/api/adapters/omdb-adapter.ts)
    ↓
OMDb API Client (services/api/omdb.ts)
    ↓
Data Mappers (transform OMDb → MediaItem types)
```

### Key Architectural Decisions

1. **Adapter Pattern Compliance**: The OMDb adapter implements the existing `MediaApiAdapter` interface without modifications
2. **Data Transformation Layer**: OMDb responses are mapped to match the application's existing type system
3. **Fallback Strategies**: For features not supported by OMDb (like trending), implement reasonable fallbacks
4. **Error Handling**: Consistent error handling that matches the existing TMDB adapter patterns

## Components and Interfaces

### OMDb API Client (`services/api/omdb.ts`)

Core HTTP client for OMDb API interactions:

```typescript
interface OMDbConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

interface OMDbSearchResponse {
  Search?: OMDbSearchItem[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

interface OMDbDetailResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: OMDbRating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response: 'True' | 'False';
  Error?: string;
}
```

### OMDb Adapter (`services/api/adapters/omdb-adapter.ts`)

Implements `MediaApiAdapter` interface:

```typescript
export const omdbAdapter: MediaApiAdapter = {
  getTrending: async (mediaType, timeWindow, page) => {
    // Fallback strategy: search popular titles by year
    return await searchPopularByYear(mediaType, page);
  },
  
  getMovieDetails: async (movieId) => {
    // Use IMDb ID lookup or title search
    return await getDetailsByImdbId(movieId);
  },
  
  searchMulti: async (query, page) => {
    // Use OMDb search endpoint
    return await searchContent(query, page);
  },
  
  // ... other interface methods
};
```

### Data Mappers

Transform OMDb responses to application types:

```typescript
function mapOMDbToMediaItem(omdbItem: OMDbSearchItem): MediaItem {
  return {
    id: generateNumericId(omdbItem.imdbID),
    title: omdbItem.Title,
    originalTitle: omdbItem.Title,
    posterPath: omdbItem.Poster !== 'N/A' ? omdbItem.Poster : null,
    backdropPath: null, // OMDb doesn't provide backdrop images
    overview: '', // Not available in search results
    releaseDate: omdbItem.Year,
    voteAverage: null, // Not available in search results
    voteCount: 0,
    mediaType: omdbItem.Type === 'series' ? 'tv' : 'movie',
    genreIds: [], // Will be populated from detail calls
    ageRating: null,
  };
}

function mapOMDbToMediaDetails(omdbDetail: OMDbDetailResponse): MediaDetails {
  return {
    ...mapOMDbToMediaItem(omdbDetail),
    runtime: parseRuntime(omdbDetail.Runtime),
    genres: parseGenres(omdbDetail.Genre),
    tagline: '', // OMDb doesn't provide taglines
    status: 'Released', // Assume released for OMDb content
    productionCountries: parseCountries(omdbDetail.Country),
    spokenLanguages: parseLanguages(omdbDetail.Language),
    overview: omdbDetail.Plot,
    voteAverage: parseFloat(omdbDetail.imdbRating) || null,
    voteCount: parseVoteCount(omdbDetail.imdbVotes),
  };
}
```

## Data Models

### OMDb-Specific Types

```typescript
interface OMDbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}

interface OMDbRating {
  Source: string;
  Value: string;
}

interface OMDbError {
  Response: 'False';
  Error: string;
}
```

### ID Mapping Strategy

Since OMDb uses IMDb IDs (strings like "tt0133093") and the application expects numeric IDs:

```typescript
// Create a hash-based numeric ID from IMDb ID
function generateNumericId(imdbId: string): number {
  // Simple hash function to convert IMDb ID to number
  let hash = 0;
  for (let i = 0; i < imdbId.length; i++) {
    const char = imdbId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Store mapping for reverse lookup
const idMappingCache = new Map<number, string>();
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

<function_calls>
<invoke name="prework">
<parameter name="featureName">omdb-api-integration

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

- Properties 1.1 and 8.2 both test adapter selection based on environment variables - these can be combined
- Properties 1.3 and 8.1 both test API key handling - these can be combined  
- Properties 2.1, 2.2, 2.3 all test search parameter handling - these can be combined into one comprehensive search property
- Properties 3.1, 3.2, 3.3 all test detail fetching - these can be combined into one detail fetching property
- Properties 5.1, 5.2, 5.5 all test cast data parsing - these can be combined into one cast parsing property
- Properties 6.1, 6.2 both test image URL handling - these can be combined
- Properties 7.1, 7.5 both test error handling and logging - these can be combined

### Correctness Properties

Property 1: Environment-based adapter selection
*For any* environment configuration where EXPO_PUBLIC_API_PROVIDER is set to "omdb", the system should load and use the OMDb adapter for all API operations, and should read the API key from EXPO_PUBLIC_OMDB_API_KEY
**Validates: Requirements 1.1, 1.3, 8.1, 8.2**

Property 2: Interface compliance and HTTPS usage
*For any* API method call on the OMDb adapter, the adapter should implement all MediaApiAdapter interface methods and use HTTPS endpoints for all requests
**Validates: Requirements 1.2, 1.4**

Property 3: Data transformation consistency
*For any* valid OMDb API response, the data mapper should transform the response data to match the application's MediaItem and MediaDetails types with all required fields populated
**Validates: Requirements 1.5, 3.4**

Property 4: Search functionality with parameters
*For any* search query, page number, and type filter, the search service should query the OMDb search endpoint with correct parameters and return results in SearchResults format
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 5: Detail fetching with plot options
*For any* media ID and media type, the detail service should fetch data using appropriate OMDb lookup methods (IMDb ID or title) with correct type filters and plot length parameters
**Validates: Requirements 3.1, 3.2, 3.3**

Property 6: Error handling and graceful degradation
*For any* OMDb API error response, the adapter should parse error messages, handle them gracefully, and log errors while maintaining user experience
**Validates: Requirements 3.5, 7.1, 7.5**

Property 7: Fallback strategies for unsupported features
*For any* request for trending content or country-based discovery, the OMDb adapter should implement appropriate fallback strategies and provide reasonable defaults while logging when fallbacks are used
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

Property 8: Cast data parsing and extraction
*For any* OMDb detail response containing cast information, the data mapper should parse comma-separated cast strings into structured CastMember arrays and handle limited cast information gracefully
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 9: Image URL handling
*For any* OMDb response containing poster URLs, the image service should return valid poster URLs via getImageUrl method without additional processing, and should validate URLs before returning them
**Validates: Requirements 6.1, 6.2, 6.5**

Property 10: Retry logic with exponential backoff
*For any* network error during OMDb API calls, the adapter should implement retry logic with exponential backoff to handle transient failures
**Validates: Requirements 7.2**

Property 11: Configuration validation
*For any* OMDb configuration setup, the system should validate that required environment variables are present and provide clear error messages when configuration is incomplete
**Validates: Requirements 8.3, 8.5**

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing or invalid API key
   - Incorrect environment setup
   - Network connectivity issues

2. **API Response Errors**
   - OMDb API error responses (`Response: "False"`)
   - Rate limiting (HTTP 429)
   - Invalid request parameters

3. **Data Transformation Errors**
   - Malformed OMDb responses
   - Missing required fields
   - Type conversion failures

### Error Handling Strategy

```typescript
class OMDbError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'OMDbError';
  }
}

async function handleOMDbResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 429) {
      throw new OMDbError('Rate limit exceeded', 'RATE_LIMIT');
    }
    throw new OMDbError(`HTTP ${response.status}`, 'HTTP_ERROR');
  }
  
  const data = await response.json();
  
  if (data.Response === 'False') {
    throw new OMDbError(data.Error || 'Unknown OMDb error', 'OMDB_ERROR');
  }
  
  return data;
}
```

### Retry Configuration

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: ['NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT'],
};
```

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific scenarios with property-based tests for comprehensive coverage:

**Unit Tests:**
- Test specific OMDb API response formats
- Test error handling for known error cases
- Test data transformation for sample OMDb responses
- Test configuration validation scenarios
- Test fallback strategies for unsupported features

**Property-Based Tests:**
- Test data transformation across all valid OMDb response formats
- Test search functionality with random queries and parameters
- Test error handling across all possible error response types
- Test retry logic with various network failure scenarios
- Test configuration validation with random environment setups

### Property-Based Testing Configuration

- **Testing Library**: fast-check for TypeScript property-based testing
- **Test Iterations**: Minimum 100 iterations per property test
- **Test Tagging**: Each property test references its design document property
- **Tag Format**: `Feature: omdb-api-integration, Property {number}: {property_text}`

### Test Data Generation

```typescript
// Generators for property-based testing
const omdbSearchResponseGen = fc.record({
  Search: fc.array(fc.record({
    Title: fc.string(),
    Year: fc.string(),
    imdbID: fc.string(),
    Type: fc.constantFrom('movie', 'series'),
    Poster: fc.string(),
  })),
  totalResults: fc.string(),
  Response: fc.constant('True'),
});

const omdbDetailResponseGen = fc.record({
  Title: fc.string(),
  Year: fc.string(),
  Runtime: fc.string(),
  Genre: fc.string(),
  Actors: fc.string(),
  Plot: fc.string(),
  Poster: fc.string(),
  imdbRating: fc.string(),
  imdbID: fc.string(),
  Type: fc.constantFrom('movie', 'series'),
  Response: fc.constant('True'),
});
```

### Integration Testing

- Test complete workflows: search → details → cast
- Test adapter switching between TMDB and OMDb
- Test error recovery and fallback scenarios
- Test performance under various load conditions

The testing strategy ensures that the OMDb integration maintains the same reliability and user experience as the existing TMDB integration while properly handling the differences in API structure and capabilities.