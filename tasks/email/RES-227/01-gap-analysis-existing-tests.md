# Task 01 — Gap Analysis: Existing Tests vs. RES-227 Ticket Requirements

## Status

**Analysis complete.** Four confirmed gaps (G1–G4). One gap location correction noted for task 04.
No implementation changes are part of this task.

---

## Context: Why RES-227 Is Retroactive Test Hardening

RES-222 through RES-226 are fully implemented. Source code, tests, Prisma migration, and NestJS
module wiring are complete and passing in CI before RES-227 begins. The ticket was originally
designed as a RED-first safety net, but because the implementation already exists, treating it as
RED-first would mean writing failing tests against working code and immediately reverting them —
producing no value.

**RES-227 is therefore treated as test hardening and coverage enforcement:**

- Identify gaps between the ticket test list and existing specs.
- Add only the truly missing assertions — not duplicate tests under new names.
- Add coverage thresholds once all gaps are closed.

**Future work:** Any new functionality added after this ticket MUST follow RED-first TDD.

---

## Test Location Decision

### `packages/email` tests

The ticket notation says `packages/email/test/templates.spec.ts`. This path does not follow repo
conventions.

**Actual convention:** `packages/email/src/test/*.spec.ts`

**Reason:** `packages/email/jest.config.js` sets `rootDir: 'src'` and
`testMatch: ['**/test/**/*.spec.ts']`. All 10 existing spec files live under `src/test/`. Creating
files at `packages/email/test/` (one level above `src/`) would require `jest.config.js` changes
that are out of scope for a test-hardening ticket.

**Decision:** Add missing assertions to the **existing** spec files under `src/test/`. Do not create
a new consolidated `templates.spec.ts` aggregate file.

### `apps/api` tests

The ticket notation says `apps/api/test/auth-email.spec.ts`. This path does not follow repo
conventions.

**Actual convention:** `apps/api/src/{module}/test/*.spec.ts`

**Reason:** `apps/api/jest.config.js` sets `rootDir: 'src'` and `testRegex: '.*\\.spec\\.ts$'`.
The `jest.e2e.config.js` targets `*.e2e-spec.ts` files and is designed for real-infrastructure
tests with a 30-second timeout. The auth integration tests for RES-227 use NestJS `TestingModule`
with mocked providers — no real DB, Redis, or Resend. They belong in the unit jest config.

**Decision:** Create `apps/api/src/auth/test/auth-email-integration.spec.ts`. The ticket path is
documentation notation, not a filesystem mandate.

---

## Current Test Inventory

### `packages/email/src/test/` — 169 tests, 10 files

**Confirmed by running:** `cd packages/email && npx jest --no-coverage`

| File                       | Tests | What it covers                                                                                               |
| -------------------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| `welcome.spec.ts`          | 18    | Roles (owner/cashier/manager/accountant), primaryColor CTA, temporaryPassword, logo fallback, non-empty HTML |
| `base-layout.spec.ts`      | 11    | Logo, fallback RESTOPSIQ_LOGO_URL, primaryColor, previewText, HTML structure                                 |
| `reset-password.spec.ts`   | 16    | resetUrl, ipAddress present/absent, primaryColor, expiry, logo fallback, HTML structure                      |
| `verify-email.spec.ts`     | 11    | OTP content, expiresInMinutes, primaryColor, logo fallback, HTML structure                                   |
| `invite-user.spec.ts`      | 15    | inviteeName, inviterName, workspaceName, role, acceptUrl, expiresAt, primaryColor, logo fallback             |
| `email.service.spec.ts`    | 19    | BullMQ enqueue, jobId, priority (URGENT/NORMAL), render, no-Resend, error handling                           |
| `email.worker.spec.ts`     | 40    | processJob, rate-limit bypass for reset-password/verify-email, classifyResendError, error paths, DLQ, events |
| `email.rate-limit.spec.ts` | 28    | Redis Lua eval, tenant key, window/max/TTL defaults                                                          |
| `email.dlq.spec.ts`        | 17    | DLQ payload shape, fallbacks, error swallowing, events                                                       |
| `resend.client.spec.ts`    | 8     | sendEmail success, error mapping (4xx/5xx)                                                                   |

**Current coverage** (`cd packages/email && npx jest --coverage`):

| Metric     | Value  | Ticket requirement |
| ---------- | ------ | ------------------ |
| Statements | 95.81% | > 90% ✅           |
| Branches   | 92.23% | (no explicit req)  |
| Functions  | 88.23% | (no explicit req)  |
| Lines      | 96.74% | > 90% ✅           |

### `apps/api/src/auth/test/` — 226 tests across all auth files

**Confirmed by running:** `cd apps/api && npx jest --testPathPattern="auth" --no-coverage`

| File                            | Tests | What it covers                                                                                                       |
| ------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| `auth-email.service.spec.ts`    | 40    | sendResetPassword, sendVerifyEmail, verifyOtp, sendWelcome, sendInvitation, lifecycle (onModuleInit/onModuleDestroy) |
| `auth-email.repository.spec.ts` | 8     | createResetToken, findResetToken, markResetTokenUsed, deleteExpiredResetTokens                                       |
| `auth.controller.spec.ts`       | 14    | All 7 endpoints: signup, login, refresh, logout, forgotPassword, resetPassword, verifyEmail, resendVerification      |
| `auth.service.spec.ts`          | 15    | signup, login, refresh, logout, resetPassword (all branches), findByEmail                                            |
| `auth.repository.spec.ts`       | ~7    | findByEmail, findById, createUser, saveRefreshToken, updatePassword                                                  |
| `auth.strategies.spec.ts`       | ~4    | JWT strategy validation                                                                                              |
| `jwt-refresh.guard.spec.ts`     | ~3    | Guard behavior                                                                                                       |

**Current auth coverage** (`cd apps/api && npx jest --coverage`):

| Metric          | Value | Ticket requirement        |
| --------------- | ----- | ------------------------- |
| auth Statements | ~97%  | > 85% lines ✅            |
| auth Lines      | ~98%  | > 85% lines ✅            |
| auth Branches   | ~82%  | (global 80% threshold) ✅ |

---

## Full Ticket Requirement Mapping

### Template tests

#### `welcome: renderiza sin errores con todos los roles`

**Verdict: ✅ COVERED**

| Requirement detail                 | Covered by                           | File                  |
| ---------------------------------- | ------------------------------------ | --------------------- |
| Renders without error (owner)      | `'renders owner role label'`         | `welcome.spec.ts:94`  |
| Renders without error (cashier)    | `'renders cashier role label'`       | `welcome.spec.ts:99`  |
| Renders without error (manager)    | `'renders manager role label'`       | `welcome.spec.ts:104` |
| Renders without error (accountant) | `'renders accountant role label'`    | `welcome.spec.ts:109` |
| Produces valid HTML                | `'produces a non-empty HTML string'` | `welcome.spec.ts:126` |

#### `welcome: incluye el color primario del tenant en el botón CTA`

**Verdict: ✅ COVERED**

`'applies primaryColor to the CTA button'` — `welcome.spec.ts:51`

#### `welcome: muestra contraseña temporal solo si se provee`

**Verdict: ✅ COVERED**

- `'renders temporaryPassword when provided'` — `welcome.spec.ts:82`
- `'does not render a temporaryPassword block when omitted'` — `welcome.spec.ts:87`

#### `reset-password: renderiza con URL de reset válida`

**Verdict: ✅ COVERED**

`'includes resetUrl in the rendered output'` — `reset-password.spec.ts:51`

#### `reset-password: muestra la IP de seguridad si se provee`

**Verdict: ✅ COVERED**

- `'renders ipAddress when provided'` — `reset-password.spec.ts:80`
- `'renders the security note label when ipAddress is provided'` — `reset-password.spec.ts:85`
- `'does not render the IP block when ipAddress is omitted'` — `reset-password.spec.ts:90`

#### `verify-email: muestra el OTP en fuente monoespaciada grande`

**Verdict: ❌ GAP G1**

The OTP code content is tested:

- `'renders the otpCode in the output'` — `verify-email.spec.ts:40`
- `'applies primaryColor to the OTP element'` — `verify-email.spec.ts:45`

But **no test asserts that the OTP element carries a `font-family: monospace` style declaration**.
The rendered HTML may or may not include monospace styling — this is not verified by any existing
test.

**Action required:** Add `expect(html).toMatch(/font-family[^"]*monospace/)` or equivalent in
`verify-email.spec.ts`. See task 02.

#### `verify-email: muestra el tiempo de expiración en minutos`

**Verdict: ✅ COVERED**

- `'renders expiresInMinutes in the body'` — `verify-email.spec.ts:57`
- `'renders expiration copy'` — `verify-email.spec.ts:62`

#### `invite-user: muestra el nombre del invitador y el workspace`

**Verdict: ✅ COVERED**

- `'renders inviterName in the body'` — `invite-user.spec.ts:43`
- `'renders workspaceName in the heading'` — `invite-user.spec.ts:50`
- `'renders workspaceName in the previewText'` — `invite-user.spec.ts:55`

#### `BaseLayout: usa el logo del tenant si se provee URL`

**Verdict: ✅ COVERED**

`'renders tenantLogoUrl when provided'` (in base-layout + all template specs) — `base-layout.spec.ts`

#### `BaseLayout: usa el logo de RestOpsIQ como fallback`

**Verdict: ✅ COVERED**

`'falls back to RESTOPSIQ_LOGO_URL when tenantLogoUrl is omitted'` — `base-layout.spec.ts`

---

### EmailService tests

#### `send: encola el job en BullMQ sin llamar a Resend de forma síncrona`

**Verdict: ✅ COVERED**

- `'calls queue.add() exactly once'` — `email.service.spec.ts:71`
- `'does NOT call ResendClient.sendEmail'` — `email.service.spec.ts:101`

#### `send: retorna un jobId válido siempre`

**Verdict: ✅ COVERED**

- `'returns the BullMQ job id'` — `email.service.spec.ts:66`
- `'falls back to a uuid-like jobId when job.id is undefined'` — `email.service.spec.ts:118`

#### `render: retorna HTML válido para cada tipo de template`

**Verdict: ✅ COVERED (with mocked renderer)**

- `'returns the HTML string from renderAsync'` — `email.service.spec.ts:235`
- `'calls renderAsync exactly once'` — `email.service.spec.ts:240`
- `'produces a string for each template type'` — `email.service.spec.ts:245`

Note: `@react-email/render` is mocked in the service spec (`jest.mock('@react-email/render')`),
so these tests confirm the API contract, not the actual HTML output.

#### `render: el HTML contiene el color primario del tenant`

**Verdict: ❌ GAP G2**

All `email.service.spec.ts` tests mock `@react-email/render`. No test uses the **real** renderer
to assert that the resulting HTML actually contains the `primaryColor` value.

**Where the gap lives:** `email.service.ts` line 23 sets `defaultJobOptions: EMAIL_JOB_OPTIONS`
on the Queue constructor, and `email.service.ts` line ~50 calls `renderAsync()` to produce HTML
before enqueuing. A real-render test must verify that this HTML pipeline produces output containing
the configured color.

**Action required:** Add a test to `email.service.spec.ts` that unmocks `@react-email/render` for
one render call and asserts the returned HTML string contains the `primaryColor` hex value.
See task 03.

---

### Worker tests

#### `procesa el job y llama a Resend API con el HTML renderizado`

**Verdict: ✅ COVERED**

- `'calls ResendClient.sendEmail exactly once'` — `email.worker.spec.ts:150`
- `'forwards to, subject and html from the job payload'` — `email.worker.spec.ts:164`
- `'uses renderedHtml from the payload without re-rendering'` — `email.worker.spec.ts:176`

#### `reintenta 3 veces con backoff exponencial en error de red`

**Verdict: ⚠️ PARTIAL — GAP G3**

The ticket requirement has two parts: (a) network errors cause retries, and (b) the retry policy
is `attempts: 3` with exponential backoff. Part (a) is covered; part (b) is not asserted.

**Part (a) covered:**

- `'re-throws a non-ResendError (network failure) for BullMQ backoff'` — `email.worker.spec.ts:370`
- `'calls moveToDeadLetter when attemptsMade equals max attempts (3)'` — `email.worker.spec.ts:417`

**Part (b) NOT covered — where the config lives:**

`EMAIL_JOB_OPTIONS = { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } }` is defined
in `email.worker.config.ts` and **passed to the `Queue` constructor as `defaultJobOptions`** in
`email.service.ts` line 23:

```ts
// email.service.ts
new Queue(EMAIL_QUEUE_NAME, {
  defaultJobOptions: EMAIL_JOB_OPTIONS,
  ...
})
```

The `email.service.spec.ts` mocks `Queue` but the existing tests do not capture or assert the Queue
constructor arguments, so `defaultJobOptions.attempts` and `defaultJobOptions.backoff` are never
verified.

**Correction for task 04:** The explicit `attempts: 3` + `backoff: exponential` assertion belongs
in **`email.service.spec.ts`** (where the Queue is constructed with `defaultJobOptions`), not in
`email.worker.spec.ts` (where the Worker constructor does NOT receive these options). Task 04's
file list should be updated accordingly when implemented.

**Action required:** Capture the `Queue` constructor call in `email.service.spec.ts` and assert:

```ts
expect(Queue).toHaveBeenCalledWith(
  expect.any(String),
  expect.objectContaining({
    defaultJobOptions: expect.objectContaining({ attempts: 3 }),
  }),
);
```

See task 04 (note: task 04 file currently lists `email.worker.spec.ts` — implementor must use
`email.service.spec.ts` instead based on this finding).

#### `NO reintenta en error 422 de Resend (email inválido)`

**Verdict: ✅ COVERED**

- `'returns "no-retry" for 422'` — `email.worker.spec.ts:293`
- `'calls job.moveToFailed for a 4xx ResendError (no-retry)'` — `email.worker.spec.ts:333`
- `'does not re-throw after calling job.moveToFailed for 4xx'` — `email.worker.spec.ts:344`

#### `publica email:failed en Redis después de 3 fallos`

**Verdict: ✅ COVERED**

- `'calls moveToDeadLetter when attemptsMade equals max attempts (3)'` — `email.worker.spec.ts:417`
- `'calls publishEmailFailedEvent after moveToDeadLetter when attempts exhausted'` — `email.worker.spec.ts:450`

#### `respeta el rate limit de 100 emails/hora por tenant`

**Verdict: ✅ COVERED**

- `'calls checkRateLimit for welcome template'` — `email.worker.spec.ts:224`
- `'throws a retryable error when rate limit is exceeded'` — `email.worker.spec.ts:241`
- `'does not call sendEmail when rate limit is exceeded'` — `email.worker.spec.ts:251`

In `email.rate-limit.spec.ts`: `'passes max as 100 by default'` — `email.rate-limit.spec.ts:74`

#### `emails de reset-password no cuentan en el rate limit`

**Verdict: ✅ COVERED**

- `'skips checkRateLimit for reset-password template'` — `email.worker.spec.ts:212`
- `'skips checkRateLimit for verify-email template'` — `email.worker.spec.ts:218`

---

### Auth integration tests

#### `POST /auth/forgot-password: retorna 200 aunque el email no exista`

**Verdict: ✅ COVERED**

- `'returns 200 even when sendResetPassword resolves (user not found — silent)'` — `auth.controller.spec.ts:113`
- `'returns the same message regardless of whether user exists (anti-enumeration)'` — `auth.controller.spec.ts:119`

#### `POST /auth/forgot-password: encola el job de email en BullMQ`

**Verdict: ❌ GAP G4**

`auth.controller.spec.ts` mocks `AuthEmailService` entirely (via `useValue`), so calling
`controller.forgotPassword()` never reaches `AuthEmailService.sendResetPassword`, and therefore
never reaches `EmailService.send()`. There is no test that verifies the full wiring:

```
AuthController → AuthEmailService → EmailService.send (BullMQ enqueue)
```

The existing controller tests only verify that `authEmailService.sendResetPassword` is delegated
to — not that the downstream email is enqueued.

**Action required:** Create `apps/api/src/auth/test/auth-email-integration.spec.ts` with a real
`AuthEmailService` (not mocked at DI level) and a mocked `EmailService`. This proves the full
call chain including BullMQ enqueue. See task 05.

#### `POST /auth/reset-password: token válido cambia la contraseña`

**Verdict: ✅ COVERED**

- `'calls updatePassword with hashed new password'` — `auth.service.spec.ts:204`
- `'calls markResetTokenUsed on valid token'` — `auth.service.spec.ts:193`
- `'delegates to authService.resetPassword with token and newPassword'` — `auth.controller.spec.ts:130`

#### `POST /auth/reset-password: token usado dos veces retorna 400`

**Verdict: ✅ COVERED**

`'throws BadRequestException when token has already been used'` — `auth.service.spec.ts:173`

#### `POST /auth/reset-password: token expirado retorna 400`

**Verdict: ✅ COVERED**

`'throws BadRequestException when token is expired'` — `auth.service.spec.ts:183`

#### `POST /auth/verify-email: OTP válido verifica el email del usuario`

**Verdict: ✅ COVERED**

- `'delegates to authEmailService.verifyOtp with only the otpCode (no userId)'` — `auth.controller.spec.ts:152`
- `'returns 200 message on successful OTP verification'` — `auth.controller.spec.ts:163`

#### `POST /auth/verify-email: OTP expirado retorna 400`

**Verdict: ✅ COVERED**

`'propagates BadRequestException from verifyOtp'` — `auth.controller.spec.ts:171`

Note: the `BadRequestException` thrown when the OTP Redis key is missing (expired/invalid) is
tested in `auth-email.service.spec.ts:406`:
`'throws BadRequestException when OTP hash key is not found in Redis'`

#### `token de reset se guarda como SHA-256 (no texto plano) en DB`

**Verdict: ✅ COVERED**

- `'stores SHA-256 tokenHash, not the plaintext token'` — `auth-email.service.spec.ts:125`
- `'includes the raw token in the resetUrl (not the hash)'` — `auth-email.service.spec.ts:182`

---

## Confirmed Gap Summary

| ID     | Location                                                                         | Missing assertion                                                                                                                     | Root cause                                                                                                                     | Subtask |
| ------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **G1** | `packages/email/src/test/verify-email.spec.ts`                                   | No assertion that the OTP element has `font-family: monospace` styling                                                                | Template render output not inspected for CSS properties                                                                        | 02      |
| **G2** | `packages/email/src/test/email.service.spec.ts`                                  | No real-render test asserting HTML output contains `primaryColor` hex value                                                           | `@react-email/render` is mocked for all service tests                                                                          | 03      |
| **G3** | `packages/email/src/test/email.service.spec.ts` _(correction from task 04 spec)_ | No assertion that Queue is constructed with `defaultJobOptions.attempts === 3` and `defaultJobOptions.backoff.type === 'exponential'` | Queue constructor args never captured or asserted; `EMAIL_JOB_OPTIONS` is used in `email.service.ts`, not in `email.worker.ts` | 04      |
| **G4** | `apps/api/src/auth/test/auth-email-integration.spec.ts` _(new file)_             | No integration test proving `forgotPassword` controller call flows through to `EmailService.send` (BullMQ enqueue)                    | `auth.controller.spec.ts` mocks `AuthEmailService` entirely, breaking the full call chain                                      | 05      |

**G3 location correction:** Task 04's spec document lists `email.worker.spec.ts` as the target.
Based on this analysis, the correct target is **`email.service.spec.ts`** because `EMAIL_JOB_OPTIONS`
is passed to the Queue constructor in `EmailService`, not the Worker constructor. The Worker
constructor in `email.worker.ts` only receives `concurrency` and `connection`. The implementor of
task 04 must target `email.service.spec.ts`.

---

## Tests with No Equivalent Gap (Do Not Duplicate)

The following ticket requirements are **fully satisfied** by existing tests. Do not add redundant
tests for these:

- Welcome: all 4 roles, primaryColor CTA, temporaryPassword — `welcome.spec.ts` ✅
- Reset-password: resetUrl, ipAddress, color — `reset-password.spec.ts` ✅
- Verify-email: expiry minutes — `verify-email.spec.ts` ✅
- Invite-user: inviterName, workspaceName — `invite-user.spec.ts` ✅
- BaseLayout: logo and fallback — `base-layout.spec.ts` ✅
- EmailService: enqueue without Resend, jobId — `email.service.spec.ts` ✅
- Worker: processJob calls Resend, no-retry on 422, DLQ after 3 failures, rate-limit, reset-password bypass — `email.worker.spec.ts` ✅
- Auth: forgot-password 200 (both branches), reset-password valid/used/expired, verify-email valid/expired, SHA-256 storage — `auth.controller.spec.ts` + `auth.service.spec.ts` + `auth-email.service.spec.ts` ✅

---

## Acceptance Criteria for Task 01

- [x] This document accurately reflects the test inventory as of May 2026.
- [x] All four gaps G1–G4 are confirmed with exact file locations and `it()` descriptions.
- [x] G3 location correction is documented (target is `email.service.spec.ts`, not `email.worker.spec.ts`).
- [x] Test location conventions are explained and justified.
- [x] Retroactive test hardening rationale is documented.
- [x] No spec files modified.
- [x] No source files modified.
- [x] No dependencies added.

---

## Validation Commands

```bash
# Verify test counts match baseline:
cd packages/email && npx jest --no-coverage 2>&1 | grep "Tests:"
# Expected: Tests: 169 passed, 169 total

cd apps/api && npx jest --testPathPattern="auth" --no-coverage 2>&1 | grep "Tests:"
# Expected: Tests: ~226 passed

# Verify coverage baseline:
cd packages/email && npx jest --coverage 2>&1 | grep "All files"
# Expected: Lines ~96.74%

cd apps/api && npx jest --coverage 2>&1 | grep "auth.*service\|auth.*repo"
# Expected: Lines ≥ 95% for auth service/repository
```
