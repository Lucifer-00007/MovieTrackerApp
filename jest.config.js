/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx', '**/*.property.test.ts', '**/*.property.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    // Mock image imports first (before path alias resolution)
    '^@/assets/images/(.*)\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
    // Path alias
    '^@/(.*)$': '<rootDir>/$1',
    // React Native mocks
    '^react-native$': '<rootDir>/__tests__/__mocks__/react-native.js',
    '^@react-native-community/netinfo$': '<rootDir>/__tests__/__mocks__/@react-native-community/netinfo.js',
    // Generic image file mock (for non-aliased paths)
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community)/)',
  ],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'stores/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  // Improve test isolation - only clear mocks, don't reset implementations
  clearMocks: true,
};
