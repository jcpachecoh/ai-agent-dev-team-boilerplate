# RES-227 — Unit and Integration Tests for the Full Email Module

## Goal

Harden test coverage and enforce coverage thresholds for the complete email epic (RES-222–RES-226).
Close all gaps between the ticket-required test list and what the existing specs cover.
Ensure every CI run on `packages/email` and `apps/api/src/auth` is green with no external dependencies.

---

## Background

RES-222 through RES-226 implemented:

- `packages/email` — React Email templates (welcome, reset-password, verify-email, invite-user),
  `EmailService` (BullMQ enqueue), `EmailWorker` (Resend delivery, retry, rate-limit, DLQ, events),
  and `ResendClient`.
- `apps/api/src/email/email.module.ts` — NestJS global provider for `EmailService`.
- `apps/api/src/auth/` — `AuthEmailService`, `AuthEmailRepository`, four new controller endpoints
  (forgot-password, reset-password, verify-email, resend-verification).

During RES-222–226 a parallel test suite was also built. By the start of RES-227:

- `packages/email/src/test/` contains 10 spec files with **169 passing tests**.
- `apps/api/src/auth/test/` contains 7 spec files with **226 passing tests** (across the full auth module).
- Current line coverage: `packages/email` 96.74%, `apps/api` global ≥ 80%.

---

## TDD Note — Why This Ticket is Test Hardening, Not Red-First

RES-222 through RES-226 are **already fully implemented** — source code, tests, migration, and module
wiring are complete and passing in CI.

RES-227 was originally designed as a RED-first safety net, but because the implementation already
exists, treating it as RED-first would mean writing tests that fail against working code and then
immediately reverting them — which produces no value.

**Resolution:** RES-227 is handled as **test hardening and coverage enforcement** against the
already-implemented functionality:

- Identify gaps between the ticket test list and existing specs.
- Add only the truly missing assertions (not duplicate tests that already exist under different names).
- Add coverage thresholds once all gaps are closed.

**Constraint for all future work:** Any new functionality added after this ticket MUST follow
RED-first TDD — write a failing test, then implement the minimum code to make it pass.

---

## Scope

1. Close identified gaps in `packages/email/src/test/` (subtasks 02–04).
2. Add integration-style auth email tests at `apps/api/src/auth/test/auth-email-integration.spec.ts`
   (subtask 05).
3. Add coverage thresholds to `packages/email/jest.config.js` after all tests pass (subtask 06).
4. Final full-suite validation (subtask 07).

---

## Out of Scope

- Modifying any implementation source file in `packages/email/src/` or `apps/api/src/`.
- Installing new dependencies or changing `package.json` / `pnpm-lock.yaml`.
- Adding or modifying CI workflow files (coverage for `packages/email` has no dedicated CI job;
  that is a separate follow-up, not part of RES-227).
- Creating an `apps/api/test/auth-email.spec.ts` file at the monorepo root — see test location
  decision below.
- Creating a consolidated `packages/email/test/templates.spec.ts` aggregate file — the ticket
  path is documentation notation, not a filesystem mandate.
- Changing any other module (testlab, supplyitems, audit, etc.).

---

## Existing Test Inventory

### `packages/email/src/test/` — 10 files, 169 tests

| File                       | Tests | Coverage focus                                            |
| -------------------------- | ----- | --------------------------------------------------------- |
| `welcome.spec.ts`          | 18    | Roles, primaryColor, temporaryPassword, logo fallback     |
| `base-layout.spec.ts`      | 11    | Logo, fallback, color, HTML structure                     |
| `reset-password.spec.ts`   | 16    | resetUrl, ipAddress, expiry, color                        |
| `verify-email.spec.ts`     | 11    | OTP content, expiry minutes, color                        |
| `invite-user.spec.ts`      | 15    | Invitee/inviter names, workspace, acceptUrl               |
| `email.service.spec.ts`    | 19    | BullMQ enqueue, jobId, priority, render, no-Resend        |
| `email.worker.spec.ts`     | 40    | processJob, rate-limit bypass, classifyError, DLQ, events |
| `email.rate-limit.spec.ts` | 28    | Redis Lua script, tenant key, window/max/TTL              |
| `email.dlq.spec.ts`        | 17    | DLQ payload, fallbacks, swallows errors, events           |
| `resend.client.spec.ts`    | 8     | sendEmail success + error mapping                         |

### `apps/api/src/auth/test/` — 7 files, 226 tests

| File                            | Tests | Coverage focus                                                             |
| ------------------------------- | ----- | -------------------------------------------------------------------------- |
| `auth-email.service.spec.ts`    | 40    | sendResetPassword, sendVerifyEmail, sendWelcome, sendInvitation, lifecycle |
| `auth-email.repository.spec.ts` | 8     | createResetToken, findResetToken, markUsed, deleteExpired                  |
| `auth.controller.spec.ts`       | 14    | All 7 controller endpoints (including new 4 email endpoints)               |
| `auth.service.spec.ts`          | 15    | signup, login, refresh, logout, resetPassword, findByEmail                 |
| `auth.repository.spec.ts`       | ~7    | findByEmail, findById, createUser, saveRefreshToken, updatePassword        |
| `auth.strategies.spec.ts`       | ~4    | JWT strategy validation                                                    |
| `jwt-refresh.guard.spec.ts`     | ~3    | Guard behavior                                                             |

---

## Required Test List from the Ticket

### Template tests

| Ticket description                                              | Status                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `welcome: renderiza sin errores con todos los roles`            | ✅ Covered — `welcome.spec.ts` lines 94–132                                    |
| `welcome: incluye el color primario del tenant en el botón CTA` | ✅ Covered — `welcome.spec.ts` line 51                                         |
| `welcome: muestra contraseña temporal solo si se provee`        | ✅ Covered — `welcome.spec.ts` lines 82–93                                     |
| `reset-password: renderiza con URL de reset válida`             | ✅ Covered — `reset-password.spec.ts`                                          |
| `reset-password: muestra la IP de seguridad si se provee`       | ✅ Covered — `reset-password.spec.ts`                                          |
| `verify-email: muestra el OTP en fuente monoespaciada grande`   | ❌ **MISSING** — OTP content tested, `font-family: monospace` CSS not asserted |
| `verify-email: muestra el tiempo de expiración en minutos`      | ✅ Covered — `verify-email.spec.ts`                                            |
| `invite-user: muestra el nombre del invitador y el workspace`   | ✅ Covered — `invite-user.spec.ts`                                             |
| `BaseLayout: usa el logo del tenant si se provee URL`           | ✅ Covered — `base-layout.spec.ts`                                             |
| `BaseLayout: usa el logo de RestOpsIQ como fallback`            | ✅ Covered — `base-layout.spec.ts`                                             |

### EmailService tests

| Ticket description                                                    | Status                                                                                                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `send: encola el job en BullMQ sin llamar a Resend de forma síncrona` | ✅ Covered — `email.service.spec.ts`                                                                                   |
| `send: retorna un jobId válido siempre`                               | ✅ Covered — `email.service.spec.ts`                                                                                   |
| `render: retorna HTML válido para cada tipo de template`              | ✅ Covered (mocked render) — `email.service.spec.ts`                                                                   |
| `render: el HTML contiene el color primario del tenant`               | ❌ **MISSING** — render is mocked in service tests; primaryColor in rendered HTML not asserted with a real render call |

### Worker tests

| Ticket description                                            | Status                                                                                                                             |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `procesa el job y llama a Resend API con el HTML renderizado` | ✅ Covered — `email.worker.spec.ts`                                                                                                |
| `reintenta 3 veces con backoff exponencial en error de red`   | ⚠️ **PARTIAL** — re-throw on network errors is tested, but explicit `attempts: 3, backoff: exponential` config assertion is absent |
| `NO reintenta en error 422 de Resend (email inválido)`        | ✅ Covered — `email.worker.spec.ts`                                                                                                |
| `publica email:failed en Redis después de 3 fallos`           | ✅ Covered — `email.worker.spec.ts`                                                                                                |
| `respeta el rate limit de 100 emails/hora por tenant`         | ✅ Covered — `email.worker.spec.ts`                                                                                                |
| `emails de reset-password no cuentan en el rate limit`        | ✅ Covered — `email.worker.spec.ts`                                                                                                |

### Auth integration tests (`apps/api/test/auth-email.spec.ts` in ticket notation)

| Ticket description                                                  | Status                                                                                                                                  |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/forgot-password: retorna 200 aunque el email no exista` | ✅ Covered — `auth.controller.spec.ts`                                                                                                  |
| `POST /auth/forgot-password: encola el job de email en BullMQ`      | ❌ **MISSING** — controller tests mock `AuthEmailService.sendResetPassword`; BullMQ enqueue (via real `EmailService.send`) not asserted |
| `POST /auth/reset-password: token válido cambia la contraseña`      | ✅ Covered — `auth.service.spec.ts` + `auth.controller.spec.ts`                                                                         |
| `POST /auth/reset-password: token usado dos veces retorna 400`      | ✅ Covered — `auth.service.spec.ts`                                                                                                     |
| `POST /auth/reset-password: token expirado retorna 400`             | ✅ Covered — `auth.service.spec.ts`                                                                                                     |
| `POST /auth/verify-email: OTP válido verifica el email del usuario` | ✅ Covered — `auth.controller.spec.ts`                                                                                                  |
| `POST /auth/verify-email: OTP expirado retorna 400`                 | ✅ Covered — `auth.controller.spec.ts` (propagates BadRequestException)                                                                 |
| `token de reset se guarda como SHA-256 (no texto plano) en DB`      | ✅ Covered — `auth-email.service.spec.ts`                                                                                               |

---

## Gap Analysis

Four gaps exist:

| #   | Gap                                                                                                                        | Subtask |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| G1  | `verify-email`: no assertion that OTP is rendered in a monospace font                                                      | 02      |
| G2  | `EmailService.render`: no test asserting rendered HTML contains tenant primaryColor (real render, no mock)                 | 03      |
| G3  | `EmailWorker`: no explicit assertion that `attempts: 3` and `backoff: { type: 'exponential' }` are configured              | 04      |
| G4  | Auth integration: no single spec covering all 8 ticket scenarios with mocked `EmailService` (for BullMQ enqueue assertion) | 05      |

No implementation changes are required to close any gap — all are purely test additions.

---

## Test Location Decision

### `packages/email` tests

**Convention:** `packages/email/src/test/*.spec.ts`

**Reason:** `jest.config.js` sets `rootDir: 'src'` and `testMatch: ['**/test/**/*.spec.ts']`.
All 10 existing spec files are under `src/test/`. The ticket path `packages/email/test/templates.spec.ts`
is documentation notation only. Creating files outside `src/` would require `jest.config.js` changes
which are out of scope.

**Decision:** Add missing assertions to the **existing** spec files in `src/test/`. Do not create
a new consolidated aggregate `templates.spec.ts`.

### `apps/api` tests

**Convention:** `apps/api/src/{module}/test/*.spec.ts`

**Reason:** `jest.config.js` sets `rootDir: 'src'` and `testRegex: '.*\\.spec\\.ts$'`. The
`jest.e2e.config.js` targets `*.e2e-spec.ts` with real infrastructure (30 s timeout). The auth
integration tests in this ticket are achievable with NestJS `TestingModule` + mocked providers —
no real DB, Redis, or Resend. They belong in the **unit jest config**, not the e2e config.

**Decision:** Create `apps/api/src/auth/test/auth-email-integration.spec.ts`. The ticket's
`apps/api/test/auth-email.spec.ts` path is documentation notation.

---

## Mocking Strategy

All tests in this epic must satisfy the "no external dependencies" criterion:

| Dependency                | Mock approach                                                              |
| ------------------------- | -------------------------------------------------------------------------- |
| **Resend**                | `jest.mock('../resend.client')` or `jest.fn()` on `ResendClient.sendEmail` |
| **Redis**                 | `jest.mock('ioredis')` with `{ set, get, del, quit }` jest.fn() factory    |
| **BullMQ Queue**          | `jest.mock('bullmq')` — capture `queue.add()` arguments                    |
| **BullMQ Worker**         | `jest.mock('bullmq')` — capture `Worker` constructor arguments             |
| **Prisma / DB**           | `useValue: prismaMock` object with jest.fn() per method                    |
| **`@react-email/render`** | Mock for service-layer tests; **unmocked** for G2 real-render assertion    |
| **NestJS providers**      | `{ provide: SomeService, useValue: mockObject }` in `TestingModule`        |

No test may open a real network connection, real Redis, or real PostgreSQL connection.

---

## Coverage Strategy

### `packages/email`

Current (before RES-227): Statements 95.81% | Branches 92.23% | Functions 88.23% | Lines 96.74%

Ticket requirement: **lines > 90%** — already met. After closing gaps G1–G3, function coverage
should rise above 90% (currently ~88.23%; the uncovered functions are default-export helpers in
`.tsx` template files that are never called via named import).

Target thresholds to enforce after subtasks 02–04 pass (subtask 06):

```
lines:      90
statements: 90
branches:   80
functions:  85
```

### `apps/api/src/auth`

Current: Statements ~97% | Branches ~82% | Lines ~98%

Ticket requirement: **email-related lines > 85%** — already met at ~98%. Subtask 05 adds more
assertions, which will maintain or improve these numbers. No threshold config changes needed in
`apps/api/jest.config.js` (global 80% threshold remains the CI gate).

---

## Acceptance Criteria

- [ ] All existing 169 `packages/email` tests still pass.
- [ ] All existing 226 `apps/api` auth tests still pass.
- [ ] G1 closed: `verify-email.spec.ts` asserts OTP renders with monospace font style.
- [ ] G2 closed: `email.service.spec.ts` has a real-render test proving HTML contains primaryColor.
- [ ] G3 closed: `email.worker.spec.ts` asserts Worker is constructed with `attempts: 3` and exponential backoff.
- [ ] G4 closed: `auth-email-integration.spec.ts` covers all 8 ticket auth scenarios, including BullMQ enqueue.
- [ ] `packages/email` coverage thresholds added and passing: lines ≥ 90, statements ≥ 90, branches ≥ 80, functions ≥ 85.
- [ ] `apps/api` full suite passes with global threshold ≥ 80% (all metrics).
- [ ] No implementation source files modified.
- [ ] No new dependencies added.
- [ ] No CI workflow changes.

---

## Risks and Follow-ups

1. **No CI job for `packages/email` coverage.** The quality-gates workflow only runs coverage for
   `@restopsiq/api`. After RES-227, a follow-up ticket should add a `test-email-unit` job.
   Out of scope here.

2. **`packages/email` devDependencies missing `jest`/`ts-jest`.** They run via pnpm hoisting from
   the root. This is fragile but fixing it (adding them explicitly) is a separate concern.

3. **Module-level `APP_URL` branch.** `auth-email.service.ts` line 20 evaluates
   `process.env.APP_URL ?? 'http://localhost:3000'` at import time. One branch is structurally
   unreachable within a single test file. If branch coverage drops below 80% after this ticket,
   `jest.isolateModules()` can be used in a follow-up — not required here since current branch
   coverage is 82%.

4. **G2 real-render performance.** A test using the real `@react-email/render` will be ~10× slower
   than mocked ones. Isolate it in a clearly labeled describe block.

5. **If any gap reveals a real implementation bug**, stop and report before touching implementation.
   Do not silently fix source code under a test-only ticket.

---

## Validation Commands

```bash
# packages/email — after each subtask (02, 03, 04):
cd packages/email && npx jest --no-coverage

# packages/email — after subtask 06 (thresholds):
cd packages/email && npx jest --coverage

# apps/api — after subtask 05:
cd apps/api && npx jest --testPathPattern="auth-email-integration" --no-coverage

# apps/api — full suite with coverage gate:
cd apps/api && npx jest --coverage

# Structure validation (always):
node scripts/validate-structure.js

# Full combined check before marking RES-227 complete:
cd packages/email && npx jest --coverage && cd ../../apps/api && npx jest --coverage
```
