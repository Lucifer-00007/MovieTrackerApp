/**
 * Integration tests for OMDb API Integration
 * Feature: omdb-api-integration
 * 
 * Tests complete workflows and adapter switching
 * 
 * Task 10.1: Write integration tests for complete workflows
 * - Test search → details → cast workflow with OMDb
 * - Test adapter switching between TMDB and OMDb
 * - Test error recovery scenarios
 */

import type { MediaApiAdapter } from '@/services/api/types';
import type { CastMember } from '@/types/media';

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

// ID mapping cache for tests
const testIdMappingCache = new Map<number, string>();

// Generate numeric ID from IMDb ID (same algorithm as production)
function generateNumericIdImpl(imdbId: string): number {
  let hash = 0;
  for (let i = 0; i < imdbId.length; i++) {
    const char = imdbId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const numericId = Math.abs(hash);
  testIdMappingCache.set(numericId, imdbId);
  return numericId;
}

// Mock the OMDb API client to avoid actual API calls
jest.mock('@/services/api/omdb', () => {
  const mockItems = [
    {
      Title: 'The Matrix',
      Year: '1999',
      imdbID: 'tt0133093',
      Type: 'movie' as const,
      Poster: 'https://m.media-amazon.com/images/M/matrix.jpg',
    },
    {
      Title: 'The Matrix Reloaded',
      Year: '2003',
      imdbID: 'tt0234215',
      Type: 'movie' as const,
      Poster: 'https://m.media-amazon.com/images/M/matrix2.jpg',
    },
    {
      Title: 'Breaking Bad',
      Year: '2008–2013',
      imdbID: 'tt0903747',
      Type: 'series' as const,
      Poster: 'https://m.media-amazon.com/images/M/breakingbad.jpg',
    },
  ];

  const detailsMap: Record<string, any> = {
    'tt0133093': {
      Title: 'The Matrix',
      Year: '1999',
      Rated: 'R',
      Released: '31 Mar 1999',
      Runtime: '136 min',
      Genre: 'Action, Sci-Fi',
      Director: 'Lana Wachowski, Lilly Wachowski',
      Writer: 'Lilly Wachowski, Lana Wachowski',
      Actors: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss, Hugo Weaving',
      Plot: 'A computer hacker learns about the true nature of reality.',
      Language: 'English',
      Country: 'United States, Australia',
      Awards: 'Won 4 Oscars',
      Poster: 'https://m.media-amazon.com/images/M/matrix.jpg',
      Ratings: [{ Source: 'Internet Movie Database', Value: '8.7/10' }],
      Metascore: '73',
      imdbRating: '8.7',
      imdbVotes: '1,900,000',
      imdbID: 'tt0133093',
      Type: 'movie' as const,
      Response: 'True' as const,
    },
    'tt0903747': {
      Title: 'Breaking Bad',
      Year: '2008–2013',
      Rated: 'TV-MA',
      Released: '20 Jan 2008',
      Runtime: '49 min',
      Genre: 'Crime, Drama, Thriller',
      Director: 'N/A',
      Writer: 'Vince Gilligan',
      Actors: 'Bryan Cranston, Aaron Paul, Anna Gunn, Betsy Brandt',
      Plot: 'A high school chemistry teacher turned methamphetamine manufacturer.',
      Language: 'English, Spanish',
      Country: 'United States',
      Awards: 'Won 16 Primetime Emmys',
      Poster: 'https://m.media-amazon.com/images/M/breakingbad.jpg',
      Ratings: [{ Source: 'Internet Movie Database', Value: '9.5/10' }],
      Metascore: 'N/A',
      imdbRating: '9.5',
      imdbVotes: '2,000,000',
      imdbID: 'tt0903747',
      Type: 'series' as const,
      totalSeasons: '5',
      Response: 'True' as const,
    },
  };

  // Local ID mapping cache for the mock
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

  return {
    searchContent: jest.fn().mockImplementation(async (params: { query: string; page?: number }) => {
      if (!params.query || params.query.trim() === '') {
        return {
          items: [],
          totalResults: 0,
          page: params.page || 1,
          totalPages: 0,
        };
      }
      
      // Store ID mappings
      mockItems.forEach(item => {
        generateNumericId(item.imdbID);
      });
      
      return {
        items: mockItems,
        totalResults: 30,
        page: params.page || 1,
        totalPages: 3,
      };
    }),
    getDetailsByImdbId: jest.fn().mockImplementation(async (params: { imdbId: string }) => {
      const details = detailsMap[params.imdbId];
      if (!details) {
        throw new MockOMDbError('Movie not found!', 'NOT_FOUND', false);
      }
      return details;
    }),
    getImdbIdFromNumeric: jest.fn().mockImplementation((numericId: number) => {
      return mockIdCache.get(numericId);
    }),
    generateNumericId,
    OMDbError: MockOMDbError,
    clearIdMappingCache: jest.fn().mockImplementation(() => {
      mockIdCache.clear();
    }),
  };
});

// Import adapters after mocking
import { omdbAdapter } from '@/services/api/adapters/omdb-adapter';
import { mockAdapter } from '@/services/api/adapters/mock-adapter';
import { clearIdMappingCache } from '@/services/api/omdb';

describe('Integration Tests: OMDb API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearIdMappingCache();
    testIdMappingCache.clear();
  });

  describe('Search → Details → Cast Workflow', () => {
    /**
     * Test the complete workflow of searching for content,
     * getting details, and retrieving cast information
     */
    it('should complete search → details → cast workflow for movies', async () => {
      // Step 1: Search for content
      const searchResults = await omdbAdapter.searchMulti('Matrix', 1);
      
      // Verify search results structure
      expect(searchResults).toBeDefined();
      expect(searchResults.totalResults).toBeGreaterThan(0);
      
      // Get the first movie from results
      const movies = searchResults.movies || [];
      expect(movies.length).toBeGreaterThan(0);
      
      const firstMovie = movies[0];
      expect(firstMovie.id).toBeDefined();
      expect(firstMovie.title).toBeDefined();
      expect(firstMovie.mediaType).toBe('movie');
      
      // Step 2: Get movie details using the ID from search
      const movieDetails = await omdbAdapter.getMovieDetails(firstMovie.id);
      
      // Verify details structure
      expect(movieDetails).toBeDefined();
      expect(movieDetails.id).toBe(firstMovie.id);
      expect(movieDetails.title).toBeDefined();
      expect(movieDetails.overview).toBeDefined();
      expect(movieDetails.runtime).toBeDefined();
      expect(movieDetails.genres).toBeDefined();
      expect(Array.isArray(movieDetails.genres)).toBe(true);
      
      // Step 3: Get cast information
      const cast = await omdbAdapter.getMovieCredits(firstMovie.id);
      
      // Verify cast structure
      expect(Array.isArray(cast)).toBe(true);
      expect(cast.length).toBeGreaterThan(0);
      
      cast.forEach((member: CastMember) => {
        expect(member.id).toBeDefined();
        expect(typeof member.id).toBe('number');
        expect(member.name).toBeDefined();
        expect(typeof member.name).toBe('string');
        expect(typeof member.order).toBe('number');
      });
    });

    it('should complete search → details → cast workflow for TV shows', async () => {
      // Step 1: Search for TV content
      const searchResults = await omdbAdapter.searchMulti('Breaking Bad', 1);
      
      // Get TV shows from results
      const tvShows = searchResults.tvShows || [];
      expect(tvShows.length).toBeGreaterThan(0);
      
      const firstShow = tvShows[0];
      expect(firstShow.mediaType).toBe('tv');
      
      // Step 2: Get TV details
      const tvDetails = await omdbAdapter.getTvDetails(firstShow.id);
      
      expect(tvDetails).toBeDefined();
      expect(tvDetails.id).toBe(firstShow.id);
      expect(tvDetails.title).toBeDefined();
      
      // Step 3: Get TV cast
      const cast = await omdbAdapter.getTvCredits(firstShow.id);
      
      expect(Array.isArray(cast)).toBe(true);
      expect(cast.length).toBeGreaterThan(0);
    });

    it('should handle workflow with empty search results gracefully', async () => {
      // Search with empty query should return empty results
      const searchResults = await omdbAdapter.searchMulti('', 1);
      
      expect(searchResults).toBeDefined();
      expect(searchResults.movies).toEqual([]);
      expect(searchResults.tvShows).toEqual([]);
      expect(searchResults.totalResults).toBe(0);
    });

    it('should maintain data consistency across workflow steps', async () => {
      // Search for content
      const searchResults = await omdbAdapter.searchMulti('Matrix', 1);
      const movie = searchResults.movies[0];
      
      // Get details
      const details = await omdbAdapter.getMovieDetails(movie.id);
      
      // Verify ID consistency
      expect(details.id).toBe(movie.id);
      
      // Verify title consistency (should be the same or similar)
      expect(details.title).toBe(movie.title);
      
      // Verify media type consistency
      expect(details.mediaType).toBe(movie.mediaType);
    });
  });

  describe('Adapter Switching', () => {
    /**
     * Test that different adapters can be used interchangeably
     * and all implement the same interface
     */
    const adapters: { name: string; adapter: MediaApiAdapter }[] = [
      { name: 'OMDb', adapter: omdbAdapter },
      { name: 'Mock', adapter: mockAdapter },
    ];

    adapters.forEach(({ name, adapter }) => {
      describe(`${name} Adapter Interface Compliance`, () => {
        it('should implement getTrending method', async () => {
          const result = await adapter.getTrending('all', 'day', 1);
          
          expect(result).toBeDefined();
          expect(Array.isArray(result.items)).toBe(true);
          expect(typeof result.totalPages).toBe('number');
          expect(typeof result.totalResults).toBe('number');
        });

        it('should implement searchMulti method', async () => {
          const result = await adapter.searchMulti('test', 1);
          
          expect(result).toBeDefined();
          expect(typeof result.totalResults).toBe('number');
          expect(typeof result.page).toBe('number');
          expect(typeof result.totalPages).toBe('number');
        });

        it('should implement getImageUrl method', () => {
          // Test with valid URL
          const validResult = adapter.getImageUrl('https://example.com/image.jpg');
          // Result should be string or null
          expect(validResult === null || typeof validResult === 'string').toBe(true);
          
          // Test with null
          const nullResult = adapter.getImageUrl(null);
          expect(nullResult).toBeNull();
        });

        it('should implement getWatchProviders method', async () => {
          const result = await adapter.getWatchProviders('movie', 12345, 'US');
          
          expect(Array.isArray(result)).toBe(true);
          result.forEach(provider => {
            expect(typeof provider.providerId).toBe('number');
            expect(typeof provider.providerName).toBe('string');
          });
        });

        it('should implement getTrailerKey method', async () => {
          const result = await adapter.getTrailerKey('movie', 12345);
          
          // Should return string or null
          expect(result === null || typeof result === 'string').toBe(true);
        });

        it('should implement getRecommendations method', async () => {
          const result = await adapter.getRecommendations('movie', 12345, 1);
          
          expect(result).toBeDefined();
          expect(Array.isArray(result.items)).toBe(true);
          expect(typeof result.totalPages).toBe('number');
          expect(typeof result.totalResults).toBe('number');
        });

        it('should implement discoverByCountry method', async () => {
          const result = await adapter.discoverByCountry('movie', 'US', { page: 1 });
          
          expect(result).toBeDefined();
          expect(Array.isArray(result.items)).toBe(true);
          expect(typeof result.totalPages).toBe('number');
          expect(typeof result.totalResults).toBe('number');
        });
      });
    });

    it('should return consistent data structures across adapters', async () => {
      // Get trending from both adapters
      const omdbTrending = await omdbAdapter.getTrending('movie', 'day', 1);
      const mockTrending = await mockAdapter.getTrending('movie', 'day', 1);
      
      // Both should have the same structure
      expect(Object.keys(omdbTrending).sort()).toEqual(Object.keys(mockTrending).sort());
      
      // Items should have consistent structure
      if (omdbTrending.items.length > 0 && mockTrending.items.length > 0) {
        const omdbItem = omdbTrending.items[0];
        const mockItem = mockTrending.items[0];
        
        // Both should have rank property (TrendingItem)
        expect(typeof omdbItem.rank).toBe('number');
        expect(typeof mockItem.rank).toBe('number');
        
        // Both should have standard MediaItem properties
        expect(typeof omdbItem.id).toBe('number');
        expect(typeof mockItem.id).toBe('number');
        expect(typeof omdbItem.title).toBe('string');
        expect(typeof mockItem.title).toBe('string');
      }
    });
  });

  describe('Error Recovery Scenarios', () => {
    /**
     * Test error handling and recovery in various failure scenarios
     */
    it('should handle search errors gracefully', async () => {
      // Empty search should not throw
      const result = await omdbAdapter.searchMulti('', 1);
      
      expect(result).toBeDefined();
      expect(result.movies).toEqual([]);
      expect(result.tvShows).toEqual([]);
    });

    it('should handle missing ID gracefully in getMovieCredits', async () => {
      // Trying to get credits for an ID that doesn't exist in cache
      const result = await omdbAdapter.getMovieCredits(999999999);
      
      // Should return empty array, not throw
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle missing ID gracefully in getTvCredits', async () => {
      const result = await omdbAdapter.getTvCredits(999999999);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle getWatchProviders for any ID without errors', async () => {
      // OMDb doesn't support watch providers, should return defaults
      const result = await omdbAdapter.getWatchProviders('movie', 999999, 'US');
      
      expect(Array.isArray(result)).toBe(true);
      // Should return reasonable defaults
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle getTrailerKey gracefully (unsupported feature)', async () => {
      const result = await omdbAdapter.getTrailerKey('movie', 12345);
      
      // OMDb doesn't support trailers, should return null
      expect(result).toBeNull();
    });

    it('should recover from errors and continue processing', async () => {
      // First, do a successful search to populate cache
      const searchResults = await omdbAdapter.searchMulti('Matrix', 1);
      expect(searchResults.movies.length).toBeGreaterThan(0);
      
      // Try to get details for a non-existent ID (should handle gracefully)
      try {
        await omdbAdapter.getMovieDetails(999999999);
      } catch (error) {
        // Error is expected for non-existent ID
        expect(error).toBeDefined();
      }
      
      // Should still be able to get details for valid ID
      const validMovie = searchResults.movies[0];
      const details = await omdbAdapter.getMovieDetails(validMovie.id);
      expect(details).toBeDefined();
      expect(details.id).toBe(validMovie.id);
    });

    it('should handle pagination edge cases', async () => {
      // Page 1 should work
      const result1 = await omdbAdapter.getTrending('movie', 'day', 1);
      expect(result1).toBeDefined();
      
      // Very high page number should return empty or valid results
      const result2 = await omdbAdapter.getTrending('movie', 'day', 1000);
      expect(result2).toBeDefined();
      expect(Array.isArray(result2.items)).toBe(true);
    });

    it('should handle various country codes in discoverByCountry', async () => {
      const countryCodes = ['US', 'GB', 'JP', 'IN', 'XX']; // XX is invalid
      
      for (const code of countryCodes) {
        const result = await omdbAdapter.discoverByCountry('movie', code, { page: 1 });
        
        // Should not throw for any country code
        expect(result).toBeDefined();
        expect(Array.isArray(result.items)).toBe(true);
      }
    });
  });

  describe('Data Transformation Consistency', () => {
    /**
     * Test that data transformations are consistent and correct
     */
    it('should transform search results to correct MediaItem structure', async () => {
      const searchResults = await omdbAdapter.searchMulti('Matrix', 1);
      
      const allItems = [...searchResults.movies, ...searchResults.tvShows];
      
      allItems.forEach(item => {
        // Required MediaItem properties
        expect(typeof item.id).toBe('number');
        expect(item.id).toBeGreaterThan(0);
        expect(typeof item.title).toBe('string');
        expect(item.title.length).toBeGreaterThan(0);
        expect(['movie', 'tv']).toContain(item.mediaType);
        
        // Optional properties should be correct type or null/undefined
        if (item.posterPath !== null && item.posterPath !== undefined) {
          expect(typeof item.posterPath).toBe('string');
        }
        if (item.releaseDate !== null && item.releaseDate !== undefined) {
          expect(typeof item.releaseDate).toBe('string');
        }
      });
    });

    it('should transform details to correct MediaDetails structure', async () => {
      // First search to populate cache
      const searchResults = await omdbAdapter.searchMulti('Matrix', 1);
      const movie = searchResults.movies[0];
      
      const details = await omdbAdapter.getMovieDetails(movie.id);
      
      // Required MediaDetails properties
      expect(typeof details.id).toBe('number');
      expect(typeof details.title).toBe('string');
      expect(['movie', 'tv']).toContain(details.mediaType);
      
      // Extended properties
      expect(Array.isArray(details.genres)).toBe(true);
      details.genres?.forEach(genre => {
        expect(typeof genre.id).toBe('number');
        expect(typeof genre.name).toBe('string');
      });
      
      if (details.runtime !== null && details.runtime !== undefined) {
        expect(typeof details.runtime).toBe('number');
        expect(details.runtime).toBeGreaterThan(0);
      }
      
      if (details.voteAverage !== null && details.voteAverage !== undefined) {
        expect(typeof details.voteAverage).toBe('number');
        expect(details.voteAverage).toBeGreaterThanOrEqual(0);
        expect(details.voteAverage).toBeLessThanOrEqual(10);
      }
    });

    it('should transform cast to correct CastMember structure', async () => {
      // First search to populate cache
      const searchResults = await omdbAdapter.searchMulti('Matrix', 1);
      const movie = searchResults.movies[0];
      
      const cast = await omdbAdapter.getMovieCredits(movie.id);
      
      cast.forEach(member => {
        expect(typeof member.id).toBe('number');
        expect(member.id).toBeGreaterThan(0);
        expect(typeof member.name).toBe('string');
        expect(member.name.length).toBeGreaterThan(0);
        expect(typeof member.order).toBe('number');
        expect(member.order).toBeGreaterThanOrEqual(0);
        
        // Optional properties
        if (member.character !== null && member.character !== undefined) {
          expect(typeof member.character).toBe('string');
        }
        if (member.profilePath !== null && member.profilePath !== undefined) {
          expect(typeof member.profilePath).toBe('string');
        }
      });
    });
  });

  describe('Fallback Strategy Verification', () => {
    /**
     * Test that fallback strategies work correctly for unsupported features
     */
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should use fallback for getTrending and log usage', async () => {
      await omdbAdapter.getTrending('movie', 'day', 1);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OMDb Adapter] Fallback: getTrending')
      );
    });

    it('should use fallback for discoverByCountry and log usage', async () => {
      await omdbAdapter.discoverByCountry('movie', 'US', { page: 1 });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OMDb Adapter] Fallback: discoverByCountry')
      );
    });

    it('should use fallback for getWatchProviders and log usage', async () => {
      await omdbAdapter.getWatchProviders('movie', 12345, 'US');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OMDb Adapter] Fallback: getWatchProviders')
      );
    });

    it('should use fallback for getTrailerKey and log usage', async () => {
      await omdbAdapter.getTrailerKey('movie', 12345);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OMDb Adapter] Fallback: getTrailerKey')
      );
    });

    it('should use fallback for getRecommendations and log usage', async () => {
      await omdbAdapter.getRecommendations('movie', 12345, 1);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OMDb Adapter] Fallback: getRecommendations')
      );
    });
  });
});
