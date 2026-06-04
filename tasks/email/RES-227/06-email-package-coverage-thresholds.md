# Task 06 — Email Package Coverage Thresholds

## Goal

Add coverage thresholds to `packages/email/jest.config.js` so that any future regression in
`packages/email` coverage is caught automatically when running `npx jest --coverage`.

This task MUST be done **after** subtasks 02, 03, and 04 have been completed and all tests pass.
Do not add thresholds that the current test suite cannot meet.

---

## Scope

Add a `coverageThreshold` block and a `collectCoverageFrom` block to `packages/email/jest.config.js`.

---

## Out of Scope

- Modifying source files in `packages/email/src/`.
- Modifying spec files.
- Adding a CI workflow job for email package coverage (follow-up ticket, not RES-227).
- Adding a `test:cov` script to `packages/email/package.json` (minor convenience; not required
  for threshold enforcement — `npx jest --coverage` is sufficient for local runs and CI would
  need a workflow change anyway).
- Changing any other configuration file.

---

## Files Allowed

- `packages/email/jest.config.js`

---

## Files Forbidden

- `packages/email/src/` — do not touch source or test files
- `packages/email/package.json` — do not touch scripts or dependencies
- `apps/api/jest.config.js` — do not touch (has its own threshold config)
- Any other file

---

## Implementation Notes

### Threshold values to add

Based on the coverage measured after subtasks 02–04, the thresholds are:

```js
coverageThreshold: {
  global: {
    lines:      90,
    statements: 90,
    branches:   80,
    functions:  85,
  },
},
```

Rationale:

- **lines 90 / statements 90:** Ticket requires > 90% lines. Current value is 96.74% with room
  for small drops if future tests are added without implementation.
- **branches 80:** Current is 92.23%. The `template-registry.tsx` exhaustive `default:` branch
  (lines 136–138) is structurally unreachable — setting 80% rather than 90% gives headroom for
  this permanent gap.
- **functions 85:** Current is 88.23%. Template helper functions not exposed via named import
  account for ~3% of uncovered functions. 85% allows for these while catching real regressions.

### collectCoverageFrom to add

The current `jest.config.js` has no `collectCoverageFrom`. Without it, Jest collects coverage only
from files that were imported by at least one test. Adding explicit collection ensures new files
added to `src/` are included even if not yet tested:

```js
collectCoverageFrom: [
  '**/*.ts',
  '**/*.tsx',
  '!**/*.d.ts',
  '!**/worker.entrypoint.ts',
],
```

Note: `rootDir` is `src`, so paths are relative to `src/`. `worker.entrypoint.ts` is excluded
because it is a Node.js process entry point not meant to be unit-tested.

### Before adding thresholds

Verify that the current passing numbers (after subtasks 02–04) meet or exceed the proposed
thresholds:

```bash
cd packages/email && npx jest --coverage 2>&1 | grep -A 20 "All files"
```

If any metric is below the proposed threshold, lower the threshold to the actual rounded-down
value. Do not set a threshold higher than what the current suite achieves.

### Full config addition

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/test/**/*.spec.ts'],

  // ADD THIS:
  collectCoverageFrom: ['**/*.ts', '**/*.tsx', '!**/*.d.ts', '!**/worker.entrypoint.ts'],

  // ADD THIS:
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
```

---

## Acceptance Criteria

- [ ] `packages/email/jest.config.js` has a `coverageThreshold` block with the values above.
- [ ] `packages/email/jest.config.js` has a `collectCoverageFrom` block.
- [ ] `npx jest --coverage` in `packages/email` exits with code 0 (all thresholds met).
- [ ] All previously passing tests still pass.
- [ ] No source or spec files modified.
- [ ] No new dependencies added.

---

## Validation Commands

```bash
# Must exit 0 with all thresholds met:
cd packages/email && npx jest --coverage

# Confirm threshold enforcement — artificially break a threshold:
# (For manual verification only — do not commit this.)
# Change threshold.lines to 99 → should fail.
# Revert after confirming the gate works.
```
