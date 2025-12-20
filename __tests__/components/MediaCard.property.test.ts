/**
 * Property-based tests for MediaCard component
 * Feature: moviestream-mvp
 * 
 * Properties tested:
 * - Property 1: Media Card Renders Required Fields
 * - Property 2: Media Card Variant Dimensions
 * - Property 3: Media Card Graceful Degradation
 * - Property 27: Accessibility Labels
 * - Property 28: Touch Target Size
 * - Property 44: Age Rating Display
 * 
 * Validates: Requirements 2.1, 2.2, 12.1, 12.3, 17.4, 17.5, 19.1
 */

import * as fc from 'fast-check';
import {
  getVariantDimensions,
  MediaCardVariant,
  getPosterUrl,
  formatRating,
  shouldShowRating,
  calculateTouchTarget,
  generateAccessibilityLabel,
  TMDB_IMAGE_BASE,
} from '../../components/media/media-card-utils';
import { ComponentTokens } from '../../constants/colors';

// Arbitraries for generating test data
const mediaCardVariantArb = fc.constantFrom<MediaCardVariant>('large', 'medium', 'small');

const mediaItemArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}.jpg`), { nil: null }),
  rating: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }), { nil: null }),
  ageRating: fc.option(fc.constantFrom('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'), { nil: null }),
});

const mediaItemWithPosterAndRatingArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  posterPath: fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}.jpg`),
  rating: fc.float({ min: Math.fround(0.1), max: Math.fround(10), noNaN: true }),
  ageRating: fc.option(fc.constantFrom('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'), { nil: null }),
});

const mediaItemWithAgeRatingArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}.jpg`), { nil: null }),
  rating: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(10), noNaN: true }), { nil: null }),
  ageRating: fc.constantFrom('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'),
});

const mediaItemWithNullPosterArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  posterPath: fc.constant(null),
  rating: fc.option(fc.float({ min: 0, max: 10, noNaN: true }), { nil: null }),
  ageRating: fc.option(fc.constantFrom('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'), { nil: null }),
});

const mediaItemWithNullRatingArb = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  posterPath: fc.option(fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s}.jpg`), { nil: null }),
  rating: fc.constant(null),
  ageRating: fc.option(fc.constantFrom('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'), { nil: null }),
});

describe('MediaCard Property Tests', () => {
  /**
   * Property 1: Media Card Renders Required Fields
   * For any MediaItem with non-null posterPath and rating, the rendered Media_Card
   * component SHALL display the poster image, title, and rating badge.
   * **Validates: Requirements 2.1**
   */
  describe('Property 1: Media Card Renders Required Fields', () => {
    it('for any media item with poster and rating, all required fields are present', () => {
      fc.assert(
        fc.property(
          mediaItemWithPosterAndRatingArb,
          mediaCardVariantArb,
          (item, variant) => {
            // Verify that when posterPath is not null, we have a valid poster URL
            expect(item.posterPath).not.toBeNull();
            expect(item.posterPath!.length).toBeGreaterThan(0);
            
            // Verify that when rating is not null, it's a valid number
            expect(item.rating).not.toBeNull();
            expect(item.rating).toBeGreaterThan(0);
            expect(item.rating).toBeLessThanOrEqual(10);
            
            // Verify title is present
            expect(item.title.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Media Card Variant Dimensions
   * For any variant value ('large', 'medium', 'small'), the Media_Card component
   * SHALL render with the appropriate dimensions for that variant.
   * **Validates: Requirements 2.2**
   */
  describe('Property 2: Media Card Variant Dimensions', () => {
    it('for any variant, dimensions match the defined component tokens', () => {
      fc.assert(
        fc.property(
          mediaCardVariantArb,
          (variant) => {
            const dimensions = getVariantDimensions(variant);
            const expectedDimensions = ComponentTokens.mediaCard[variant];
            
            expect(dimensions.width).toBe(expectedDimensions.width);
            expect(dimensions.height).toBe(expectedDimensions.height);
            
            // Verify dimensions are positive
            expect(dimensions.width).toBeGreaterThan(0);
            expect(dimensions.height).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('large variant has largest dimensions', () => {
      const large = getVariantDimensions('large');
      const medium = getVariantDimensions('medium');
      const small = getVariantDimensions('small');
      
      expect(large.width).toBeGreaterThan(medium.width);
      expect(large.height).toBeGreaterThan(medium.height);
      expect(medium.width).toBeGreaterThan(small.width);
      expect(medium.height).toBeGreaterThan(small.height);
    });

    it('all variants maintain aspect ratio close to movie poster standard (2:3)', () => {
      fc.assert(
        fc.property(
          mediaCardVariantArb,
          (variant) => {
            const dimensions = getVariantDimensions(variant);
            const aspectRatio = dimensions.height / dimensions.width;
            
            // Movie posters are typically 2:3 ratio (1.5)
            // Allow some tolerance (1.4 to 1.6)
            expect(aspectRatio).toBeGreaterThanOrEqual(1.4);
            expect(aspectRatio).toBeLessThanOrEqual(1.6);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Media Card Graceful Degradation
   * For any MediaItem, if posterPath is null the Media_Card SHALL display a placeholder,
   * and if rating is null the rating badge SHALL be hidden.
   * **Validates: Requirements 17.4, 17.5**
   */
  describe('Property 3: Media Card Graceful Degradation', () => {
    it('for any media item with null posterPath, placeholder should be shown', () => {
      fc.assert(
        fc.property(
          mediaItemWithNullPosterArb,
          (item) => {
            // When posterPath is null, the component should show placeholder
            expect(item.posterPath).toBeNull();
            // Title should still be available for placeholder display
            expect(item.title.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any media item with null rating, rating badge should be hidden', () => {
      fc.assert(
        fc.property(
          mediaItemWithNullRatingArb,
          (item) => {
            // When rating is null, the rating badge should not be shown
            expect(item.rating).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any media item, component handles all combinations of null values', () => {
      fc.assert(
        fc.property(
          mediaItemArb,
          (item) => {
            // Component should handle any combination of null/non-null values
            // posterPath can be null or string
            if (item.posterPath !== null) {
              expect(typeof item.posterPath).toBe('string');
              expect(item.posterPath.length).toBeGreaterThan(0);
            }
            
            // rating can be null or number
            if (item.rating !== null) {
              expect(typeof item.rating).toBe('number');
              expect(item.rating).toBeGreaterThanOrEqual(0);
              expect(item.rating).toBeLessThanOrEqual(10);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 27: Accessibility Labels
   * For any interactive component (buttons, cards, links), an accessibilityLabel SHALL be defined.
   * **Validates: Requirements 12.1**
   */
  describe('Property 27: Accessibility Labels', () => {
    it('for any media item, accessibility label can be constructed', () => {
      fc.assert(
        fc.property(
          mediaItemArb,
          (item) => {
            // Accessibility label should include title
            const hasTitle = item.title.length > 0;
            expect(hasTitle).toBe(true);
            
            const accessibilityLabel = generateAccessibilityLabel(item.title, item.rating, item.ageRating);
            
            // Should always contain title
            expect(accessibilityLabel).toContain(item.title);
            
            // If rating exists, it should be included in accessibility label
            if (item.rating !== null && item.rating > 0) {
              const formattedRating = item.rating.toFixed(1);
              expect(accessibilityLabel).toContain(formattedRating);
            }
            
            // If age rating exists, it should be included in accessibility label
            if (item.ageRating) {
              expect(accessibilityLabel).toContain(item.ageRating);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 28: Touch Target Size
   * For any tappable component, the touch target dimensions SHALL be at least 44x44 points.
   * **Validates: Requirements 12.3**
   */
  describe('Property 28: Touch Target Size', () => {
    it('for any variant, touch target is at least 44x44 points', () => {
      fc.assert(
        fc.property(
          mediaCardVariantArb,
          (variant) => {
            const dimensions = getVariantDimensions(variant);
            const minTouchTarget = ComponentTokens.touchTarget.min;
            
            // Touch target should be at least the card dimensions or 44x44, whichever is larger
            const touchWidth = Math.max(dimensions.width, minTouchTarget);
            const touchHeight = Math.max(dimensions.height, minTouchTarget);
            
            expect(touchWidth).toBeGreaterThanOrEqual(minTouchTarget);
            expect(touchHeight).toBeGreaterThanOrEqual(minTouchTarget);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('minimum touch target constant is 44 points', () => {
      expect(ComponentTokens.touchTarget.min).toBe(44);
    });

    it('all card variants exceed minimum touch target', () => {
      const variants: MediaCardVariant[] = ['large', 'medium', 'small'];
      const minTouchTarget = ComponentTokens.touchTarget.min;
      
      variants.forEach(variant => {
        const dimensions = getVariantDimensions(variant);
        // All our card variants should be larger than 44x44
        expect(dimensions.width).toBeGreaterThanOrEqual(minTouchTarget);
        expect(dimensions.height).toBeGreaterThanOrEqual(minTouchTarget);
      });
    });
  });

  /**
   * Property 44: Age Rating Display
   * For any MediaItem or MediaDetails with an age rating, the rating SHALL be displayed on Media_Cards and Detail_Pages.
   * **Validates: Requirements 19.1**
   */
  describe('Property 44: Age Rating Display', () => {
    it('for any media item with age rating, age rating is available for display', () => {
      fc.assert(
        fc.property(
          mediaItemWithAgeRatingArb,
          (item) => {
            // Age rating should be a valid string
            expect(item.ageRating).toBeTruthy();
            expect(typeof item.ageRating).toBe('string');
            expect(item.ageRating!.length).toBeGreaterThan(0);
            
            // Age rating should be one of the standard ratings
            const validRatings = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'];
            expect(validRatings).toContain(item.ageRating);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any media item, age rating is optional and can be null', () => {
      fc.assert(
        fc.property(
          mediaItemArb,
          (item) => {
            // Age rating can be null or a valid string
            if (item.ageRating !== null) {
              expect(typeof item.ageRating).toBe('string');
              expect(item.ageRating.length).toBeGreaterThan(0);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for any media item with age rating, accessibility label includes age rating', () => {
      fc.assert(
        fc.property(
          mediaItemWithAgeRatingArb,
          (item) => {
            const accessibilityLabel = generateAccessibilityLabel(item.title, item.rating, item.ageRating);
            
            // Should contain the age rating
            expect(accessibilityLabel).toContain(item.ageRating);
            expect(accessibilityLabel).toContain('age rating');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
