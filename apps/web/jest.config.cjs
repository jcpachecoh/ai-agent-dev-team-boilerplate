/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: 'src',

  // ── Test discovery ────────────────────────────────────────────────────────
  testRegex: '.*\\.(test|spec)\\.(ts|tsx)$',

  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.d.ts', '!**/index.ts', '!**/__mocks__/**'],

  // ── Coverage thresholds ───────────────────────────────────────────────────
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: '../coverage/unit',
  coverageReporters: ['text', 'lcov', 'clover'],

  // ── Module path aliases ───────────────────────────────────────────────────
  moduleNameMapper: {
    // Handle CSS/SCSS modules
    '\\.module\\.(css|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(css|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    // Workspace packages
    '^@restopsiq/ui(.*)$': '<rootDir>/../../packages/ui/src$1',
    '^@restopsiq/types(.*)$': '<rootDir>/../../packages/types/src$1',
    '^@restopsiq/utils(.*)$': '<rootDir>/../../packages/utils/src$1',
    '^@restopsiq/api-client(.*)$': '<rootDir>/../../packages/api-client/src$1',
  },

  // ── Transform ─────────────────────────────────────────────────────────────
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
        jsx: 'react-jsx',
      },
    ],
  },

  // ── Setup files ───────────────────────────────────────────────────────────
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  clearMocks: true,
  restoreMocks: true,
};
