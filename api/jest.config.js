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
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/types/**',
    '!src/lib/aws.ts',
    '!src/routes/chat.ts',
    '!src/routes/documents.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 30,
      branches: 25,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
}

export default config
