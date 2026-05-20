/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Resolve tests relative to src/ so imports like '../email.service' work
  rootDir: 'src',
  testMatch: ['**/test/**/*.spec.ts'],

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
