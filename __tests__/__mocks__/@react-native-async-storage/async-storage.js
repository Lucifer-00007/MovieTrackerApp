/**
 * Mock for @react-native-async-storage/async-storage
 */

let store = {};

const AsyncStorage = {
  getItem: jest.fn((key) => {
    return Promise.resolve(store[key] || null);
  }),
  setItem: jest.fn((key, value) => {
    store[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete store[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    store = {};
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Object.keys(store));
  }),
  multiGet: jest.fn((keys) => {
    return Promise.resolve(keys.map((key) => [key, store[key] || null]));
  }),
  multiSet: jest.fn((keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => {
      store[key] = value;
    });
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((key) => {
      delete store[key];
    });
    return Promise.resolve();
  }),
  // Helper to reset the mock store between tests
  __resetStore: () => {
    store = {};
  },
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
