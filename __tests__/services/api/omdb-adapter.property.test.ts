/**
 * Property-based tests for OMDb API Adapter
 * Feature: omdb-api-integration
 * 
 * Tests fallback strategies for unsupported features
 */

import * as fc from 'fast-check';
import { omdbAdapter } from '@/services/api/adapters/omdb-adapter';
import type { PaginatedResponse } from '@/services/api/types';
import type { TrendingItem, MediaItem } from '@/types/media';

// Mock the OMDb API client to avoid actual API calls
jest.mock('@/services/api/omdb', () => {
  const actual = jest.requireActual('@/services/api/omdb');
  return {
    ...actual,
    searchContent: jest.fn().mockImplementation(async (params) => {
      // Return mock search results
      const mockItems = [
        {
          Title: 'Test Movie',
          Year: '2023',
          imdbID: 'tt1234567',
          Type: 'movie' as const,
          Poster: 'https://example.com/poster.jpg',
        },
        {
          Title: 'Test Series',
          Year: '2022',
          imdbID: 'tt7654321',
          Type: 'series' as const,
          Poster: 'https://example.com/poster2.jpg',
        },
      ];
      
      return {
        items: mockItems,
        totalResults: 20,
        page: params.page || 1,
        totalPages: 2,
      };
    }),
    getDetailsByImdbId: jest.fn().mockImplementation(async (params) => {
      return {
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
        imdbID: params.imdbId,
        Type: 'movie' as const,
        Response: 'True' as const,
      };
    }),
    getImdbIdFromNumeric: jest.fn().mockReturnValue('tt1234567'),
  };
});

describe('Feature: omdb-api-integration, Property 7: Fallback strategies for unsupported features', () => {
  /**
   * Property 7: Fallback strategies for unsupported features
   * For any request for trending content or country-based discovery, the OMDb adapter 
   * should implement appropriate fallback strategies and provide reasonable defaults 
   * while logging when fallbacks are used
   * 
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */

  // Spy on console.warn to verify fallback logging
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('getTrending Fallback Strategy', () => {
    it('should return valid PaginatedResponse structure for any media type and page', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'all' | 'movie' | 'tv'>('all', 'movie', 'tv'),
          fc.constantFrom<'day' | 'week'>('day', 'week'),
          fc.integer({ min: 1, max: 100 }),
          async (mediaType, timeWindow, page) => {
            const result = await omdbAdapter.getTrending(mediaType, timeWindow, page);
            
            // Result must have correct PaginatedResponse structure
            expect(Array.isArray(result.items)).toBe(true);
            expect(typeof result.totalPages).toBe('number');
            expect(typeof result.totalResults).toBe('number');
            
            // Numeric values must be non-negative
            expect(result.totalPages).toBeGreaterThanOrEqual(0);
            expect(result.totalResults).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return TrendingItems with valid rank property for any page', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'all' | 'movie' | 'tv'>('all', 'movie', 'tv'),
          fc.integer({ min: 1, max: 50 }),
          async (mediaType, page) => {
            const result = await omdbAdapter.getTrending(mediaType, 'day', page);
            
            // Each item must have a rank property
            result.items.forEach((item: TrendingItem) => {
              expect(typeof item.rank).toBe('number');
              expect(item.rank).toBeGreaterThan(0);
            });
            
            // Ranks should be sequential within the page
            if (result.items.length > 1) {
              for (let i = 1; i < result.items.length; i++) {
                expect(result.items[i].rank).toBeGreaterThan(result.items[i - 1].rank);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log fallback usage when getTrending is called', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'all' | 'movie' | 'tv'>('all', 'movie', 'tv'),
          async (mediaType) => {
            consoleWarnSpy.mockClear();
            
            await omdbAdapter.getTrending(mediaType, 'day', 1);
            
            // Should log fallback usage
            expect(consoleWarnSpy).toHaveBeenCalledWith(
              expect.stringContaining('[OMDb Adapter] Fallback: getTrending')
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('discoverByCountry Fallback Strategy', () => {
    it('should return valid PaginatedResponse for any country code', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
          fc.constantFrom('US', 'IN', 'JP', 'CN', 'RU', 'ES', 'DE', 'FR', 'KR', 'GB'),
          fc.integer({ min: 1, max: 50 }),
          async (mediaType, countryCode, page) => {
            const result = await omdbAdapter.discoverByCountry(mediaType, countryCode, { page });
            
            // Result must have correct PaginatedResponse structure
            expect(Array.isArray(result.items)).toBe(true);
            expect(typeof result.totalPages).toBe('number');
            expect(typeof result.totalResults).toBe('number');
            
            // Numeric values must be non-negative
            expect(result.totalPages).toBeGreaterThanOrEqual(0);
            expect(result.totalResults).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return TrendingItems with valid rank for country discovery', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
          fc.constantFrom('US', 'IN', 'JP'),
          fc.integer({ min: 1, max: 20 }),
          async (mediaType, countryCode, page) => {
            const result = await omdbAdapter.discoverByCountry(mediaType, countryCode, { page });
            
            // Each item must have a rank property
            result.items.forEach((item: TrendingItem) => {
              expect(typeof item.rank).toBe('number');
              expect(item.rank).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log fallback usage when discoverByCountry is called', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('US', 'IN', 'JP'),
          async (countryCode) => {
            consoleWarnSpy.mockClear();
            
            await omdbAdapter.discoverByCountry('movie', countryCode, { page: 1 });
            
            // Should log fallback usage
            expect(consoleWarnSpy).toHaveBeenCalledWith(
              expect.stringContaining('[OMDb Adapter] Fallback: discoverByCountry')
            );
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle unknown country codes gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringOf(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'), { minLength: 2, maxLength: 2 }),
          async (unknownCountryCode) => {
            // Should not throw for unknown country codes
            const result = await omdbAdapter.discoverByCountry('movie', unknownCountryCode, { page: 1 });
            
            // Should still return valid structure
            expect(Array.isArray(result.items)).toBe(true);
            expect(typeof result.totalPages).toBe('number');
            expect(typeof result.totalResults).toBe('number');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should support year filter in options', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
          fc.constantFrom('US', 'IN'),
          fc.integer({ min: 1990, max: 2024 }),
          async (mediaType, countryCode, year) => {
            const result = await omdbAdapter.discoverByCountry(mediaType, countryCode, { 
              page: 1, 
              year 
            });
            
            // Should return valid structure even with year filter
            expect(Array.isArray(result.items)).toBe(true);
            expect(typeof result.totalPages).toBe('number');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('getWatchProviders Fallback', () => {
    it('should return empty array for any media type and ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
          fc.integer({ min: 1, max: 1000000 }),
          fc.constantFrom('US', 'GB', 'DE', 'FR'),
          async (mediaType, mediaId, countryCode) => {
            const result = await omdbAdapter.getWatchProviders(mediaType, mediaId, countryCode);
            
            // Should always return empty array (OMDb doesn't support this)
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log fallback usage when getWatchProviders is called', async () => {
      consoleWarnSpy.mockClear();
      
      await omdbAdapter.getWatchProviders('movie', 12345, 'US');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OMDb Adapter] Fallback: getWatchProviders')
      );
    });
  });

  describe('getTrailerKey Fallback', () => {
    it('should return null for any media type and ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
          fc.integer({ min: 1, max: 1000000 }),
          async (mediaType, mediaId) => {
            const result = await omdbAdapter.getTrailerKey(mediaType, mediaId);
            
            // Should always return null (OMDb doesn't support this)
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log fallback usage when getTrailerKey is called', async () => {
      consoleWarnSpy.mockClear();
      
      await omdbAdapter.getTrailerKey('movie', 12345);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OMDb Adapter] Fallback: getTrailerKey')
      );
    });
  });

  describe('getRecommendations Fallback', () => {
    it('should return valid PaginatedResponse for any media type and ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
          fc.integer({ min: 1, max: 1000000 }),
          fc.integer({ min: 1, max: 20 }),
          async (mediaType, mediaId, page) => {
            const result = await omdbAdapter.getRecommendations(mediaType, mediaId, page);
            
            // Result must have correct PaginatedResponse structure
            expect(Array.isArray(result.items)).toBe(true);
            expect(typeof result.totalPages).toBe('number');
            expect(typeof result.totalResults).toBe('number');
            
            // Numeric values must be non-negative
            expect(result.totalPages).toBeGreaterThanOrEqual(0);
            expect(result.totalResults).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return MediaItems with valid structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
          fc.integer({ min: 1, max: 100 }),
          async (mediaType, mediaId) => {
            const result = await omdbAdapter.getRecommendations(mediaType, mediaId, 1);
            
            // Each item must have required MediaItem properties
            result.items.forEach((item: MediaItem) => {
              expect(typeof item.id).toBe('number');
              expect(typeof item.title).toBe('string');
              expect(typeof item.mediaType).toBe('string');
              expect(['movie', 'tv']).toContain(item.mediaType);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should log fallback usage when getRecommendations is called', async () => {
      consoleWarnSpy.mockClear();
      
      await omdbAdapter.getRecommendations('movie', 12345, 1);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OMDb Adapter] Fallback: getRecommendations')
      );
    });
  });

  describe('Reasonable Defaults', () => {
    it('should limit totalPages to reasonable number for trending', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'all' | 'movie' | 'tv'>('all', 'movie', 'tv'),
          fc.integer({ min: 1, max: 100 }),
          async (mediaType, page) => {
            const result = await omdbAdapter.getTrending(mediaType, 'day', page);
            
            // Total pages should be capped at a reasonable number
            expect(result.totalPages).toBeLessThanOrEqual(10);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should limit totalPages to reasonable number for country discovery', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('US', 'IN', 'JP'),
          fc.integer({ min: 1, max: 100 }),
          async (countryCode, page) => {
            const result = await omdbAdapter.discoverByCountry('movie', countryCode, { page });
            
            // Total pages should be capped at a reasonable number
            expect(result.totalPages).toBeLessThanOrEqual(10);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
