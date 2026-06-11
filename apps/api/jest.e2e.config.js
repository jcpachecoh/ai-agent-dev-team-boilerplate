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
    // Stub — replaces the real email package (BullMQ + React Email) with a
    // no-op so AppModule boots without Redis in e2e tests.
    '^@restopsiq/email(.*)$': '<rootDir>/test/__mocks__/restopsiq-email.ts',
    '^@restopsiq/types(.*)$': '<rootDir>/../../packages/types/src$1',
    '^@restopsiq/utils(.*)$': '<rootDir>/../../packages/utils/src$1',
  },

  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: { importHelpers: true, jsx: 'react-jsx' },
      },
    ],
  },

  // Give integration tests a longer timeout (DB, HTTP calls)
  testTimeout: 30000,
  clearMocks: true,

  // ── Global setup — mocks Redis/BullMQ/Redlock before AppModule loads ────────
  setupFilesAfterEnv: ['<rootDir>/test/jest.e2e.setup.ts'],
};
