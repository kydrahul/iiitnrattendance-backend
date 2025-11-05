const mockComponent = (componentName) => {
  const component = jest.fn(({ children, ...props }) => ({
    type: componentName,
    props: {
      ...props,
      children,
    },
  }));
  component.displayName = componentName;
  return component;
};

// Ensure the NativeModules require returns an object with a `.default` property
// so that `jest-expo`'s setup (which calls require(...).default) doesn't get
// `undefined`. We avoid mocking the whole `react-native` module here.
try {
  // Load the actual native modules and expose them as an ES module default
  const actualNativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');
  // Ensure SourceCode TurboModule is present (used by Expo runtime)
  if (actualNativeModules && !actualNativeModules.SourceCode) {
    try {
      actualNativeModules.SourceCode = {
        scriptURL: 'mock://app.bundle',
        fullSourceMappingURL: null,
        sourceURL: 'mock://app.bundle',
      };
    } catch (e) {
      // ignore
    }
  }
  jest.doMock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
    __esModule: true,
    default: actualNativeModules,
  }));
} catch (e) {
  // If the module can't be found, continue — jest-expo will optionally handle it.
}

// Shim TurboModuleRegistry to provide a SourceCode module for Expo runtime.
// Provide `get`, `getEnforcing` and `getOptional` so modules that call any of
// these APIs won't throw during setup.
try {
  jest.doMock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
    const registry = {
      get: (name) => {
        if (name === 'SourceCode') {
          return { getConstants: () => ({ scriptURL: 'mock://bundle' }) };
        }
        // Provide a minimal PlatformConstants shim used by some RN internals
        if (name === 'PlatformConstants' || name === 'PlatformConstantsIOS' || name === 'PlatformConstantsAndroid') {
          return { getConstants: () => ({ reactNativeVersion: { major: 0, minor: 0, patch: 0 }, osVersion: '0.0' }) };
        }
        // Default fallback: return an object with getConstants so callers don't throw
        return { getConstants: () => ({}) };
      },
      getEnforcing: (name) => {
        const mod = registry.get(name);
        if (mod) return mod;
        throw new Error(`TurboModule ${name} not found`);
      },
      getOptional: (name) => registry.get(name),
    };
    return registry;
  });
} catch (e) {
  // ignore
}

// Mock Dimensions to provide window/screen sizes used by components
try {
  jest.doMock('react-native/Libraries/Utilities/Dimensions', () => ({
    get: jest.fn().mockImplementation((dim) => {
      if (dim === 'window' || dim === 'screen') {
        return { width: 375, height: 812, scale: 2, fontScale: 1 };
      }
      return { width: 375, height: 812 };
    }),
    set: jest.fn(),
  }));
} catch (e) {
  // ignore
}

// Ensure the top-level 'react-native' module exposes Dimensions.get for imports
try {
  // Avoid mocking the top-level 'react-native' module here; jest-expo and
  // react-native's own jest setup provide stable mocks. We keep internal
  // module shims (like Dimensions) above.
} catch (e) {
  // ignore
}

// Mock globals required by React Native
if (typeof window === 'undefined') {
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
}

// Mock timer functions
jest.useFakeTimers();
// Note: avoid mocking the entire `react-native` module here. jest-expo and
// react-native's own setup expect to initialize NativeModules and other
// internals. Keep targeted mocks small and let jest-expo provide the
// baseline mocks for react-native.

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
}));