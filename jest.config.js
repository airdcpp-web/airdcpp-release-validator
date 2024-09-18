// Sync object
const config = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
    // "node_modules/node-fetch/.+\\.(j|t)sx?$": "ts-jest"
  },
  moduleDirectories: ['src', 'node_modules'],
  testEnvironment: 'node',
  moduleFileExtensions: [
    'js',
    'ts',
    'json'
  ],
  transformIgnorePatterns: [
    '<rootDir>\/node_modules\/(?!node\\-fetch)\/'
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
