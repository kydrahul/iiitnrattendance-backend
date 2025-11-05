// Minimal pre-init setup for Jest: only provide the SourceCode TurboModule
// that Expo's runtime expects during initialization. This file must be
// listed in `setupFiles` so it runs before any React Native or Expo modules
// are loaded.

// Mock AsyncStorage with in-memory storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    const value = mockStorage.get(key);
    return Promise.resolve(value);
  }),
  removeItem: jest.fn((key) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockStorage.clear();
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map(key => [key, mockStorage.get(key)]))),
  multiSet: jest.fn((keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => mockStorage.set(key, value));
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach(key => mockStorage.delete(key));
    return Promise.resolve();
  }),
}));

// Mock AsyncStorage with in-memory storage
const mockStorage = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    const value = mockStorage.get(key);
    return Promise.resolve(value);
  }),
  removeItem: jest.fn((key) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockStorage.clear();
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map(key => [key, mockStorage.get(key)]))),
  multiSet: jest.fn((keyValuePairs) => {
    keyValuePairs.forEach(([key, value]) => mockStorage.set(key, value));
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach(key => mockStorage.delete(key));
    return Promise.resolve();
  }),
}));

try {
  jest.doMock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
    get: (name) => {
      if (name === 'SourceCode') {
        return { getConstants: () => ({ scriptURL: 'mock://app.bundle' }) };
      }
      return null;
    },
    getEnforcing: (name) => {
      if (name === 'SourceCode') return { getConstants: () => ({ scriptURL: 'mock://app.bundle' }) };
      if (name === 'DeviceInfo') return { 
        getConstants: () => ({ 
          Dimensions: { 
            window: { width: 375, height: 812, scale: 1, fontScale: 1 },
            screen: { width: 375, height: 812, scale: 1, fontScale: 1 }
          }
        })
      };
      if (name === 'PlatformConstants') return {
        getConstants: () => ({
          isTesting: true,
          reactNativeVersion: { major: 0, minor: 71, patch: 0 },
          forceTouchAvailable: false,
          osVersion: '14.0',
          systemName: 'iOS',
          interfaceIdiom: 'phone',
          platform: 'ios',
        })
      };
      throw new Error(`TurboModule ${name} not found`);
    },
    getOptional: (name) => (name === 'SourceCode' ? { getConstants: () => ({ scriptURL: 'mock://app.bundle' }) } : null),
  }));
} catch (e) {
  // ignore; if mocking fails, tests will surface more specific errors
}