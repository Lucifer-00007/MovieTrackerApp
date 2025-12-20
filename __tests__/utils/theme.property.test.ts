/**
 * Property-based tests for theme color contrast compliance
 * Feature: moviestream-mvp, Property 23: Color Contrast Compliance
 * Validates: Requirements 9.5
 */

import * as fc from 'fast-check';
import {
  Colors,
  TextColorPairs,
  MIN_CONTRAST_RATIO,
  getContrastRatio,
} from '../../constants/colors';

describe('Theme Color Contrast Compliance', () => {
  /**
   * Property 23: Color Contrast Compliance
   * For any text/background color pair in both light and dark themes,
   * the contrast ratio SHALL be at least 4.5:1.
   */
  describe('Property 23: Color Contrast Compliance', () => {
    it('all light theme text/background pairs have at least 4.5:1 contrast ratio', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TextColorPairs.light),
          (colorPair) => {
            const ratio = getContrastRatio(colorPair.foreground, colorPair.background);
            expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
            return ratio >= MIN_CONTRAST_RATIO;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all dark theme text/background pairs have at least 4.5:1 contrast ratio', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TextColorPairs.dark),
          (colorPair) => {
            const ratio = getContrastRatio(colorPair.foreground, colorPair.background);
            expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
            return ratio >= MIN_CONTRAST_RATIO;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('primary text on primary background maintains contrast in light mode', () => {
      const ratio = getContrastRatio(Colors.light.text, Colors.light.background);
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    });

    it('primary text on primary background maintains contrast in dark mode', () => {
      const ratio = getContrastRatio(Colors.dark.text, Colors.dark.background);
      expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    });

    it('secondary text maintains contrast in both themes', () => {
      const lightRatio = getContrastRatio(
        Colors.light.textSecondary,
        Colors.light.background
      );
      const darkRatio = getContrastRatio(
        Colors.dark.textSecondary,
        Colors.dark.background
      );

      expect(lightRatio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
      expect(darkRatio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    });

    it('muted text maintains minimum contrast in both themes', () => {
      const lightRatio = getContrastRatio(
        Colors.light.textMuted,
        Colors.light.background
      );
      const darkRatio = getContrastRatio(
        Colors.dark.textMuted,
        Colors.dark.background
      );

      expect(lightRatio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
      expect(darkRatio).toBeGreaterThanOrEqual(MIN_CONTRAST_RATIO);
    });
  });
});
