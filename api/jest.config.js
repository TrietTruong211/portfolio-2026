/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  testMatch: ['**/*.test.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
}

export default config
