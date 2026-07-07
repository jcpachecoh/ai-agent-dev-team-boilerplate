# AUTH-10 Task 02 — Integration, E2E, Coverage & Postman

## Goal

Add integration/E2E coverage for main auth flows and error paths, cross-token rejection, logout→refresh/me behavior, Postman/README audit verification, and document scoped coverage ≥90% for auth/audit modules.

**Depends on:** Task 01 (MES `userId` fix must land first for DB assertions).

---

## Scope

### Integration tests (HTTP or module + supertest)

Prefer new files under `apps/api/src/auth/test/` and `apps/api/src/mes/auth/test/`:

| File (proposed)                            | Covers                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `auth-login-audit.integration.spec.ts`     | REST login SUCCESS/FAILED/LOCKED; optional Prisma mock asserting `createLoginAudit` payload |
| `auth-session.integration.spec.ts`         | login → me → logout → refresh 403/401                                                       |
| `mes-auth-login-audit.integration.spec.ts` | MES login/logout audit payloads; rate-limit FAILED                                          |
| `auth-cross-token.integration.spec.ts`     | Wrong bearer on protected routes                                                            |

Use **mocked** `AuditRepository` or test Prisma when `DATABASE_URL` is set — document skip pattern in file header.

### E2E (optional, env-gated)

- Add `apps/api/src/auth/test/auth-audit.e2e-spec.ts` (or `test/e2e/auth-audit.e2e-spec.ts`) matching `jest.e2e.config.js` (`*.e2e-spec.ts`).
- Run via `pnpm --filter=@restopsiq/api test:e2e` only when DB available.
- Assert `login_audits` rows for at least: global SUCCESS + FAILED, MES SUCCESS with `userId` null (operator seed), MES SUCCESS with linked `userId` (owner seed).

### Cross-token matrix

| Token                | Route                                              | Expected                          |
| -------------------- | -------------------------------------------------- | --------------------------------- |
| Global `accessToken` | `GET /api/plant/...` (e.g. workstations)           | 401 Unauthorized                  |
| `mesAccessToken`     | `GET /api/auth/me`                                 | 401                               |
| `mesAccessToken`     | `GET /api/supply-items` (or GraphQL `supplyItems`) | 401 or PermissionDenied per guard |
| Global `accessToken` | `GET /api/mes/auth/me`                             | 401                               |

### Logout → refresh / me

- Global: login → logout → `POST /api/auth/refresh` → 403; `GET /api/auth/me` with old access → 401.
- MES: login → logout (blacklist jti) → `GET /api/mes/auth/me` → 401.

### RBAC (AUTH-09)

- Global OPERATOR without permission → GraphQL `supplyItems` or REST supply-items → 403 PermissionDenied (reuse seed emails).
- Document in test name; do not fix unrelated RBAC metadata failures outside auth scope.

### Global lockout test

- Task 01b implemented progressive lockout (5 failures → 15 min lock). Integration test: 5 wrong passwords → account locked → 6th attempt logs `LOCKED` without increment; successful login after lock expires resets attempts (or use time mock / seeded `lockedUntil` for locked-path-only test).

### Email verification

- Optional: extend `auth-email-integration.spec.ts` or separate spec with mocked Redis — assert **no** LoginAudit for verify/resend unless product adds it.

### Postman & README

- `postman/restopsiq-api.collection.json`: extend **08 — Audit Verification** with SQL for LOGOUT, REFRESH_TOKEN, MES `userId IS NULL` vs `userId IS NOT NULL`.
- `postman/README.md`: update MES FK caveat (fixed after Task 01); manual verification checklist for `login_audits`.
- **08 — Audit Verification** folder: steps after Task 01 owner/operator login.
- Do not add Newman scripts that depend on live email worker.

### Coverage report

Run scoped command and attach summary to completion report:

```bash
cd apps/api && pnpm exec jest --coverage \
  --testPathPattern='(auth|audit|mes/auth)/test/' \
  --collectCoverageFrom='auth/**/*.ts' \
  --collectCoverageFrom='audit/**/*.ts' \
  --collectCoverageFrom='mes/auth/**/*.ts' \
  --coveragePathIgnorePatterns='test/' \
  --coverageReporters=text-summary
```

**Target:** ≥90% **statements** and **lines** for combined auth/audit/mes-auth scope; improve **branches** toward 85%+ if feasible without unrelated modules.

## Out of scope

- `apps/gateway/**`
- Web/plant app tests
- New audit read API
- Newman automated DB assertions
- Fixing unrelated failing tests (e.g. supply-items REST metadata) unless blocking auth test run — report and stop

## Allowed files

- `apps/api/src/auth/test/**` (new or extend integration/e2e specs)
- `apps/api/src/mes/auth/test/**`
- `apps/api/src/audit/test/**` — only if needed for integration hooks
- `apps/api/src/test/smoke.spec.ts` — extend cross-token smoke only if minimal
- `apps/api/jest.e2e.config.js` — only if test path roots need adjustment
- `postman/restopsiq-api.collection.json`
- `postman/README.md`
- `postman/local.environment.json` — only new variables for audit docs if needed

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/service/auth.service.ts` — no login behavior changes
- `apps/api/src/mes/auth/service/mes-auth.service.ts` — Task 01 only (unless hotfix for test blocker)
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- Unrelated modules (`supplyitems`, `plant`, etc.) except reading guards for cross-token tests

## Acceptance criteria

- [x] Integration tests cover global login SUCCESS + FAILED (+ LOCKED via fixture).
- [x] Integration tests cover MES login SUCCESS/FAILED and logout audit invocation.
- [x] Cross-token tests: global token cannot access MES plant route; MES token cannot access global `/api/auth/me` and supply-items.
- [x] Logout invalidates refresh (global) and me (MES) in tests.
- [x] Postman **08** documents SQL for all LoginAudit statuses used in production paths.
- [x] README troubleshooting updated (MES FK caveat resolved).
- [x] Scoped coverage command run; report shows ≥90% statements/lines or lists gaps + follow-up.
- [x] At least one e2e-spec **or** documented decision to use integration-only with `test:e2e` skip in CI.

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='auth.*integration|mes-auth.*integration|auth-cross-token|auth-audit|auth-session'
# Optional when DATABASE_URL set:
pnpm --filter=@restopsiq/api test:e2e
```

Manual (document in report):

1. Run Postman **01 → 04** and **02** login flows, then **08** SQL.
2. Confirm `login_audits` rows for PASSWORD and PIN with correct `userId`.

## Risks

| Risk                                   | Mitigation                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------- |
| CI lacks Postgres                      | Default to mocked Prisma; e2e `describe.skipIf(!process.env.DATABASE_URL)` |
| Flaky Redis rate limit                 | Mock `MesAuthRedisService` in integration tests                            |
| Full API bootstrap slow                | Import focused modules + `supertest` on subset                             |
| supply-items RBAC spec already failing | Run auth-scoped pattern only; note unrelated failure in report             |

## Stop rule

Stop after validation, coverage report, and Postman doc updates. Do not start new tickets (AUTH-11, gateway, etc.).
