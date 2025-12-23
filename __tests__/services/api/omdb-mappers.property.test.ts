/**
 * Property-based tests for OMDb Data Transformation Layer
 * Feature: omdb-api-integration
 * 
 * Property 3: Data transformation consistency
 * For any valid OMDb API response, the data mapper should transform the response 
 * data to match the application's MediaItem and MediaDetails types with all 
 * required fields populated
 * 
 * **Validates: Requirements 1.5, 3.4**
 */

import * as fc from 'fast-check';
import {
  mapOMDbToMediaItem,
  mapOMDbToMediaDetails,
  mapOMDbSearchToSearchResults,
  parseRuntime,
  parseGenres,
  parseCountries,
  parseLanguages,
  parseVoteCount,
  parseRating,
  normalizePosterUrl,
  parseReleaseDate,
  parseReleasedDate,
  mapMediaType,
} from '@/services/api/omdb-mappers';
import type { OMDbSearchItem, OMDbDetailResponse, OMDbSearchResults } from '@/services/api/omdb';

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid OMDb search items
 */
const omdbSearchItemGen = fc.record({
  Title: fc.string({ minLength: 1, maxLength: 200 }),
  Year: fc.oneof(
    fc.integer({ min: 1900, max: 2030 }).map(String),
    fc.tuple(
      fc.integer({ min: 1900, max: 2020 }),
      fc.integer({ min: 2020, max: 2030 })
    ).map(([start, end]) => `${start}–${end}`),
    fc.integer({ min: 1900, max: 2030 }).map(y => `${y}–`)
  ),
  imdbID: fc.stringMatching(/^tt\d{7,8}$/),
  Type: fc.constantFrom<'movie' | 'series' | 'episode'>('movie', 'series', 'episode'),
  Poster: fc.oneof(
    fc.constant('N/A'),
    fc.webUrl({ validSchemes: ['https'] })
  ),
});

/**
 * Generator for valid OMDb detail responses
 */
const omdbDetailResponseGen = fc.record({
  Title: fc.string({ minLength: 1, maxLength: 200 }),
  Year: fc.integer({ min: 1900, max: 2030 }).map(String),
  Rated: fc.oneof(
    fc.constant('N/A'),
    fc.constantFrom('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-MA', 'TV-14', 'TV-PG')
  ),
  Released: fc.oneof(
    fc.constant('N/A'),
    fc.date({ min: new Date('1900-01-01'), max: new Date('2030-12-31') })
      .map(d => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }))
  ),
  Runtime: fc.oneof(
    fc.constant('N/A'),
    fc.integer({ min: 1, max: 500 }).map(m => `${m} min`)
  ),
  Genre: fc.oneof(
    fc.constant('N/A'),
    fc.array(fc.constantFrom('Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance'), { minLength: 1, maxLength: 4 })
      .map(genres => genres.join(', '))
  ),
  Director: fc.oneof(
    fc.constant('N/A'),
    fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 3 })
      .map(names => names.join(', '))
  ),
  Writer: fc.oneof(
    fc.constant('N/A'),
    fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 3 })
      .map(names => names.join(', '))
  ),
  Actors: fc.oneof(
    fc.constant('N/A'),
    fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 5 })
      .map(names => names.join(', '))
  ),
  Plot: fc.oneof(
    fc.constant('N/A'),
    fc.string({ minLength: 10, maxLength: 500 })
  ),
  Language: fc.oneof(
    fc.constant('N/A'),
    fc.array(fc.constantFrom('English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'), { minLength: 1, maxLength: 3 })
      .map(langs => langs.join(', '))
  ),
  Country: fc.oneof(
    fc.constant('N/A'),
    fc.array(fc.constantFrom('United States', 'United Kingdom', 'Canada', 'France', 'Germany', 'Japan'), { minLength: 1, maxLength: 3 })
      .map(countries => countries.join(', '))
  ),
  Awards: fc.oneof(
    fc.constant('N/A'),
    fc.string({ minLength: 5, maxLength: 100 })
  ),
  Poster: fc.oneof(
    fc.constant('N/A'),
    fc.webUrl({ validSchemes: ['https'] })
  ),
  Ratings: fc.array(
    fc.record({
      Source: fc.constantFrom('Internet Movie Database', 'Rotten Tomatoes', 'Metacritic'),
      Value: fc.string({ minLength: 1, maxLength: 10 }),
    }),
    { minLength: 0, maxLength: 3 }
  ),
  Metascore: fc.oneof(
    fc.constant('N/A'),
    fc.integer({ min: 0, max: 100 }).map(String)
  ),
  imdbRating: fc.oneof(
    fc.constant('N/A'),
    fc.float({ min: 0, max: 10, noNaN: true }).map(r => r.toFixed(1))
  ),
  imdbVotes: fc.oneof(
    fc.constant('N/A'),
    fc.integer({ min: 0, max: 10000000 }).map(v => v.toLocaleString())
  ),
  imdbID: fc.stringMatching(/^tt\d{7,8}$/),
  Type: fc.constantFrom<'movie' | 'series' | 'episode'>('movie', 'series', 'episode'),
  Response: fc.constant<'True'>('True'),
  totalSeasons: fc.option(fc.integer({ min: 1, max: 50 }).map(String), { nil: undefined }),
});

/**
 * Generator for OMDb search results
 */
const omdbSearchResultsGen = fc.record({
  items: fc.array(omdbSearchItemGen, { minLength: 0, maxLength: 10 }),
  totalResults: fc.integer({ min: 0, max: 10000 }),
  page: fc.integer({ min: 1, max: 100 }),
  totalPages: fc.integer({ min: 0, max: 1000 }),
});

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Feature: omdb-api-integration, Property 3: Data transformation consistency', () => {
  /**
   * Property 3: Data transformation consistency
   * For any valid OMDb API response, the data mapper should transform the response 
   * data to match the application's MediaItem and MediaDetails types with all 
   * required fields populated
   * 
   * **Validates: Requirements 1.5, 3.4**
   */

  describe('mapOMDbToMediaItem', () => {
    it('should transform any valid OMDb search item to MediaItem with all required fields', () => {
      fc.assert(
        fc.property(omdbSearchItemGen, (omdbItem) => {
          const mediaItem = mapOMDbToMediaItem(omdbItem);

          // All required fields must be present
          expect(mediaItem).toHaveProperty('id');
          expect(mediaItem).toHaveProperty('title');
          expect(mediaItem).toHaveProperty('originalTitle');
          expect(mediaItem).toHaveProperty('posterPath');
          expect(mediaItem).toHaveProperty('backdropPath');
          expect(mediaItem).toHaveProperty('overview');
          expect(mediaItem).toHaveProperty('releaseDate');
          expect(mediaItem).toHaveProperty('voteAverage');
          expect(mediaItem).toHaveProperty('voteCount');
          expect(mediaItem).toHaveProperty('mediaType');
          expect(mediaItem).toHaveProperty('genreIds');

          // ID must be a positive number
          expect(typeof mediaItem.id).toBe('number');
          expect(mediaItem.id).toBeGreaterThan(0);

          // Title must match input
          expect(mediaItem.title).toBe(omdbItem.Title);
          expect(mediaItem.originalTitle).toBe(omdbItem.Title);

          // Media type must be correctly mapped
          expect(['movie', 'tv']).toContain(mediaItem.mediaType);

          // Genre IDs must be an array
          expect(Array.isArray(mediaItem.genreIds)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate consistent IDs for the same IMDb ID', () => {
      fc.assert(
        fc.property(omdbSearchItemGen, (omdbItem) => {
          const mediaItem1 = mapOMDbToMediaItem(omdbItem);
          const mediaItem2 = mapOMDbToMediaItem(omdbItem);

          // Same input should produce same ID
          expect(mediaItem1.id).toBe(mediaItem2.id);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle N/A poster URLs by returning null', () => {
      fc.assert(
        fc.property(
          omdbSearchItemGen.map(item => ({ ...item, Poster: 'N/A' })),
          (omdbItem) => {
            const mediaItem = mapOMDbToMediaItem(omdbItem);
            expect(mediaItem.posterPath).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve valid poster URLs', () => {
      fc.assert(
        fc.property(
          fc.tuple(omdbSearchItemGen, fc.webUrl({ validSchemes: ['https'] })),
          ([omdbItem, validUrl]) => {
            const itemWithPoster = { ...omdbItem, Poster: validUrl };
            const mediaItem = mapOMDbToMediaItem(itemWithPoster);
            expect(mediaItem.posterPath).toBe(validUrl);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('mapOMDbToMediaDetails', () => {
    it('should transform any valid OMDb detail response to MediaDetails with all required fields', () => {
      fc.assert(
        fc.property(omdbDetailResponseGen, (omdbDetail) => {
          const mediaDetails = mapOMDbToMediaDetails(omdbDetail);

          // All required MediaItem fields must be present
          expect(mediaDetails).toHaveProperty('id');
          expect(mediaDetails).toHaveProperty('title');
          expect(mediaDetails).toHaveProperty('originalTitle');
          expect(mediaDetails).toHaveProperty('posterPath');
          expect(mediaDetails).toHaveProperty('backdropPath');
          expect(mediaDetails).toHaveProperty('overview');
          expect(mediaDetails).toHaveProperty('releaseDate');
          expect(mediaDetails).toHaveProperty('voteAverage');
          expect(mediaDetails).toHaveProperty('voteCount');
          expect(mediaDetails).toHaveProperty('mediaType');
          expect(mediaDetails).toHaveProperty('genreIds');

          // All required MediaDetails fields must be present
          expect(mediaDetails).toHaveProperty('runtime');
          expect(mediaDetails).toHaveProperty('genres');
          expect(mediaDetails).toHaveProperty('tagline');
          expect(mediaDetails).toHaveProperty('status');
          expect(mediaDetails).toHaveProperty('productionCountries');
          expect(mediaDetails).toHaveProperty('spokenLanguages');

          // ID must be a positive number
          expect(typeof mediaDetails.id).toBe('number');
          expect(mediaDetails.id).toBeGreaterThan(0);

          // Title must match input
          expect(mediaDetails.title).toBe(omdbDetail.Title);

          // Genres must be an array
          expect(Array.isArray(mediaDetails.genres)).toBe(true);

          // Production countries must be an array
          expect(Array.isArray(mediaDetails.productionCountries)).toBe(true);

          // Spoken languages must be an array
          expect(Array.isArray(mediaDetails.spokenLanguages)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly parse runtime from various formats', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          (minutes) => {
            const omdbDetail = {
              Title: 'Test Movie',
              Year: '2023',
              Rated: 'PG-13',
              Released: '01 Jan 2023',
              Runtime: `${minutes} min`,
              Genre: 'Action',
              Director: 'Test Director',
              Writer: 'Test Writer',
              Actors: 'Test Actor',
              Plot: 'Test plot',
              Language: 'English',
              Country: 'United States',
              Awards: 'N/A',
              Poster: 'N/A',
              Ratings: [],
              Metascore: 'N/A',
              imdbRating: '7.5',
              imdbVotes: '1,000',
              imdbID: 'tt1234567',
              Type: 'movie' as const,
              Response: 'True' as const,
            };

            const mediaDetails = mapOMDbToMediaDetails(omdbDetail);
            expect(mediaDetails.runtime).toBe(minutes);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly parse IMDb rating to voteAverage', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10, noNaN: true }),
          (rating) => {
            const ratingStr = rating.toFixed(1);
            const omdbDetail = {
              Title: 'Test Movie',
              Year: '2023',
              Rated: 'PG-13',
              Released: '01 Jan 2023',
              Runtime: '120 min',
              Genre: 'Action',
              Director: 'Test Director',
              Writer: 'Test Writer',
              Actors: 'Test Actor',
              Plot: 'Test plot',
              Language: 'English',
              Country: 'United States',
              Awards: 'N/A',
              Poster: 'N/A',
              Ratings: [],
              Metascore: 'N/A',
              imdbRating: ratingStr,
              imdbVotes: '1,000',
              imdbID: 'tt1234567',
              Type: 'movie' as const,
              Response: 'True' as const,
            };

            const mediaDetails = mapOMDbToMediaDetails(omdbDetail);
            expect(mediaDetails.voteAverage).toBeCloseTo(parseFloat(ratingStr), 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('mapOMDbSearchToSearchResults', () => {
    it('should correctly separate movies and TV shows in search results', () => {
      fc.assert(
        fc.property(omdbSearchResultsGen, (omdbResults) => {
          const searchResults = mapOMDbSearchToSearchResults(omdbResults);

          // All movies should have mediaType 'movie'
          searchResults.movies.forEach(movie => {
            expect(movie.mediaType).toBe('movie');
          });

          // All TV shows should have mediaType 'tv'
          searchResults.tvShows.forEach(tvShow => {
            expect(tvShow.mediaType).toBe('tv');
          });

          // Total items should match (movies + tvShows = original items)
          const totalMapped = searchResults.movies.length + searchResults.tvShows.length;
          expect(totalMapped).toBe(omdbResults.items.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve pagination information', () => {
      fc.assert(
        fc.property(
          omdbSearchResultsGen,
          fc.integer({ min: 1, max: 100 }),
          (omdbResults, page) => {
            const searchResults = mapOMDbSearchToSearchResults(omdbResults, page);

            expect(searchResults.page).toBe(page);
            expect(searchResults.totalResults).toBe(omdbResults.totalResults);
            expect(searchResults.totalPages).toBe(omdbResults.totalPages);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Utility Functions', () => {
    describe('parseRuntime', () => {
      it('should return null for N/A or undefined', () => {
        expect(parseRuntime('N/A')).toBeNull();
        expect(parseRuntime(undefined)).toBeNull();
        expect(parseRuntime('')).toBeNull();
      });

      it('should correctly parse any valid runtime string', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 1000 }), (minutes) => {
            const result = parseRuntime(`${minutes} min`);
            expect(result).toBe(minutes);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('parseGenres', () => {
      it('should return empty array for N/A or undefined', () => {
        expect(parseGenres('N/A')).toEqual([]);
        expect(parseGenres(undefined)).toEqual([]);
        expect(parseGenres('')).toEqual([]);
      });

      it('should correctly parse comma-separated genres', () => {
        fc.assert(
          fc.property(
            // Filter out strings that are empty after trimming (whitespace-only)
            fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(',') && s.trim().length > 0), { minLength: 1, maxLength: 5 }),
            (genreNames) => {
              const genreString = genreNames.join(', ');
              const result = parseGenres(genreString);

              // Should have same number of genres (all inputs are non-empty after trim)
              expect(result.length).toBe(genreNames.length);

              // Each genre should have id and name
              result.forEach((genre, index) => {
                expect(genre).toHaveProperty('id');
                expect(genre).toHaveProperty('name');
                expect(genre.name).toBe(genreNames[index].trim());
              });
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('parseVoteCount', () => {
      it('should return 0 for N/A or undefined', () => {
        expect(parseVoteCount('N/A')).toBe(0);
        expect(parseVoteCount(undefined)).toBe(0);
      });

      it('should correctly parse vote counts with commas', () => {
        fc.assert(
          fc.property(fc.integer({ min: 0, max: 10000000 }), (votes) => {
            const voteString = votes.toLocaleString();
            const result = parseVoteCount(voteString);
            expect(result).toBe(votes);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('parseRating', () => {
      it('should return null for N/A or undefined', () => {
        expect(parseRating('N/A')).toBeNull();
        expect(parseRating(undefined)).toBeNull();
      });

      it('should correctly parse valid rating strings', () => {
        fc.assert(
          fc.property(fc.float({ min: 0, max: 10, noNaN: true }), (rating) => {
            const ratingStr = rating.toFixed(1);
            const result = parseRating(ratingStr);
            expect(result).toBeCloseTo(parseFloat(ratingStr), 1);
          }),
          { numRuns: 100 }
        );
      });
    });

    describe('normalizePosterUrl', () => {
      it('should return null for N/A or undefined', () => {
        expect(normalizePosterUrl('N/A')).toBeNull();
        expect(normalizePosterUrl(undefined)).toBeNull();
      });

      it('should preserve valid URLs', () => {
        fc.assert(
          fc.property(fc.webUrl({ validSchemes: ['https'] }), (url) => {
            const result = normalizePosterUrl(url);
            expect(result).toBe(url);
          }),
          { numRuns: 50 }
        );
      });

      it('should return null for invalid URLs', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
              try {
                new URL(s);
                return false;
              } catch {
                return true;
              }
            }),
            (invalidUrl) => {
              const result = normalizePosterUrl(invalidUrl);
              expect(result).toBeNull();
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('mapMediaType', () => {
      it('should map movie to movie', () => {
        expect(mapMediaType('movie')).toBe('movie');
      });

      it('should map series to tv', () => {
        expect(mapMediaType('series')).toBe('tv');
      });

      it('should map episode to tv', () => {
        expect(mapMediaType('episode')).toBe('tv');
      });
    });
  });
});


// ============================================================================
// CAST DATA PARSING PROPERTY TESTS
// ============================================================================

import {
  parseCastString,
  parseDirectors,
  parseWriters,
  extractCastAndCrew,
  getCastMembers,
  getFullCredits,
  parseNameString,
  generateCastMemberId,
} from '@/services/api/omdb-mappers';

describe('Feature: omdb-api-integration, Property 8: Cast data parsing and extraction', () => {
  /**
   * Property 8: Cast data parsing and extraction
   * For any OMDb detail response containing cast information, the data mapper 
   * should parse comma-separated cast strings into structured CastMember arrays 
   * and handle limited cast information gracefully
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
   */

  // Generator for valid actor/director/writer names
  const nameGen = fc.string({ minLength: 2, maxLength: 30 })
    .filter(s => !s.includes(',') && s.trim().length > 0);

  // Generator for comma-separated name strings
  const nameStringGen = fc.array(nameGen, { minLength: 1, maxLength: 10 })
    .map(names => names.join(', '));

  // Generator for writer credits with optional credit type
  const writerCreditGen = fc.tuple(
    nameGen,
    fc.option(fc.constantFrom('screenplay', 'story', 'novel', 'characters'), { nil: undefined })
  ).map(([name, creditType]) => 
    creditType ? `${name} (${creditType})` : name
  );

  const writerStringGen = fc.array(writerCreditGen, { minLength: 1, maxLength: 5 })
    .map(credits => credits.join(', '));

  describe('parseCastString', () => {
    it('should parse any comma-separated actor string into CastMember array', () => {
      fc.assert(
        fc.property(nameStringGen, (actorsString) => {
          const result = parseCastString(actorsString);
          const expectedNames = actorsString.split(',').map(n => n.trim()).filter(n => n.length > 0);

          // Should have same number of cast members as names
          expect(result.length).toBe(expectedNames.length);

          // Each cast member should have required fields
          result.forEach((member, index) => {
            expect(member).toHaveProperty('id');
            expect(member).toHaveProperty('name');
            expect(member).toHaveProperty('character');
            expect(member).toHaveProperty('profilePath');
            expect(member).toHaveProperty('order');

            // ID should be a positive number
            expect(typeof member.id).toBe('number');
            expect(member.id).toBeGreaterThan(0);

            // Name should match input
            expect(member.name).toBe(expectedNames[index]);

            // Order should match index
            expect(member.order).toBe(index);

            // Character should be empty string (OMDb doesn't provide this)
            expect(member.character).toBe('');

            // Profile path should be null (OMDb doesn't provide this)
            expect(member.profilePath).toBeNull();
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array for N/A or undefined', () => {
      expect(parseCastString('N/A')).toEqual([]);
      expect(parseCastString(undefined)).toEqual([]);
      expect(parseCastString('')).toEqual([]);
    });

    it('should generate consistent IDs for the same actor name', () => {
      fc.assert(
        fc.property(nameGen, (name) => {
          const result1 = parseCastString(name);
          const result2 = parseCastString(name);

          expect(result1[0].id).toBe(result2[0].id);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('parseDirectors', () => {
    it('should parse any comma-separated director string with director role', () => {
      fc.assert(
        fc.property(nameStringGen, (directorString) => {
          const result = parseDirectors(directorString);
          const expectedNames = directorString.split(',').map(n => n.trim()).filter(n => n.length > 0);

          // Should have same number of directors as names
          expect(result.length).toBe(expectedNames.length);

          // Each director should have required fields
          result.forEach((director, index) => {
            expect(director).toHaveProperty('id');
            expect(director).toHaveProperty('name');
            expect(director).toHaveProperty('character');
            expect(director).toHaveProperty('profilePath');
            expect(director).toHaveProperty('order');
            expect(director).toHaveProperty('role');

            // Name should match input
            expect(director.name).toBe(expectedNames[index]);

            // Character should be 'Director'
            expect(director.character).toBe('Director');

            // Role should be 'director'
            expect(director.role).toBe('director');
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array for N/A or undefined', () => {
      expect(parseDirectors('N/A')).toEqual([]);
      expect(parseDirectors(undefined)).toEqual([]);
    });
  });

  describe('parseWriters', () => {
    it('should parse any comma-separated writer string with writer role', () => {
      fc.assert(
        fc.property(writerStringGen, (writerString) => {
          const result = parseWriters(writerString);

          // Each writer should have required fields
          result.forEach((writer) => {
            expect(writer).toHaveProperty('id');
            expect(writer).toHaveProperty('name');
            expect(writer).toHaveProperty('character');
            expect(writer).toHaveProperty('profilePath');
            expect(writer).toHaveProperty('order');
            expect(writer).toHaveProperty('role');

            // ID should be a positive number
            expect(typeof writer.id).toBe('number');
            expect(writer.id).toBeGreaterThan(0);

            // Name should not be empty
            expect(writer.name.length).toBeGreaterThan(0);

            // Role should be 'writer'
            expect(writer.role).toBe('writer');
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should extract credit type from parentheses', () => {
      const result = parseWriters('John Doe (screenplay), Jane Smith (story)');

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[0].character).toBe('screenplay');
      expect(result[1].name).toBe('Jane Smith');
      expect(result[1].character).toBe('story');
    });

    it('should use "Writer" as default credit type when not specified', () => {
      const result = parseWriters('John Doe');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('John Doe');
      expect(result[0].character).toBe('Writer');
    });

    it('should return empty array for N/A or undefined', () => {
      expect(parseWriters('N/A')).toEqual([]);
      expect(parseWriters(undefined)).toEqual([]);
    });
  });

  describe('extractCastAndCrew', () => {
    it('should extract all cast and crew from any valid OMDb detail response', () => {
      fc.assert(
        fc.property(
          fc.record({
            Actors: fc.oneof(fc.constant('N/A'), nameStringGen),
            Director: fc.oneof(fc.constant('N/A'), nameStringGen),
            Writer: fc.oneof(fc.constant('N/A'), writerStringGen),
          }),
          (partialDetail) => {
            const omdbDetail = {
              Title: 'Test Movie',
              Year: '2023',
              Rated: 'PG-13',
              Released: '01 Jan 2023',
              Runtime: '120 min',
              Genre: 'Action',
              Director: partialDetail.Director,
              Writer: partialDetail.Writer,
              Actors: partialDetail.Actors,
              Plot: 'Test plot',
              Language: 'English',
              Country: 'United States',
              Awards: 'N/A',
              Poster: 'N/A',
              Ratings: [],
              Metascore: 'N/A',
              imdbRating: '7.5',
              imdbVotes: '1,000',
              imdbID: 'tt1234567',
              Type: 'movie' as const,
              Response: 'True' as const,
            };

            const result = extractCastAndCrew(omdbDetail);

            // Should have all expected properties
            expect(result).toHaveProperty('actors');
            expect(result).toHaveProperty('directors');
            expect(result).toHaveProperty('writers');
            expect(result).toHaveProperty('allCast');

            // All arrays should be arrays
            expect(Array.isArray(result.actors)).toBe(true);
            expect(Array.isArray(result.directors)).toBe(true);
            expect(Array.isArray(result.writers)).toBe(true);
            expect(Array.isArray(result.allCast)).toBe(true);

            // allCast should contain all members
            expect(result.allCast.length).toBe(
              result.actors.length + result.directors.length + result.writers.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct ordering in allCast (directors, writers, actors)', () => {
      const omdbDetail = {
        Title: 'Test Movie',
        Year: '2023',
        Rated: 'PG-13',
        Released: '01 Jan 2023',
        Runtime: '120 min',
        Genre: 'Action',
        Director: 'Director One, Director Two',
        Writer: 'Writer One',
        Actors: 'Actor One, Actor Two, Actor Three',
        Plot: 'Test plot',
        Language: 'English',
        Country: 'United States',
        Awards: 'N/A',
        Poster: 'N/A',
        Ratings: [],
        Metascore: 'N/A',
        imdbRating: '7.5',
        imdbVotes: '1,000',
        imdbID: 'tt1234567',
        Type: 'movie' as const,
        Response: 'True' as const,
      };

      const result = extractCastAndCrew(omdbDetail);

      // Directors should come first
      expect(result.allCast[0].name).toBe('Director One');
      expect(result.allCast[1].name).toBe('Director Two');

      // Writers should come next
      expect(result.allCast[2].name).toBe('Writer One');

      // Actors should come last
      expect(result.allCast[3].name).toBe('Actor One');
      expect(result.allCast[4].name).toBe('Actor Two');
      expect(result.allCast[5].name).toBe('Actor Three');

      // Order should be sequential
      result.allCast.forEach((member, index) => {
        expect(member.order).toBe(index);
      });
    });
  });

  describe('getCastMembers', () => {
    it('should return only actors from OMDb detail response', () => {
      fc.assert(
        fc.property(nameStringGen, (actorsString) => {
          const omdbDetail = {
            Title: 'Test Movie',
            Year: '2023',
            Rated: 'PG-13',
            Released: '01 Jan 2023',
            Runtime: '120 min',
            Genre: 'Action',
            Director: 'Some Director',
            Writer: 'Some Writer',
            Actors: actorsString,
            Plot: 'Test plot',
            Language: 'English',
            Country: 'United States',
            Awards: 'N/A',
            Poster: 'N/A',
            Ratings: [],
            Metascore: 'N/A',
            imdbRating: '7.5',
            imdbVotes: '1,000',
            imdbID: 'tt1234567',
            Type: 'movie' as const,
            Response: 'True' as const,
          };

          const result = getCastMembers(omdbDetail);
          const expectedNames = actorsString.split(',').map(n => n.trim()).filter(n => n.length > 0);

          // Should have same number of cast members as actor names
          expect(result.length).toBe(expectedNames.length);

          // Each member should be an actor (no role property)
          result.forEach((member) => {
            expect(member.character).toBe('');
          });
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('getFullCredits', () => {
    it('should return all cast and crew from OMDb detail response', () => {
      const omdbDetail = {
        Title: 'Test Movie',
        Year: '2023',
        Rated: 'PG-13',
        Released: '01 Jan 2023',
        Runtime: '120 min',
        Genre: 'Action',
        Director: 'Director One',
        Writer: 'Writer One',
        Actors: 'Actor One, Actor Two',
        Plot: 'Test plot',
        Language: 'English',
        Country: 'United States',
        Awards: 'N/A',
        Poster: 'N/A',
        Ratings: [],
        Metascore: 'N/A',
        imdbRating: '7.5',
        imdbVotes: '1,000',
        imdbID: 'tt1234567',
        Type: 'movie' as const,
        Response: 'True' as const,
      };

      const result = getFullCredits(omdbDetail);

      // Should include director, writer, and actors
      expect(result.length).toBe(4);
      expect(result.map(m => m.name)).toContain('Director One');
      expect(result.map(m => m.name)).toContain('Writer One');
      expect(result.map(m => m.name)).toContain('Actor One');
      expect(result.map(m => m.name)).toContain('Actor Two');
    });
  });

  describe('parseNameString', () => {
    it('should correctly parse any comma-separated string', () => {
      fc.assert(
        fc.property(
          fc.array(nameGen, { minLength: 0, maxLength: 10 }),
          (names) => {
            const nameString = names.join(', ');
            const result = parseNameString(nameString);

            // Should have same number of names
            expect(result.length).toBe(names.length);

            // Each name should be trimmed
            result.forEach((name, index) => {
              expect(name).toBe(names[index].trim());
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for N/A, undefined, or empty string', () => {
      expect(parseNameString('N/A')).toEqual([]);
      expect(parseNameString(undefined)).toEqual([]);
      expect(parseNameString('')).toEqual([]);
      expect(parseNameString('   ')).toEqual([]);
    });
  });

  describe('generateCastMemberId', () => {
    it('should generate consistent IDs for the same name', () => {
      fc.assert(
        fc.property(nameGen, (name) => {
          const id1 = generateCastMemberId(name);
          const id2 = generateCastMemberId(name);

          expect(id1).toBe(id2);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate positive numeric IDs', () => {
      fc.assert(
        fc.property(nameGen, (name) => {
          const id = generateCastMemberId(name);

          expect(typeof id).toBe('number');
          expect(id).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive', () => {
      fc.assert(
        fc.property(nameGen, (name) => {
          const idLower = generateCastMemberId(name.toLowerCase());
          const idUpper = generateCastMemberId(name.toUpperCase());

          expect(idLower).toBe(idUpper);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Graceful handling of limited cast information', () => {
    it('should handle responses with only actors', () => {
      const omdbDetail = {
        Title: 'Test Movie',
        Year: '2023',
        Rated: 'PG-13',
        Released: '01 Jan 2023',
        Runtime: '120 min',
        Genre: 'Action',
        Director: 'N/A',
        Writer: 'N/A',
        Actors: 'Actor One, Actor Two',
        Plot: 'Test plot',
        Language: 'English',
        Country: 'United States',
        Awards: 'N/A',
        Poster: 'N/A',
        Ratings: [],
        Metascore: 'N/A',
        imdbRating: '7.5',
        imdbVotes: '1,000',
        imdbID: 'tt1234567',
        Type: 'movie' as const,
        Response: 'True' as const,
      };

      const result = extractCastAndCrew(omdbDetail);

      expect(result.actors.length).toBe(2);
      expect(result.directors.length).toBe(0);
      expect(result.writers.length).toBe(0);
      expect(result.allCast.length).toBe(2);
    });

    it('should handle responses with no cast information', () => {
      const omdbDetail = {
        Title: 'Test Movie',
        Year: '2023',
        Rated: 'PG-13',
        Released: '01 Jan 2023',
        Runtime: '120 min',
        Genre: 'Action',
        Director: 'N/A',
        Writer: 'N/A',
        Actors: 'N/A',
        Plot: 'Test plot',
        Language: 'English',
        Country: 'United States',
        Awards: 'N/A',
        Poster: 'N/A',
        Ratings: [],
        Metascore: 'N/A',
        imdbRating: '7.5',
        imdbVotes: '1,000',
        imdbID: 'tt1234567',
        Type: 'movie' as const,
        Response: 'True' as const,
      };

      const result = extractCastAndCrew(omdbDetail);

      expect(result.actors.length).toBe(0);
      expect(result.directors.length).toBe(0);
      expect(result.writers.length).toBe(0);
      expect(result.allCast.length).toBe(0);
    });
  });
});
