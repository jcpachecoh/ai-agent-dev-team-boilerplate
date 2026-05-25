# Task 07 — Final Validation

## Goal

Run the complete test suite for both `packages/email` and `apps/api` with coverage enforcement,
confirm all acceptance criteria from subtasks 02–06 are met, and confirm the branch is ready for
PR review.

No implementation changes in this task. If a validation run reveals a failing test that was not
caused by an RES-227 change, stop and report before touching source files.

---

## Scope

Execute validation commands, read outputs, confirm green status, and record final coverage numbers.

---

## Out of Scope

- Modifying any source file.
- Modifying any spec file (unless a test introduced in 02–05 has a typo/syntax error — fix only
  the test file that was introduced in this RES-227 epic, not pre-existing tests).
- Modifying CI workflows.
- Committing changes (follow the git workflow rule — only commit when explicitly requested).

---

## Files Allowed

- `tasks/email/RES-227/07-final-validation.md` (this file — update with results)

---

## Files Forbidden

All `packages/email/src/` and `apps/api/src/` source files are read-only unless fixing a
syntax/typo in a test introduced by subtasks 02–05 of this ticket.

---

## Implementation Notes

### Checklist to execute in order

#### 1. Structure validation

```bash
node scripts/validate-structure.js
```

Expected: exits 0, no errors.

#### 2. `packages/email` — full suite with coverage

```bash
cd packages/email && npx jest --coverage
```

Expected:

- All tests pass (PASS all suites).
- Coverage report shows:
  - Lines ≥ 90%
  - Statements ≥ 90%
  - Branches ≥ 80%
  - Functions ≥ 85%
- No threshold violation messages.

#### 3. `apps/api` — auth integration spec in isolation

```bash
cd apps/api && npx jest --testPathPattern="auth-email-integration" --no-coverage
```

Expected: new spec file passes, 8+ tests green.

#### 4. `apps/api` — full auth suite

```bash
cd apps/api && npx jest --testPathPattern="auth" --no-coverage
```

Expected: all auth tests pass (target: 234+ tests, up from 226 before subtask 05).

#### 5. `apps/api` — full suite with coverage gate

```bash
cd apps/api && npx jest --coverage
```

Expected:

- All 38+ suites pass.
- Global thresholds met: branches ≥ 80, functions ≥ 80, lines ≥ 80, statements ≥ 80.
- Auth-related lines ≥ 85% (spot-check in coverage table).

#### 6. TypeScript check (optional but recommended)

```bash
cd packages/email && npx tsc --noEmit
cd apps/api && npx tsc --noEmit
```

Expected: no type errors.

---

## Results to Record

Fill in after running:

| Check                                   | Expected            | Actual                               | Status |
| --------------------------------------- | ------------------- | ------------------------------------ | ------ |
| `node scripts/validate-structure.js`    | exit 0              | exit 0 — 10/10 modules               | ✅     |
| `packages/email` tests total            | ≥ 172 (169 + 3 new) | **173** (169 + 4 new)                | ✅     |
| `packages/email` statements coverage    | ≥ 90%               | **95.81%**                           | ✅     |
| `packages/email` lines coverage         | ≥ 90%               | **96.74%**                           | ✅     |
| `packages/email` branches coverage      | ≥ 80%               | **93.20%**                           | ✅     |
| `packages/email` functions coverage     | ≥ 85%               | **88.23%**                           | ✅     |
| `packages/email` threshold gate         | exit 0              | exit 0 — no violations               | ✅     |
| `packages/email` TypeScript             | no errors           | no errors                            | ✅     |
| `apps/api` auth-email-integration tests | ≥ 8                 | **8/8 passed**                       | ✅     |
| `apps/api` total tests                  | ≥ 234               | **234 passed, 1 skipped, 235 total** | ✅     |
| `apps/api` global statements            | ≥ 80%               | **92.40%**                           | ✅     |
| `apps/api` global lines                 | ≥ 80%               | **91.76%**                           | ✅     |
| `apps/api` global branches              | ≥ 80%               | **80.41%**                           | ✅     |
| `apps/api` global functions             | ≥ 80%               | **87.02%**                           | ✅     |
| `apps/api` auth/service lines           | ≥ 85%               | **99.09%**                           | ✅     |
| `apps/api` auth/repository lines        | ≥ 85%               | **100%**                             | ✅     |
| `apps/api` threshold gate               | exit 0              | exit 0 — no violations               | ✅     |
| `apps/api` TypeScript                   | no errors           | no errors                            | ✅     |

---

## Changed Files Summary (fill in after all subtasks)

After completing subtasks 02–06, list every file modified or created in RES-227:

| File                                                                    | Type      | Subtask | Change                                  |
| ----------------------------------------------------------------------- | --------- | ------- | --------------------------------------- |
| `tasks/email/RES-227-email-tests-and-coverage.md`                       | Task spec | —       | Created                                 |
| `tasks/email/RES-227/01-gap-analysis-existing-tests.md`                 | Task file | 01      | Created                                 |
| `tasks/email/RES-227/02-template-otp-monospace-assertion.md`            | Task file | 02      | Created                                 |
| `tasks/email/RES-227/03-email-service-render-primarycolor-assertion.md` | Task file | 03      | Created                                 |
| `tasks/email/RES-227/04-worker-retry-backoff-count-assertion.md`        | Task file | 04      | Created                                 |
| `tasks/email/RES-227/05-auth-email-integration-tests.md`                | Task file | 05      | Created                                 |
| `tasks/email/RES-227/06-email-package-coverage-thresholds.md`           | Task file | 06      | Created                                 |
| `tasks/email/RES-227/07-final-validation.md`                            | Task file | 07      | Created                                 |
| `packages/email/src/test/verify-email.spec.ts`                          | Test      | 02      | +1 it()                                 |
| `packages/email/src/test/email.service.spec.ts`                         | Test      | 03      | +1 it()                                 |
| `packages/email/src/test/email.worker.spec.ts`                          | Test      | 04      | +1–2 it()                               |
| `apps/api/src/auth/test/auth-email-integration.spec.ts`                 | Test      | 05      | Created                                 |
| `packages/email/jest.config.js`                                         | Config    | 06      | +coverageThreshold +collectCoverageFrom |

No source files. No package.json. No lockfiles. No CI workflows.

---

## Acceptance Criteria

- [x] `node scripts/validate-structure.js` exits 0.
- [x] `packages/email` suite: all tests pass, all thresholds met.
- [x] `apps/api` suite: all tests pass, global threshold ≥ 80% met.
- [x] `auth-email-integration.spec.ts` exists and passes with ≥ 8 tests.
- [x] No source files were modified across the entire RES-227 epic.
- [x] No new dependencies were added.
- [x] No CI workflow changes were made.
- [x] Results table above is filled in.
- [x] Branch is ready for PR review.

---

## Validation Commands

```bash
# Full validation sequence:
node scripts/validate-structure.js

cd packages/email
npx jest --coverage

cd ../../apps/api
npx jest --testPathPattern="auth-email-integration" --no-coverage
npx jest --coverage
```
