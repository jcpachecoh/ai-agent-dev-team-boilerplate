# Task: Testing Infrastructure — Vitest + React Testing Library

**Domain:** `[FRONTEND]` `[TEST]`
**Assigned Agent:** test-engineer
**Status:** `pending`
**Created:** 2026-05-28
**Depends On:** `tasks/app/01-scaffold.md`

---

## Context

Add a complete unit + component testing setup to `apps/web-app`.  
The stack mirrors what Vite projects in this monorepo already use:

- **Test runner:** Vitest (runs inside Vite, shares the same config)
- **Component testing:** `@testing-library/react` + `@testing-library/user-event`
- **Assertions:** `@testing-library/jest-dom` matchers via a global setup file
- **Environment:** `jsdom` (simulates the browser DOM)

All tests must pass in CI via `turbo run test`.

---

## Requirements

- [ ] Install dev dependencies:
  - `vitest`
  - `@vitest/coverage-v8`
  - `@testing-library/react`
  - `@testing-library/user-event`
  - `@testing-library/jest-dom`
  - `jsdom`
- [ ] Extend `vite.config.ts` with a `test` block:
  ```ts
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
    },
  }
  ```
- [ ] Create `src/test/setup.ts` that imports `@testing-library/jest-dom`
- [ ] Add scripts to `package.json`:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
  - `"test:cov": "vitest run --coverage"`
- [ ] Add `/// <reference types="vitest" />` to `vite.config.ts`
- [ ] Write a smoke test `src/App.test.tsx` that:
  - Renders `<App />`
  - Asserts the heading `Web App` is in the document
  - Covers both a passing and a trivially failing path (error boundary or null render)
- [ ] Ensure `pnpm --filter=@restopsiq/web-app test` exits 0

---

## Acceptance Criteria

- [ ] `pnpm --filter=@restopsiq/web-app test` runs and all tests pass
- [ ] `pnpm --filter=@restopsiq/web-app test:cov` generates `coverage/lcov.info`
- [ ] `src/App.test.tsx` contains at least one assertion using a `jest-dom` matcher (e.g., `toBeInTheDocument`)
- [ ] No test uses `expect(true).toBe(true)` or other trivially passing assertions
- [ ] `turbo run test --filter=@restopsiq/web-app` exits 0 in CI

---

## Files to Create or Modify

- `apps/web-app/package.json` — add test scripts and devDependencies
- `apps/web-app/vite.config.ts` — add `test` block + vitest reference
- `apps/web-app/tsconfig.app.json` — include `vitest/globals` types if needed
- `apps/web-app/src/test/setup.ts` — global jest-dom import
- `apps/web-app/src/App.test.tsx` — smoke tests for root component

---

## Notes

- Do NOT use `jest` directly — use Vitest throughout.
- `globals: true` means `describe`, `it`, `expect` are available without imports in test files.
- The `setupFiles` path must be relative to the project root, not `src/`.
- Coverage thresholds are not enforced in this task — that comes with feature work.
