module.exports = {
  preset: 'jest-expo',
  // Run a minimal pre-init setup to register TurboModules needed by Expo
  // before React Native loads (SourceCode TurboModule). Keep no afterEnv setup.
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(@?react-native.*|react-native.*|@react-native-community.*|@expo.*|expo.*|@unimodules.*|unimodules.*|sentry-expo.*|native-base.*|react-native-svg.*|react-native-reanimated.*))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  testPathIgnorePatterns: ['\\.snap$', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
  verbose: true,
  globals: {
    'ts-jest': {
      babelConfig: true,
      tsconfig: 'tsconfig.test.json',
    },
  },
};