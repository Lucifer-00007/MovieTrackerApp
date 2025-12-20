/**
 * Property-based tests for Search Screen
 * Feature: moviestream-mvp
 * 
 * Property 14: Search Results Grouping
 * For any search query returning results, the results SHALL be grouped into 
 * separate movies and tvShows arrays by mediaType.
 * 
 * Property 15: Search Filter Application
 * For any search with active filters (country, genre, year), all returned 
 * results SHALL match all specified filter criteria.
 * 
 * **Validates: Requirements 6.3, 6.4**
 */

import * as fc from 'fast-check';
import type { MediaItem } from '@/types/media';
import type { SearchResults, SearchFilters } from '@/types/user';
import {
  groupSearchResults,
  applySearchFilters,
  hasActiveFilters,
  DEFAULT_SEARCH_FILTERS,
  EMPTY_SEARCH_RESULTS,
} from '@/components/search/search-utils';

// Arbitraries for generating test data
const mediaTypeArb = fc.constantFrom('movie' as const, 'tv' as const);

const genreIdArb = fc.integer({ min: 1, max: 100 });

// Generate valid date strings in YYYY-MM-DD format
const releaseDateArb = fc.tuple(
  fc.integer({ min: 1990, max: 2025 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 })
).map(([year, month, day]) => 
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

const mediaItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  originalTitle: fc.string({ minLength: 1, maxLength: 100 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  backdropPath: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  overview: fc.string({ minLength: 0, maxLength: 500 }),
  releaseDate: releaseDateArb,
  voteAverage: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: null }),
  voteCount: fc.integer({ min: 0, max: 100000 }),
  mediaType: mediaTypeArb,
  genreIds: fc.array(genreIdArb, { minLength: 0, maxLength: 5 }),
});

const searchResultsArb = fc.record({
  movies: fc.array(mediaItemArb.filter(item => item.mediaType === 'movie'), { minLength: 0, maxLength: 20 }),
  tvShows: fc.array(mediaItemArb.filter(item => item.mediaType === 'tv'), { minLength: 0, maxLength: 20 }),
  totalResults: fc.integer({ min: 0, max: 1000 }),
  page: fc.integer({ min: 1, max: 100 }),
  totalPages: fc.integer({ min: 0, max: 100 }),
});

// Generate search results with proper mediaType assignment
const mixedMediaItemsArb = fc.array(mediaItemArb, { minLength: 0, maxLength: 40 });

const searchFiltersArb = fc.record({
  country: fc.option(fc.constantFrom('US', 'JP', 'IN', 'CN', 'RU', 'ES', 'DE'), { nil: null }),
  genre: fc.option(genreIdArb, { nil: null }),
  yearFrom: fc.option(fc.integer({ min: 1900, max: 2030 }), { nil: null }),
  yearTo: fc.option(fc.integer({ min: 1900, max: 2030 }), { nil: null }),
});

describe('Feature: moviestream-mvp, Property 14: Search Results Grouping', () => {
  /**
   * Property 14: Search Results Grouping
   * For any search query returning results, the results SHALL be grouped into 
   * separate movies and tvShows arrays by mediaType.
   * 
   * **Validates: Requirements 6.3**
   */
  describe('groupSearchResults correctly separates movies and TV shows', () => {
    it('for any array of media items, grouping should separate by mediaType', () => {
      fc.assert(
        fc.property(
          mixedMediaItemsArb,
          (items) => {
            const { movies, tvShows } = groupSearchResults(items);

            // All items in movies array should have mediaType 'movie'
            const allMoviesCorrect = movies.every(item => item.mediaType === 'movie');
            
            // All items in tvShows array should have mediaType 'tv'
            const allTvShowsCorrect = tvShows.every(item => item.mediaType === 'tv');

            // Total count should match original (excluding any non-movie/tv items)
            const originalMovieCount = items.filter(i => i.mediaType === 'movie').length;
            const originalTvCount = items.filter(i => i.mediaType === 'tv').length;

            expect(allMoviesCorrect).toBe(true);
            expect(allTvShowsCorrect).toBe(true);
            expect(movies.length).toBe(originalMovieCount);
            expect(tvShows.length).toBe(originalTvCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any array of media items, no items should be lost during grouping', () => {
      fc.assert(
        fc.property(
          mixedMediaItemsArb,
          (items) => {
            const { movies, tvShows } = groupSearchResults(items);

            // All original movie/tv items should be present in grouped results
            const movieIds = new Set(movies.map(m => m.id));
            const tvIds = new Set(tvShows.map(t => t.id));

            for (const item of items) {
              if (item.mediaType === 'movie') {
                expect(movieIds.has(item.id)).toBe(true);
              } else if (item.mediaType === 'tv') {
                expect(tvIds.has(item.id)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any array of only movies, tvShows should be empty', () => {
      fc.assert(
        fc.property(
          fc.array(mediaItemArb, { minLength: 0, maxLength: 20 }).map(items =>
            items.map(item => ({ ...item, mediaType: 'movie' as const }))
          ),
          (movieItems) => {
            const { movies, tvShows } = groupSearchResults(movieItems);

            expect(movies.length).toBe(movieItems.length);
            expect(tvShows.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any array of only TV shows, movies should be empty', () => {
      fc.assert(
        fc.property(
          fc.array(mediaItemArb, { minLength: 0, maxLength: 20 }).map(items =>
            items.map(item => ({ ...item, mediaType: 'tv' as const }))
          ),
          (tvItems) => {
            const { movies, tvShows } = groupSearchResults(tvItems);

            expect(movies.length).toBe(0);
            expect(tvShows.length).toBe(tvItems.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for an empty array, both movies and tvShows should be empty', () => {
      const { movies, tvShows } = groupSearchResults([]);
      
      expect(movies.length).toBe(0);
      expect(tvShows.length).toBe(0);
    });
  });
});

describe('Feature: moviestream-mvp, Property 15: Search Filter Application', () => {
  /**
   * Property 15: Search Filter Application
   * For any search with active filters (country, genre, year), all returned 
   * results SHALL match all specified filter criteria.
   * 
   * **Validates: Requirements 6.4**
   */
  describe('applySearchFilters correctly filters by genre', () => {
    it('for any search results and genre filter, all results should contain the genre', () => {
      fc.assert(
        fc.property(
          mixedMediaItemsArb,
          genreIdArb,
          (items, genreId) => {
            // Create search results from items
            const { movies, tvShows } = groupSearchResults(items);
            const searchResults: SearchResults = {
              movies,
              tvShows,
              totalResults: movies.length + tvShows.length,
              page: 1,
              totalPages: 1,
            };

            // Apply genre filter
            const filters: SearchFilters = {
              ...DEFAULT_SEARCH_FILTERS,
              genre: genreId,
            };

            const filtered = applySearchFilters(searchResults, filters);

            // All filtered movies should contain the genre
            const allMoviesMatch = filtered.movies.every(
              item => item.genreIds.includes(genreId)
            );

            // All filtered TV shows should contain the genre
            const allTvShowsMatch = filtered.tvShows.every(
              item => item.genreIds.includes(genreId)
            );

            expect(allMoviesMatch).toBe(true);
            expect(allTvShowsMatch).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('applySearchFilters correctly filters by year', () => {
    it('for any search results and year filter, all results should match the year', () => {
      fc.assert(
        fc.property(
          mixedMediaItemsArb,
          fc.integer({ min: 2000, max: 2025 }),
          (items, year) => {
            // Create search results from items
            const { movies, tvShows } = groupSearchResults(items);
            const searchResults: SearchResults = {
              movies,
              tvShows,
              totalResults: movies.length + tvShows.length,
              page: 1,
              totalPages: 1,
            };

            // Apply year filter
            const filters: SearchFilters = {
              ...DEFAULT_SEARCH_FILTERS,
              yearFrom: year,
              yearTo: year,
            };

            const filtered = applySearchFilters(searchResults, filters);

            // All filtered movies should match the year
            const allMoviesMatch = filtered.movies.every(item => {
              if (!item.releaseDate) return false;
              const itemYear = new Date(item.releaseDate).getFullYear();
              return itemYear === year;
            });

            // All filtered TV shows should match the year
            const allTvShowsMatch = filtered.tvShows.every(item => {
              if (!item.releaseDate) return false;
              const itemYear = new Date(item.releaseDate).getFullYear();
              return itemYear === year;
            });

            expect(allMoviesMatch).toBe(true);
            expect(allTvShowsMatch).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('applySearchFilters with no active filters returns all results', () => {
    it('for any search results with no filters, all items should be returned', () => {
      fc.assert(
        fc.property(
          mixedMediaItemsArb,
          (items) => {
            // Create search results from items
            const { movies, tvShows } = groupSearchResults(items);
            const searchResults: SearchResults = {
              movies,
              tvShows,
              totalResults: movies.length + tvShows.length,
              page: 1,
              totalPages: 1,
            };

            // Apply no filters
            const filtered = applySearchFilters(searchResults, DEFAULT_SEARCH_FILTERS);

            // All items should be returned
            expect(filtered.movies.length).toBe(movies.length);
            expect(filtered.tvShows.length).toBe(tvShows.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('applySearchFilters with multiple filters applies all criteria', () => {
    it('for any search results with genre and year filters, results should match both', () => {
      fc.assert(
        fc.property(
          mixedMediaItemsArb,
          genreIdArb,
          fc.integer({ min: 2000, max: 2025 }),
          (items, genreId, year) => {
            // Create search results from items
            const { movies, tvShows } = groupSearchResults(items);
            const searchResults: SearchResults = {
              movies,
              tvShows,
              totalResults: movies.length + tvShows.length,
              page: 1,
              totalPages: 1,
            };

            // Apply both genre and year filters
            const filters: SearchFilters = {
              ...DEFAULT_SEARCH_FILTERS,
              genre: genreId,
              yearFrom: year,
              yearTo: year,
            };

            const filtered = applySearchFilters(searchResults, filters);

            // All filtered movies should match both criteria
            const allMoviesMatch = filtered.movies.every(item => {
              const hasGenre = item.genreIds.includes(genreId);
              const matchesYear = item.releaseDate 
                ? new Date(item.releaseDate).getFullYear() === year 
                : false;
              return hasGenre && matchesYear;
            });

            // All filtered TV shows should match both criteria
            const allTvShowsMatch = filtered.tvShows.every(item => {
              const hasGenre = item.genreIds.includes(genreId);
              const matchesYear = item.releaseDate 
                ? new Date(item.releaseDate).getFullYear() === year 
                : false;
              return hasGenre && matchesYear;
            });

            expect(allMoviesMatch).toBe(true);
            expect(allTvShowsMatch).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('hasActiveFilters correctly identifies active filters', () => {
    it('for default filters, hasActiveFilters should return false', () => {
      expect(hasActiveFilters(DEFAULT_SEARCH_FILTERS)).toBe(false);
    });

    it('for any filter with at least one non-null value, hasActiveFilters should return true', () => {
      fc.assert(
        fc.property(
          searchFiltersArb.filter(f => 
            f.country !== null || f.genre !== null || f.yearFrom !== null || f.yearTo !== null
          ),
          (filters) => {
            expect(hasActiveFilters(filters)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for filters with all null values, hasActiveFilters should return false', () => {
      const nullFilters: SearchFilters = {
        country: null,
        genre: null,
        yearFrom: null,
        yearTo: null,
      };
      expect(hasActiveFilters(nullFilters)).toBe(false);
    });
  });

  describe('filtered results totalResults is updated correctly', () => {
    it('for any filtered results, totalResults should equal sum of movies and tvShows', () => {
      fc.assert(
        fc.property(
          mixedMediaItemsArb,
          searchFiltersArb,
          (items, filters) => {
            // Create search results from items
            const { movies, tvShows } = groupSearchResults(items);
            const searchResults: SearchResults = {
              movies,
              tvShows,
              totalResults: movies.length + tvShows.length,
              page: 1,
              totalPages: 1,
            };

            const filtered = applySearchFilters(searchResults, filters);

            // totalResults should equal the sum of filtered arrays
            expect(filtered.totalResults).toBe(
              filtered.movies.length + filtered.tvShows.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
