module.exports = {
  bail: 1,

  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.js', '!**/node_modules/**'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',

  errorOnDeprecated: true,

  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/?(*.)+(test).js'],
  testPathIgnorePatterns: ['/node_modules/'],

  verbose: true,
  watchman: false
}
