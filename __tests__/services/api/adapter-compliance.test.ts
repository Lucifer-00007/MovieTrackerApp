/**
 * Adapter Interface Compliance Tests
 * Feature: omdb-api-integration
 * 
 * Task 10.2: Validate adapter interface compliance
 * - Ensure all MediaApiAdapter methods are implemented
 * - Verify return types match interface expectations
 * - Test with existing application components
 * 
 * **Validates: Requirements 1.2**
 */

import type { MediaApiAdapter, PaginatedResponse } from '@/services/api/types';
import type {
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
  MediaItem,
} from '@/types/media';
import type { SearchResults } from '@/types/user';

// Create a mock OMDbError class
class MockOMDbError extends Error {
  code: string;
  isRetryable: boolean;
  context?: Record<string, unknown>;
  
  constructor(message: string, code: string, isRetryable: boolean = false, context?: Record<string, unknown>) {
    super(message);
    this.name = 'OMDbError';
    this.code = code;
    this.isRetryable = isRetryable;
    this.context = context;
  }
}

// Mock the OMDb API client
jest.mock('@/services/api/omdb', () => {
  const mockIdCache = new Map<number, string>();
  
  const generateNumericId = (imdbId: string): number => {
    let hash = 0;
    for (let i = 0; i < imdbId.length; i++) {
      const char = imdbId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const numericId = Math.abs(hash);
    mockIdCache.set(numericId, imdbId);
    return numericId;
  };

  const mockItems = [
    {
      Title: 'Test Movie',
      Year: '2023',
      imdbID: 'tt1234567',
      Type: 'movie' as const,
      Poster: 'https://example.com/poster.jpg',
    },
  ];

  return {
    searchContent: jest.fn().mockImplementation(async (params: { query: string; page?: number }) => {
      if (!params.query || params.query.trim() === '') {
        return { items: [], totalResults: 0, page: params.page || 1, totalPages: 0 };
      }
      mockItems.forEach(item => generateNumericId(item.imdbID));
      return { items: mockItems, totalResults: 10, page: params.page || 1, totalPages: 1 };
    }),
    getDetailsByImdbId: jest.fn().mockImplementation(async () => ({
      Title: 'Test Movie',
      Year: '2023',
      Rated: 'PG-13',
      Released: '01 Jan 2023',
      Runtime: '120 min',
      Genre: 'Action, Drama',
      Director: 'Test Director',
      Writer: 'Test Writer',
      Actors: 'Actor One, Actor Two',
      Plot: 'A test plot',
      Language: 'English',
      Country: 'United States',
      Awards: 'N/A',
      Poster: 'https://example.com/poster.jpg',
      Ratings: [],
      Metascore: '75',
      imdbRating: '7.5',
      imdbVotes: '10,000',
      imdbID: 'tt1234567',
      Type: 'movie' as const,
      Response: 'True' as const,
    })),
    getImdbIdFromNumeric: jest.fn().mockImplementation((numericId: number) => mockIdCache.get(numericId)),
    generateNumericId,
    OMDbError: MockOMDbError,
    clearIdMappingCache: jest.fn().mockImplementation(() => mockIdCache.clear()),
  };
});

// Import adapters after mocking
import { omdbAdapter } from '@/services/api/adapters/omdb-adapter';
import { tmdbAdapter } from '@/services/api/adapters/tmdb-adapter';
import { mockAdapter } from '@/services/api/adapters/mock-adapter';

/**
 * Helper function to check if a value matches the expected type
 */
function isValidType(value: unknown, expectedType: string): boolean {
  if (expectedType === 'null') return value === null;
  if (expectedType === 'array') return Array.isArray(value);
  return typeof value === expectedType;
}

/**
 * Helper function to validate MediaItem structure
 */
function validateMediaItem(item: MediaItem): void {
  expect(typeof item.id).toBe('number');
  expect(typeof item.title).toBe('string');
  expect(['movie', 'tv']).toContain(item.mediaType);
  
  // Optional fields should be correct type or null/undefined
  if (item.posterPath !== null && item.posterPath !== undefined) {
    expect(typeof item.posterPath).toBe('string');
  }
  if (item.backdropPath !== null && item.backdropPath !== undefined) {
    expect(typeof item.backdropPath).toBe('string');
  }
  if (item.overview !== null && item.overview !== undefined) {
    expect(typeof item.overview).toBe('string');
  }
  if (item.releaseDate !== null && item.releaseDate !== undefined) {
    expect(typeof item.releaseDate).toBe('string');
  }
  if (item.voteAverage !== null && item.voteAverage !== undefined) {
    expect(typeof item.voteAverage).toBe('number');
  }
  if (item.voteCount !== null && item.voteCount !== undefined) {
    expect(typeof item.voteCount).toBe('number');
  }
}

/**
 * Helper function to validate TrendingItem structure
 */
function validateTrendingItem(item: TrendingItem): void {
  validateMediaItem(item);
  expect(typeof item.rank).toBe('number');
  expect(item.rank).toBeGreaterThan(0);
}

/**
 * Helper function to validate CastMember structure
 */
function validateCastMember(member: CastMember): void {
  expect(typeof member.id).toBe('number');
  expect(typeof member.name).toBe('string');
  expect(typeof member.order).toBe('number');
  
  if (member.character !== null && member.character !== undefined) {
    expect(typeof member.character).toBe('string');
  }
  if (member.profilePath !== null && member.profilePath !== undefined) {
    expect(typeof member.profilePath).toBe('string');
  }
}

/**
 * Helper function to validate StreamingProvider structure
 */
function validateStreamingProvider(provider: StreamingProvider): void {
  expect(typeof provider.providerId).toBe('number');
  expect(typeof provider.providerName).toBe('string');
  expect(typeof provider.logoPath).toBe('string');
  expect(typeof provider.link).toBe('string');
  expect(['flatrate', 'rent', 'buy']).toContain(provider.type);
  expect(typeof provider.isAvailable).toBe('boolean');
}

/**
 * Helper function to validate PaginatedResponse structure
 */
function validatePaginatedResponse<T>(response: PaginatedResponse<T>): void {
  expect(Array.isArray(response.items)).toBe(true);
  expect(typeof response.totalPages).toBe('number');
  expect(typeof response.totalResults).toBe('number');
  expect(response.totalPages).toBeGreaterThanOrEqual(0);
  expect(response.totalResults).toBeGreaterThanOrEqual(0);
}

/**
 * Helper function to validate SearchResults structure
 */
function validateSearchResults(results: SearchResults): void {
  expect(Array.isArray(results.movies)).toBe(true);
  expect(Array.isArray(results.tvShows)).toBe(true);
  expect(typeof results.totalResults).toBe('number');
  expect(typeof results.page).toBe('number');
  expect(typeof results.totalPages).toBe('number');
}

describe('Adapter Interface Compliance Tests', () => {
  // Test all available adapters
  const adaptersToTest: { name: string; adapter: MediaApiAdapter }[] = [
    { name: 'OMDb Adapter', adapter: omdbAdapter },
    { name: 'Mock Adapter', adapter: mockAdapter },
  ];

  describe('MediaApiAdapter Interface Implementation', () => {
    adaptersToTest.forEach(({ name, adapter }) => {
      describe(`${name}`, () => {
        /**
         * Verify all required methods exist
         */
        describe('Method Existence', () => {
          it('should have getTrending method', () => {
            expect(typeof adapter.getTrending).toBe('function');
          });

          it('should have getMovieDetails method', () => {
            expect(typeof adapter.getMovieDetails).toBe('function');
          });

          it('should have getTvDetails method', () => {
            expect(typeof adapter.getTvDetails).toBe('function');
          });

          it('should have searchMulti method', () => {
            expect(typeof adapter.searchMulti).toBe('function');
          });

          it('should have getMovieCredits method', () => {
            expect(typeof adapter.getMovieCredits).toBe('function');
          });

          it('should have getTvCredits method', () => {
            expect(typeof adapter.getTvCredits).toBe('function');
          });

          it('should have getWatchProviders method', () => {
            expect(typeof adapter.getWatchProviders).toBe('function');
          });

          it('should have getRecommendations method', () => {
            expect(typeof adapter.getRecommendations).toBe('function');
          });

          it('should have discoverByCountry method', () => {
            expect(typeof adapter.discoverByCountry).toBe('function');
          });

          it('should have getTrailerKey method', () => {
            expect(typeof adapter.getTrailerKey).toBe('function');
          });

          it('should have getImageUrl method', () => {
            expect(typeof adapter.getImageUrl).toBe('function');
          });
        });

        /**
         * Verify return types match interface expectations
         */
        describe('Return Type Validation', () => {
          it('getTrending should return PaginatedResponse<TrendingItem>', async () => {
            const result = await adapter.getTrending('all', 'day', 1);
            
            validatePaginatedResponse(result);
            
            if (result.items.length > 0) {
              result.items.forEach(validateTrendingItem);
            }
          });

          it('getTrending should accept all valid mediaType values', async () => {
            const mediaTypes: ('all' | 'movie' | 'tv')[] = ['all', 'movie', 'tv'];
            
            for (const mediaType of mediaTypes) {
              const result = await adapter.getTrending(mediaType, 'day', 1);
              validatePaginatedResponse(result);
            }
          });

          it('getTrending should accept all valid timeWindow values', async () => {
            const timeWindows: ('day' | 'week')[] = ['day', 'week'];
            
            for (const timeWindow of timeWindows) {
              const result = await adapter.getTrending('all', timeWindow, 1);
              validatePaginatedResponse(result);
            }
          });

          it('searchMulti should return SearchResults', async () => {
            const result = await adapter.searchMulti('test', 1);
            
            validateSearchResults(result);
            
            result.movies.forEach(validateMediaItem);
            result.tvShows.forEach(validateMediaItem);
          });

          it('getWatchProviders should return StreamingProvider[]', async () => {
            const result = await adapter.getWatchProviders('movie', 12345, 'US');
            
            expect(Array.isArray(result)).toBe(true);
            result.forEach(validateStreamingProvider);
          });

          it('getRecommendations should return PaginatedResponse<MediaItem>', async () => {
            const result = await adapter.getRecommendations('movie', 12345, 1);
            
            validatePaginatedResponse(result);
            
            if (result.items.length > 0) {
              result.items.forEach(validateMediaItem);
            }
          });

          it('discoverByCountry should return PaginatedResponse<TrendingItem>', async () => {
            const result = await adapter.discoverByCountry('movie', 'US', { page: 1 });
            
            validatePaginatedResponse(result);
            
            if (result.items.length > 0) {
              result.items.forEach(validateTrendingItem);
            }
          });

          it('getTrailerKey should return string | null', async () => {
            const result = await adapter.getTrailerKey('movie', 12345);
            
            expect(result === null || typeof result === 'string').toBe(true);
          });

          it('getImageUrl should return string | null', () => {
            // Test with valid URL
            const validResult = adapter.getImageUrl('https://example.com/image.jpg');
            expect(validResult === null || typeof validResult === 'string').toBe(true);
            
            // Test with null
            const nullResult = adapter.getImageUrl(null);
            expect(nullResult).toBeNull();
          });
        });

        /**
         * Verify method signatures match interface
         */
        describe('Method Signature Validation', () => {
          it('getTrending should accept correct parameters', async () => {
            // Should not throw with valid parameters
            await expect(adapter.getTrending('all', 'day', 1)).resolves.toBeDefined();
            await expect(adapter.getTrending('movie', 'week', 2)).resolves.toBeDefined();
            await expect(adapter.getTrending('tv', 'day', 100)).resolves.toBeDefined();
          });

          it('searchMulti should accept correct parameters', async () => {
            await expect(adapter.searchMulti('test query', 1)).resolves.toBeDefined();
            await expect(adapter.searchMulti('', 1)).resolves.toBeDefined();
            await expect(adapter.searchMulti('test', 100)).resolves.toBeDefined();
          });

          it('getWatchProviders should accept correct parameters', async () => {
            await expect(adapter.getWatchProviders('movie', 12345, 'US')).resolves.toBeDefined();
            await expect(adapter.getWatchProviders('tv', 67890, 'GB')).resolves.toBeDefined();
          });

          it('getRecommendations should accept correct parameters', async () => {
            await expect(adapter.getRecommendations('movie', 12345, 1)).resolves.toBeDefined();
            await expect(adapter.getRecommendations('tv', 67890, 2)).resolves.toBeDefined();
          });

          it('discoverByCountry should accept correct parameters', async () => {
            await expect(adapter.discoverByCountry('movie', 'US', {})).resolves.toBeDefined();
            await expect(adapter.discoverByCountry('tv', 'GB', { page: 1 })).resolves.toBeDefined();
            await expect(adapter.discoverByCountry('movie', 'JP', { 
              page: 1, 
              year: 2023 
            })).resolves.toBeDefined();
          });

          it('getTrailerKey should accept correct parameters', async () => {
            await expect(adapter.getTrailerKey('movie', 12345)).resolves.toBeDefined();
            await expect(adapter.getTrailerKey('tv', 67890)).resolves.toBeDefined();
          });

          it('getImageUrl should accept correct parameters', () => {
            expect(() => adapter.getImageUrl('https://example.com/image.jpg')).not.toThrow();
            expect(() => adapter.getImageUrl(null)).not.toThrow();
            expect(() => adapter.getImageUrl('https://example.com/image.jpg', 'w500')).not.toThrow();
          });
        });
      });
    });
  });

  describe('OMDb Adapter Specific Compliance', () => {
    /**
     * Test OMDb-specific behavior while maintaining interface compliance
     */
    describe('Fallback Behavior', () => {
      let consoleWarnSpy: jest.SpyInstance;

      beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
      });

      it('should implement getTrending with fallback strategy', async () => {
        const result = await omdbAdapter.getTrending('movie', 'day', 1);
        
        // Should still return valid PaginatedResponse
        validatePaginatedResponse(result);
        
        // Should log fallback usage
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Fallback')
        );
      });

      it('should implement discoverByCountry with fallback strategy', async () => {
        const result = await omdbAdapter.discoverByCountry('movie', 'US', { page: 1 });
        
        // Should still return valid PaginatedResponse
        validatePaginatedResponse(result);
        
        // Should log fallback usage
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Fallback')
        );
      });

      it('should implement getWatchProviders with reasonable defaults', async () => {
        const result = await omdbAdapter.getWatchProviders('movie', 12345, 'US');
        
        // Should return valid StreamingProvider array
        expect(Array.isArray(result)).toBe(true);
        result.forEach(validateStreamingProvider);
        
        // Should log fallback usage
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Fallback')
        );
      });

      it('should implement getTrailerKey returning null (unsupported)', async () => {
        const result = await omdbAdapter.getTrailerKey('movie', 12345);
        
        // Should return null (OMDb doesn't support trailers)
        expect(result).toBeNull();
        
        // Should log fallback usage
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Fallback')
        );
      });
    });

    describe('Image URL Handling', () => {
      it('should handle OMDb direct URLs correctly', () => {
        const omdbUrl = 'https://m.media-amazon.com/images/M/poster.jpg';
        const result = omdbAdapter.getImageUrl(omdbUrl);
        
        expect(result).toBe(omdbUrl);
      });

      it('should handle N/A poster values', () => {
        const result = omdbAdapter.getImageUrl('N/A');
        
        expect(result).toBeNull();
      });

      it('should ignore size parameter (OMDb returns direct URLs)', () => {
        const url = 'https://example.com/poster.jpg';
        
        const resultWithSize = omdbAdapter.getImageUrl(url, 'w500');
        const resultWithoutSize = omdbAdapter.getImageUrl(url);
        
        expect(resultWithSize).toBe(resultWithoutSize);
      });
    });
  });

  describe('Cross-Adapter Consistency', () => {
    /**
     * Verify that different adapters return consistent data structures
     */
    it('should return same structure from getTrending across adapters', async () => {
      const omdbResult = await omdbAdapter.getTrending('movie', 'day', 1);
      const mockResult = await mockAdapter.getTrending('movie', 'day', 1);
      
      // Both should have same keys
      expect(Object.keys(omdbResult).sort()).toEqual(Object.keys(mockResult).sort());
    });

    it('should return same structure from searchMulti across adapters', async () => {
      const omdbResult = await omdbAdapter.searchMulti('test', 1);
      const mockResult = await mockAdapter.searchMulti('test', 1);
      
      // Both should have same keys
      expect(Object.keys(omdbResult).sort()).toEqual(Object.keys(mockResult).sort());
    });

    it('should return same structure from getRecommendations across adapters', async () => {
      const omdbResult = await omdbAdapter.getRecommendations('movie', 12345, 1);
      const mockResult = await mockAdapter.getRecommendations('movie', 12345, 1);
      
      // Both should have same keys
      expect(Object.keys(omdbResult).sort()).toEqual(Object.keys(mockResult).sort());
    });

    it('should return same structure from discoverByCountry across adapters', async () => {
      const omdbResult = await omdbAdapter.discoverByCountry('movie', 'US', { page: 1 });
      const mockResult = await mockAdapter.discoverByCountry('movie', 'US', { page: 1 });
      
      // Both should have same keys
      expect(Object.keys(omdbResult).sort()).toEqual(Object.keys(mockResult).sort());
    });
  });

  describe('Error Handling Compliance', () => {
    /**
     * Verify adapters handle errors gracefully
     */
    it('should handle empty search queries gracefully', async () => {
      const result = await omdbAdapter.searchMulti('', 1);
      
      validateSearchResults(result);
      expect(result.movies).toEqual([]);
      expect(result.tvShows).toEqual([]);
    });

    it('should handle invalid IDs gracefully in getMovieCredits', async () => {
      const result = await omdbAdapter.getMovieCredits(999999999);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle invalid IDs gracefully in getTvCredits', async () => {
      const result = await omdbAdapter.getTvCredits(999999999);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle unknown country codes gracefully', async () => {
      const result = await omdbAdapter.discoverByCountry('movie', 'XX', { page: 1 });
      
      validatePaginatedResponse(result);
    });
  });
});
