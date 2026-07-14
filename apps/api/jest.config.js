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
    '!**/*.controller.ts', // Controllers are tested via *.controller.spec.ts but have no logic branches
    '!**/*.resolver.ts', // GraphQL resolvers are thin adapters — tested via *.resolver.spec.ts
    '!**/*.dto.ts',
    '!**/controller/dto/**', // Swagger/OpenAPI declaration classes (no runtime logic)
    '!**/*.entity.ts',
    '!**/*.interface.ts',
    '!**/main.ts',
    '!**/__mocks__/**',
    '!**/*.e2e-spec.ts',
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
    '^@restopsiq/email(.*)$': '<rootDir>/../../../packages/email/src$1',
    '^@restopsiq/shared(.*)$': '<rootDir>/../../../packages/shared/src$1',
    '^@restopsiq/types(.*)$': '<rootDir>/../../packages/types/src$1',
    '^@restopsiq/utils(.*)$': '<rootDir>/../../packages/utils/src$1',
  },

  // ── ts-jest config ────────────────────────────────────────────────────────
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: { importHelpers: true, jsx: 'react-jsx' },
      },
    ],
  },

  // ── Setup ─────────────────────────────────────────────────────────────────
  setupFilesAfterEnv: [],
  clearMocks: true,
  restoreMocks: true,
};
