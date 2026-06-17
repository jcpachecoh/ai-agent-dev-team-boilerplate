/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  // ── E2E test discovery ────────────────────────────────────────────────────
  testRegex: '.*\\.e2e-spec\\.ts$',
  testPathPattern: 'test/',

  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts', '!src/main.ts'],
  coverageDirectory: './coverage/e2e',

  // ── Module path aliases ───────────────────────────────────────────────────
  moduleNameMapper: {
    '^@restopsiq/types(.*)$': '<rootDir>/../../packages/types/src$1',
    '^@restopsiq/utils(.*)$': '<rootDir>/../../packages/utils/src$1',
  },

  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },

  // Give integration tests a longer timeout (DB, HTTP calls)
  testTimeout: 30000,
  clearMocks: true,
};
