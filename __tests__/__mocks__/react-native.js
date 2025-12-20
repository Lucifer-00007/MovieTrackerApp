/**
 * React Native mock for Jest tests
 */

module.exports = {
  Platform: {
    OS: 'ios',
    select: jest.fn((options) => options.ios || options.default),
  },
};