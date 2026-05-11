/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',

  // ── Test discovery ────────────────────────────────────────────────────────
  testRegex: '.*\\.spec\\.ts$',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/main.ts',
    '!**/__mocks__/**',
  ],

  // ── Coverage thresholds (must maintain ≥80%) ─────────────────────────────
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
    '^@restopsiq/types(.*)$': '<rootDir>/../../packages/types/src$1',
    '^@restopsiq/utils(.*)$': '<rootDir>/../../packages/utils/src$1',
  },

  // ── ts-jest config ────────────────────────────────────────────────────────
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },

  // ── Setup ─────────────────────────────────────────────────────────────────
  setupFilesAfterFramework: [],
  clearMocks: true,
  restoreMocks: true,
};
