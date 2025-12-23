/**
 * Mock for @react-native-community/netinfo
 */

const NetInfo = {
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: {
      isConnectionExpensive: false,
    },
  }),
  addEventListener: jest.fn().mockReturnValue(() => {}),
  useNetInfo: jest.fn().mockReturnValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
  configure: jest.fn(),
  refresh: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
};

module.exports = NetInfo;
module.exports.default = NetInfo;
