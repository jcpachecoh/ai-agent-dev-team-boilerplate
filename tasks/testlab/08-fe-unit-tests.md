# Task: Add Frontend Unit Tests (Vitest + Testing Library)

**Domain:** `[TEST]`
**Assigned Agent:** test-engineer
**Status:** `pending`
**Created:** 2026-05-19
**Depends On:** `tasks/testlab/03-fe-edit-delete-ui.md`

---

## Context

The TestLab SPA (`apps/testlab`) has no unit tests. The backend has good coverage, but the
frontend components, pages, and services are entirely untested. This task introduces a Vitest

- React Testing Library setup and adds tests for the most critical paths.

---

## Requirements

### Setup

- [ ] Add `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` as devDependencies to `apps/testlab/package.json`
- [ ] Add `vitest.config.ts` (or configure inside `vite.config.ts`) with `environment: 'jsdom'` and `setupFiles`
- [ ] Add `src/test-setup.ts` that imports `@testing-library/jest-dom`
- [ ] Add `test` script to `package.json`: `vitest run`
- [ ] Add `test:watch` script: `vitest`
- [ ] Add `test:coverage` script: `vitest run --coverage`

### Service tests (pure unit — no DOM needed)

- [ ] `src/services/auth.service.test.ts` — test `login`, `signup`, `logout`, `refresh`, token storage/retrieval
- [ ] `src/services/projects.service.test.ts` — test `list`, `create`, `update`, `remove` (mock `http` module)
- [ ] `src/services/cases.service.test.ts` — test `list`, `create`, `updateStatus`, `update`, `remove`

### Component tests

- [ ] `src/components/ProtectedRoute/ProtectedRoute.test.tsx` — redirects unauthenticated users to `/login`; renders children when authenticated
- [ ] `src/components/SimpleModal/SimpleModal.test.tsx` — renders fields from config; calls `onSubmit` with correct values; can be closed
- [ ] `src/components/Sidebar/Sidebar.test.tsx` — renders project nav links; shows project-scoped nav when `projectId` param is present

### Page tests

- [ ] `src/pages/Login/LoginPage.test.tsx` — form submits with email + password; shows error on failed login; redirects on success
- [ ] `src/pages/Projects/ProjectsPage.test.tsx` — renders project list; opens new project modal on button click; shows empty state when list is empty
- [ ] `src/pages/TestCases/TestCasesPage.test.tsx` — renders case list; status dropdown triggers `updateStatus`; create modal submits correctly

### Context tests

- [ ] `src/contexts/AuthContext.test.tsx` — `useAuth()` returns user decoded from token; clears state on logout

---

## Acceptance Criteria

- [ ] `pnpm --filter testlab test` exits 0 with all tests passing
- [ ] Line coverage ≥ 70% across `src/services/`, `src/components/`, `src/pages/`
- [ ] Tests mock the `http` module (not real HTTP calls)
- [ ] All tests use `@testing-library/user-event` for interactions (not `.click()` directly)
- [ ] No `any` type in test files without a comment justifying it

---

## Files to Create or Modify

- `apps/testlab/package.json` — add vitest + testing-library deps and test scripts
- `apps/testlab/vite.config.ts` — add vitest config block
- `apps/testlab/src/test-setup.ts` — jest-dom setup
- `apps/testlab/src/services/auth.service.test.ts`
- `apps/testlab/src/services/projects.service.test.ts`
- `apps/testlab/src/services/cases.service.test.ts`
- `apps/testlab/src/components/ProtectedRoute/ProtectedRoute.test.tsx`
- `apps/testlab/src/components/SimpleModal/SimpleModal.test.tsx`
- `apps/testlab/src/components/Sidebar/Sidebar.test.tsx`
- `apps/testlab/src/pages/Login/LoginPage.test.tsx`
- `apps/testlab/src/pages/Projects/ProjectsPage.test.tsx`
- `apps/testlab/src/pages/TestCases/TestCasesPage.test.tsx`
- `apps/testlab/src/contexts/AuthContext.test.tsx`

---

## Notes

- Mock the `http` module using `vi.mock('../services/http')` so no actual network calls are made.
- Use `MemoryRouter` from `react-router-dom` to wrap components that use router hooks in tests.
- Wrap components that use `useQuery`/`useMutation` in a `QueryClientProvider` with a fresh `QueryClient` per test.
- TanStack Query v5 requires `QueryClient` options to be set with `defaultOptions: { queries: { retry: false } }` in tests to avoid retry delays.
