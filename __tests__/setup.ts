/**
 * Jest setup file for MovieStream MVP
 * Configures fast-check for property-based testing and React Native mocks
 */

import * as fc from 'fast-check';

// Configure fast-check defaults for property-based testing
// Minimum 100 iterations per property test as per design requirements
fc.configureGlobal({
  numRuns: 100,
  verbose: false,
});

// Mock React Native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios || options.default),
  },
}));

// Export fast-check for use in tests
export { fc };
