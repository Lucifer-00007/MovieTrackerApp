/**
 * Property-based tests for OMDb API Adapter
 * Feature: omdb-api-integration
 * 
 * Tests fallback strategies for unsupported features
 */

import * as fc from 'fast-check';
import type { PaginatedResponse } from '@/services/api/types';
import type { TrendingItem, MediaItem } from '@/types/media';

// Create a real OMDbError class for the mock
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

// Mock the OMDb API client to avoid actual API calls
jest.mock('@/services/api/omdb', () => ({
  searchContent: jest.fn().mockImplementation(async (params) => {
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
  generateNumericId: jest.fn().mockImplementation((imdbId: string) => {
    let hash = 0;
    for (let i = 0; i < imdbId.length; i++) {
      const char = imdbId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }),
  OMDbError: MockOMDbError,
}));

// Import the adapter after mocking
import { omdbAdapter } from '@/services/api/adapters/omdb-adapter';

describe('Feature: omdb-api-integration, Property 9: Image URL handling', () => {
  /**
   * Property 9: Image URL handling
   * For any OMDb response containing poster URLs, the image service should return 
   * valid poster URLs via getImageUrl method without additional processing, and 
   * should validate URLs before returning them
   * 
   * **Validates: Requirements 6.1, 6.2, 6.5**
   */

  describe('getImageUrl Method', () => {
    it('should return null for null or undefined input', () => {
      expect(omdbAdapter.getImageUrl(null)).toBeNull();
      expect(omdbAdapter.getImageUrl(undefined as any)).toBeNull();
    });

    it('should return null for OMDb N/A response', () => {
      expect(omdbAdapter.getImageUrl('N/A')).toBeNull();
    });

    it('should validate and return valid HTTPS URLs', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'https://example.com/poster.jpg',
            'https://m.media-amazon.com/images/M/poster.jpg',
            'https://images.example.com/movie-poster.png',
            'https://cdn.example.com/image.jpeg'
          ),
          (validUrl) => {
            const result = omdbAdapter.getImageUrl(validUrl);
            
            // Should return the URL for valid HTTPS URLs
            expect(result).toBe(validUrl);
            
            // Result should be a valid URL
            if (result) {
              expect(() => new URL(result)).not.toThrow();
              expect(result.startsWith('https://')).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate and return valid HTTP URLs', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'http://example.com/poster.jpg',
            'http://images.example.com/movie.png',
            'http://cdn.example.com/poster.gif'
          ),
          (validUrl) => {
            const result = omdbAdapter.getImageUrl(validUrl);
            
            // Should return the URL for valid HTTP URLs
            expect(result).toBe(validUrl);
            
            // Result should be a valid URL
            if (result) {
              expect(() => new URL(result)).not.toThrow();
              expect(result.startsWith('http://')).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return null for invalid URLs', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'not-a-url',
            'ftp://example.com/poster.jpg',
            'javascript:alert("xss")',
            'data:image/png;base64,abc123',
            '',
            '   ',
            'file:///local/image.jpg'
          ),
          (invalidUrl) => {
            const result = omdbAdapter.getImageUrl(invalidUrl);
            
            // Should return null for invalid URLs or unsupported protocols
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle URLs with various image extensions', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom('.jpg', '.jpeg', '.png', '.gif', '.webp'),
          fc.constantFrom('https://example.com', 'http://images.test.com'),
          (extension, baseUrl) => {
            const testUrl = `${baseUrl}/poster${extension}`;
            const result = omdbAdapter.getImageUrl(testUrl);
            
            // Should return valid URLs with image extensions
            expect(result).toBe(testUrl);
            
            if (result) {
              expect(() => new URL(result)).not.toThrow();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle URLs without image extensions', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'https://example.com/poster',
            'https://api.example.com/image/12345',
            'http://cdn.example.com/media/poster-large'
          ),
          (urlWithoutExtension) => {
            const result = omdbAdapter.getImageUrl(urlWithoutExtension);
            
            // Should still return valid URLs even without image extensions
            expect(result).toBe(urlWithoutExtension);
            
            if (result) {
              expect(() => new URL(result)).not.toThrow();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle URLs with query parameters and fragments', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'https://example.com/poster.jpg?size=large',
            'https://example.com/image.png?width=300&height=450',
            'https://example.com/poster.jpg#main',
            'https://example.com/image.png?v=1.2.3&format=webp'
          ),
          (urlWithParams) => {
            const result = omdbAdapter.getImageUrl(urlWithParams);
            
            // Should handle URLs with query parameters and fragments
            expect(result).toBe(urlWithParams);
            
            if (result) {
              expect(() => new URL(result)).not.toThrow();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return null for malformed URLs', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'not-a-url',
            'ftp://example.com/poster.jpg',
            'javascript:alert("xss")',
            'data:image/png;base64,abc123',
            '',
            '   ',
            'file:///local/image.jpg',
            'https://',
            'http://',
            'https:///',
            'https://example..com/poster.jpg',
            'https://..com/poster.jpg'
          ),
          (invalidUrl) => {
            const result = omdbAdapter.getImageUrl(invalidUrl);
            
            // Should return null for invalid URLs or unsupported protocols
            expect(result).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should ignore size parameter since OMDb returns direct URLs', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'https://example.com/poster.jpg',
            'http://images.example.com/movie.png'
          ),
          fc.constantFrom('small', 'medium', 'large', 'original', 'w500'),
          (validUrl, size) => {
            const resultWithSize = omdbAdapter.getImageUrl(validUrl, size);
            const resultWithoutSize = omdbAdapter.getImageUrl(validUrl);
            
            // Size parameter should be ignored for OMDb URLs
            expect(resultWithSize).toBe(resultWithoutSize);
            expect(resultWithSize).toBe(validUrl);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('URL Validation Edge Cases', () => {
    it('should handle extremely long URLs', () => {
      const longPath = 'a'.repeat(1000);
      const longUrl = `https://example.com/${longPath}.jpg`;
      
      const result = omdbAdapter.getImageUrl(longUrl);
      
      // Should handle long URLs if they're valid
      expect(result).toBe(longUrl);
    });

    it('should handle URLs with special characters', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'https://example.com/poster%20with%20spaces.jpg',
            'https://example.com/poster-with-dashes.jpg',
            'https://example.com/poster_with_underscores.jpg',
            'https://example.com/poster.with.dots.jpg'
          ),
          (urlWithSpecialChars) => {
            const result = omdbAdapter.getImageUrl(urlWithSpecialChars);
            
            // Should handle URLs with encoded special characters
            expect(result).toBe(urlWithSpecialChars);
            
            if (result) {
              expect(() => new URL(result)).not.toThrow();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle international domain names', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom(
            'https://example.co.uk/poster.jpg',
            'https://example.com.au/image.png',
            'https://example.de/poster.jpeg',
            'https://sub.example.org/media.gif'
          ),
          (internationalUrl) => {
            const result = omdbAdapter.getImageUrl(internationalUrl);
            
            // Should handle international domain names
            expect(result).toBe(internationalUrl);
            
            if (result) {
              expect(() => new URL(result)).not.toThrow();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
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
          fc.stringMatching(/^[A-Z]{2}$/),
          async (unknownCountryCode: string) => {
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
    it('should return reasonable defaults for any media type and ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<'movie' | 'tv'>('movie', 'tv'),
          fc.integer({ min: 1, max: 1000000 }),
          fc.constantFrom('US', 'GB', 'DE', 'FR', 'CA'),
          async (mediaType, mediaId, countryCode) => {
            const result = await omdbAdapter.getWatchProviders(mediaType, mediaId, countryCode);
            
            // Should return array of streaming providers (reasonable defaults)
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(0);
            expect(result.length).toBeLessThanOrEqual(4); // Max 4 providers per country
            
            // Each provider should have required properties
            result.forEach(provider => {
              expect(typeof provider.providerId).toBe('number');
              expect(typeof provider.providerName).toBe('string');
              expect(typeof provider.logoPath).toBe('string');
              expect(typeof provider.link).toBe('string');
              expect(['flatrate', 'rent', 'buy']).toContain(provider.type);
              expect(typeof provider.isAvailable).toBe('boolean');
            });
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
