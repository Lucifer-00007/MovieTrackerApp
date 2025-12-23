/**
 * Property-based tests for API configuration validation
 * Feature: omdb-api-integration, Property 11: Configuration validation
 * **Validates: Requirements 8.3, 8.5**
 */

import fc from 'fast-check';

describe('API Service - Configuration Validation', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * Property 11: Configuration validation
   * For any OMDb configuration setup, the system should validate that required environment variables 
   * are present and provide clear error messages when configuration is incomplete
   * **Validates: Requirements 8.3, 8.5**
   */
  test('should validate OMDb API key presence and format', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined), // Missing API key
          fc.constant(''), // Empty string
          fc.constant('   '), // Whitespace only
          fc.string({ maxLength: 7 }), // Too short
          fc.string({ minLength: 1, maxLength: 7 }).map(s => s.trim() === '' ? 'x' : s) // Ensure non-empty but short
        ),
        (invalidApiKey) => {
          // Set up environment with invalid API key
          if (invalidApiKey !== undefined) {
            process.env.EXPO_PUBLIC_OMDB_API_KEY = invalidApiKey;
          } else {
            delete process.env.EXPO_PUBLIC_OMDB_API_KEY;
          }

          // Import validation function
          const { validateProviderConfig } = require('../../../services/api');

          // Should throw error for invalid configuration
          expect(() => validateProviderConfig('omdb')).toThrow();
          
          // Verify error message contains helpful information
          try {
            validateProviderConfig('omdb');
            fail('Expected validation to throw an error');
          } catch (error) {
            const err = error as Error;
            expect(err.message).toContain('OMDb API configuration error');
            expect(err.message).toContain('EXPO_PUBLIC_OMDB_API_KEY');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should accept valid OMDb API keys', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 50 }).filter(s => s.trim().length >= 8),
        (validApiKey) => {
          // Set up environment with valid API key
          process.env.EXPO_PUBLIC_OMDB_API_KEY = validApiKey;

          // Import validation function
          const { validateProviderConfig } = require('../../../services/api');

          // Should not throw error for valid configuration
          expect(() => validateProviderConfig('omdb')).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should not validate configuration for non-OMDb providers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('tmdb', 'mock'),
        fc.oneof(
          fc.constant(undefined),
          fc.constant(''),
          fc.string({ maxLength: 7 })
        ),
        (provider, invalidApiKey) => {
          // Set up environment with invalid OMDb API key but different provider
          if (invalidApiKey !== undefined) {
            process.env.EXPO_PUBLIC_OMDB_API_KEY = invalidApiKey;
          } else {
            delete process.env.EXPO_PUBLIC_OMDB_API_KEY;
          }

          // Import validation function
          const { validateProviderConfig } = require('../../../services/api');

          // Should not throw error for non-OMDb providers
          expect(() => validateProviderConfig(provider)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should provide clear error messages for missing API key', () => {
    // Remove API key
    delete process.env.EXPO_PUBLIC_OMDB_API_KEY;

    // Import validation function
    const { validateProviderConfig } = require('../../../services/api');

    try {
      validateProviderConfig('omdb');
      fail('Expected validation to throw an error');
    } catch (error) {
      const err = error as Error;
      // Verify error message is clear and helpful
      expect(err.message).toContain('EXPO_PUBLIC_OMDB_API_KEY is required');
      expect(err.message).toContain('when using OMDb provider');
      expect(err.message).toContain('environment variables');
    }
  });

  test('should provide clear error messages for invalid API key format', () => {
    // Set invalid API key (too short)
    process.env.EXPO_PUBLIC_OMDB_API_KEY = 'short';

    // Import validation function
    const { validateProviderConfig } = require('../../../services/api');

    try {
      validateProviderConfig('omdb');
      fail('Expected validation to throw an error');
    } catch (error) {
      const err = error as Error;
      // Verify error message is clear and helpful
      expect(err.message).toContain('EXPO_PUBLIC_OMDB_API_KEY appears to be invalid');
      expect(err.message).toContain('check your API key');
      expect(err.message).toContain('omdbapi.com');
    }
  });

  test('should handle environment variable edge cases', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty string
          fc.constant('   '), // Only whitespace
          fc.constant('\t\n'), // Tabs and newlines
          fc.constant('1234567'), // Exactly 7 characters (boundary)
          fc.constant('12345678'), // Exactly 8 characters (valid boundary)
        ),
        (edgeCaseValue) => {
          process.env.EXPO_PUBLIC_OMDB_API_KEY = edgeCaseValue;

          // Import validation function
          const { validateProviderConfig } = require('../../../services/api');

          if (edgeCaseValue.trim().length >= 8) {
            // Should pass validation
            expect(() => validateProviderConfig('omdb')).not.toThrow();
          } else {
            // Should fail validation
            expect(() => validateProviderConfig('omdb')).toThrow();
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});