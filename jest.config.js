// Sync object
const config = {
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  testEnvironment: 'node',
  moduleFileExtensions: [
    'js',
    'ts',
    'json'
  ],
  moduleNameMapper: {
    '(src/.*)$': '<rootDir>/$1'
  },
  modulePaths: [
    '<rootDir>/src/',
    '<rootDir>/tests/'
  ],
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  coverageDirectory: './coverage/',
  coveragePathIgnorePatterns: [
    '/dist/',
    '/node_modules/',
    '/tests/'
  ],
  collectCoverage: true,
};

module.exports = config;
