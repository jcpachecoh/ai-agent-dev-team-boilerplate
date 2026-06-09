/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Resolve tests relative to src/ so imports like '../email.service' work
  rootDir: 'src',
  testMatch: ['**/test/**/*.spec.ts'],

  // Explicit collection ensures new src/ files are included even before they have tests.
  // rootDir is 'src', so patterns are relative to src/.
  // Excluded files:
  //   index.ts             — barrel re-exports only; tests import source modules directly.
  //   worker.entrypoint.ts — Node.js process entry point not suited to unit testing.
  collectCoverageFrom: [
    '**/*.ts',
    '**/*.tsx',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/worker.entrypoint.ts',
  ],

  // Thresholds aligned with RES-227 requirements (> 90% lines) and current measured coverage.
  // branches: 80 — template-registry.tsx exhaustive default: branch is structurally unreachable.
  // functions: 85 — template helper functions not exercised via named imports account for ~3%.
  coverageThreshold: {
    global: {
      lines: 90,
      statements: 90,
      branches: 80,
      functions: 85,
    },
  },

  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        // Override module to CommonJS — the package tsconfig targets esnext
        // which Jest (CommonJS runtime) cannot execute directly.
        // jsx and esModuleInterop are kept consistent with tsconfig.
        tsconfig: {
          module: 'CommonJS',
          jsx: 'react-jsx',
          esModuleInterop: true,
        },
      },
    ],
  },

  clearMocks: true,
  restoreMocks: true,
};
