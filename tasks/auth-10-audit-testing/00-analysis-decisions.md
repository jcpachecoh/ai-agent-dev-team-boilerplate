# AUTH-10 Task 00 — Analysis & Decisions

## Goal

Analyze LoginAudit coverage, auth/audit test gaps, integration/E2E feasibility, and Postman audit verification. Document decisions and a two-task implementation sequence. **No code changes in this task.**

**Depends on:** USR-05 (LoginAudit schema + service), AUTH-02 (GraphQL auth), AUTH-03 (security/lockout context), AUTH-07 (logout), AUTH-08 (User + OperationalUser coexistence), AUTH-09 (RBAC).

---

## Scope

- Inventory `LoginAudit` schema, persistence, and FK swallow behavior.
- Compare global `AuthService` vs `MesAuthService` audit call sites and `userId` semantics.
- Map REST vs GraphQL IP / User-Agent forwarding.
- Baseline unit test coverage for `auth`, `audit`, `mes/auth` modules.
- Identify integration/E2E and Postman gaps.
- Produce task files `01-loginaudit-completeness.md` and `02-integration-e2e-coverage.md`.

## Out of scope

- Implementation in `apps/api/src/**`, `postman/**`, Prisma, seed, or package files.
- Global progressive lockout implementation (AUTH-03) unless a gap blocks LoginAudit LOCKED rows.
- Monorepo-wide coverage inflation (gateway, web, plant apps).

## Allowed files

- `tasks/auth-10-audit-testing/**`

## Forbidden files

- `apps/api/src/**`
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

## Acceptance criteria

- [x] MES `userId` FK bug documented with correct mapping rule.
- [x] Global and MES LoginAudit event matrix documented (including intentional omissions).
- [x] GraphQL IP/UA gap documented with in-scope recommendation.
- [x] Scoped coverage baseline recorded (command + percentages).
- [x] E2E strategy documented (no `*.e2e-spec.ts` today; proposed file locations).
- [x] Tasks 01–02 exist with scope, allowed/forbidden files, validation, risks, stop rules.

## Validation commands

```bash
test -f tasks/auth-10-audit-testing/00-analysis-decisions.md
test -f tasks/auth-10-audit-testing/01-loginaudit-completeness.md
test -f tasks/auth-10-audit-testing/02-integration-e2e-coverage.md
```

## Risks

| Risk                                         | Mitigation                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Silent P2003 swallow hides broken MES audits | Task 01 fixes `userId`; add unit tests asserting `OperationalUser.userId` mapping                 |
| >90% interpreted as whole API                | Ticket scope = `auth` + `audit` + `mes/auth` services/repos; exclude `*.module.ts` from threshold |
| E2E needs DB + Redis                         | Prefer supertest module tests + optional `*.e2e-spec.ts` behind env flag                          |
| Postman cannot assert DB rows                | SQL docs + README steps only; no Newman DB dependency                                             |

## Stop rule

Stop after task files 00–02 exist. Do not implement AUTH-10 code in this task.

---

## 1. LoginAudit schema and repository

**Model** (`apps/api/prisma/schema.prisma`): `tenantId`, nullable `userId` → `User.id`, `identifier`, `authMethod`, `status` (`SUCCESS` \| `FAILED` \| `LOCKED` \| `LOGOUT`), `failureReason`, `ipAddress`, `userAgent`, `deviceInfo`, `createdAt`.

**OperationalUser.id must not be stored in `LoginAudit.userId`.** Only global `User.id` or `null`.

**`AuditRepository.createLoginAudit`:** On Prisma `P2003` (FK violation), logs to `console.error` and **returns without throwing** — failed logins can appear to succeed at HTTP layer while no row is persisted. This masks the MES bug.

**`OperationalUser`** has optional `userId` (FK to `User`). Seed/backfill links MES owner to global User (`tasks/usr-01-global-user/09-backfill-operational-users.md`).

---

## 2. Global auth LoginAudit coverage (current)

| Event                   | Logged? | Status           | Notes                                                             |
| ----------------------- | ------- | ---------------- | ----------------------------------------------------------------- |
| Login success           | Yes     | SUCCESS          | `userId` = `User.id`, identifier = email                          |
| Wrong password          | Yes     | FAILED           | Does **not** increment `loginAttempts` (only reads `lockedUntil`) |
| Unknown / inactive user | Yes     | FAILED           | `userId` omitted                                                  |
| Account locked          | Yes     | LOCKED           | When `lockedUntil` > now                                          |
| Logout                  | Yes     | LOGOUT           | `authMethod` = PASSWORD                                           |
| Refresh success / fail  | Yes     | SUCCESS / FAILED | `authMethod` = REFRESH_TOKEN                                      |
| Signup                  | No      | —                | Intentional unless product requests                               |
| Change / reset password | No      | —                | AUTH-02 / USR-05 scope excluded password-change LoginAudit        |

**Global lockout (Task 01b):** `AuthService.login` implements progressive lockout — `MAX_LOGIN_ATTEMPTS = 5`, `LOCK_DURATION_MS = 15 minutes`. Failed password increments attempts; 5th failure locks and logs `LOCKED`; pre-locked users skip increment; success calls `resetLoginAttempts`. MES remains 3 attempts / separate constants.

---

## 3. MES auth LoginAudit coverage (current)

| Event           | Logged? | Status  | `userId` today         | Correct `userId`      |
| --------------- | ------- | ------- | ---------------------- | --------------------- |
| PIN success     | Yes\*   | SUCCESS | `OperationalUser.id`   | `user.userId ?? null` |
| Wrong PIN       | Yes\*   | FAILED  | `OperationalUser.id`   | linked or null        |
| Unknown cédula  | Yes     | FAILED  | `user?.id` (undefined) | `null`                |
| Inactive user   | Yes\*   | FAILED  | `OperationalUser.id`   | `user.userId ?? null` |
| Locked          | Yes\*   | LOCKED  | `OperationalUser.id`   | `user.userId ?? null` |
| Rate limit (IP) | Yes     | FAILED  | —                      | `null`                |
| Invalid format  | Yes     | FAILED  | —                      | `null`                |
| Logout          | Yes\*   | LOGOUT  | `OperationalUser.id`   | `user.userId ?? null` |

\*Rows with `OperationalUser.id` as `userId` often **fail FK** → swallowed P2003 → **no row** (documented in `postman/README.md`).

**Identifier:** Login uses masked cédula (`****` + last 4). Logout uses `cedulaHash` in `identifier` (not masked) — acceptable for Task 01 only if product agrees; otherwise add masked placeholder constant.

**Pure OperationalUser (`userId = null`):** Should persist audits with `userId = null` after fix.

**Linked OperationalUser:** Should persist `userId = User.id`.

---

## 4. IP / User-Agent

| Path                                            | IP / UA                                                   |
| ----------------------------------------------- | --------------------------------------------------------- |
| REST `AuthController` login / refresh / logout  | Passed from `x-forwarded-for` / `user-agent`              |
| REST `MesAuthController` login / logout         | Passed via `resolveClientIp`                              |
| GraphQL `MesAuthResolver.loginOperational`      | `getClientIpFromContext` + `getUserAgentFromContext`      |
| GraphQL `MesAuthResolver.logoutOperational`     | **Missing** — calls `logout(sub, jti)` only               |
| GraphQL `AuthResolver` login / refresh / logout | **Missing** — two-arg `login` / no IP on refresh & logout |

**Decision:** Include **low-risk** GraphQL forwarding in Task 01 (reuse `tenant-from-context` helpers; mirror REST). Update resolver unit tests only.

---

## 5. Testing / coverage baseline (2026-06-03)

**Unit tests present:** `auth/test/*`, `audit/test/*`, `mes/auth/test/*` (281 tests in scoped pattern).

**No `*.e2e-spec.ts` files** — `jest.e2e.config.js` exists but suite is empty.

**Scoped coverage command** (auth + audit + mes/auth implementation, excluding `test/`):

```bash
cd apps/api && pnpm exec jest --coverage \
  --testPathPattern='(auth|audit|mes/auth)/test/' \
  --collectCoverageFrom='auth/**/*.ts' \
  --collectCoverageFrom='audit/**/*.ts' \
  --collectCoverageFrom='mes/auth/**/*.ts' \
  --coveragePathIgnorePatterns='test/' \
  --coverageReporters=text-summary
```

**Baseline result:**

| Metric     | %     |
| ---------- | ----- |
| Statements | 90.05 |
| Branches   | 81.01 |
| Functions  | 79.47 |
| Lines      | 89.91 |

**Interpretation for AUTH-10:** Ticket “>90%” applies to **auth/audit/mes-auth module scope**, not entire `apps/api`. Target **≥90% statements/lines** on `auth.service.ts`, `mes-auth.service.ts`, `audit.service.ts`, `audit.repository.ts` after Task 01; Task 02 raises branches/functions via integration tests.

**Weak files:** `auth.resolver.ts` (~77% lines), `mes-auth.resolver.ts` (~78%), `audit.interceptor.ts` (included in audit folder aggregate).

**Existing integration-style:** `auth-email-integration.spec.ts` (mocked Prisma/Redis, not HTTP).

**Cross-token / RBAC:** Covered partially in `supplyitems.rbac.spec.ts`, `supplyitems.rest-rbac.spec.ts`, `permissions.guard.spec.ts` — not full HTTP cross-token E2E.

---

## 6. E2E / integration plan (Task 02)

Feasible layers (in order):

1. **HTTP integration** — `supertest` against `AppModule` or focused `AuthModule` + `MesAuthModule` + `AuditModule` with test DB / mocked Prisma for `login_audits` assertions.
2. **Optional `auth-audit.e2e-spec.ts`** — real Postgres when `DATABASE_URL` set; skip in CI otherwise.
3. **Postman** — extend **08 — Audit Verification** + README (Task 02); SQL snippets for LOGOUT, REFRESH_TOKEN, MES `userId` null vs linked.

**Flows to cover:**

- Global: signup/login/me/logout; refresh fails after logout.
- Global: failed login → LOCKED row (seed `lockedUntil` or document AUTH-03 dependency).
- MES: login/logout/me; blacklist after logout.
- Cross-token: global `accessToken` → `/api/plant/*` 401; `mesAccessToken` → `/api/auth/me`, `/api/supply-items` 401.
- RBAC: OPERATOR denied on guarded supply-items GraphQL (AUTH-09).
- Email verification: mock Redis/worker in integration test only (no Newman email worker).

---

## 7. Postman (current)

- **01 — Global Auth → 04 Login Audit Triggers** — invalid password, unknown email.
- **02 — Operational Auth** — owner/operator login, wrong PIN.
- **08 — Audit Verification** — SQL-only docs; documents MES FK caveat.
- Newman does not query `login_audits`.

**Task 02:** Add LOGOUT / refresh / MES linked-vs-unlinked verification steps; update FK caveat text after Task 01 fix.

---

## 8. Task 02 completion (testing)

- Integration specs: `auth-login-audit.integration.spec.ts`, `mes-auth-login-audit.integration.spec.ts`, `auth-session.integration.spec.ts`, `auth-cross-token.integration.spec.ts`, `auth-audit.e2e-spec.ts` (skipped without `DATABASE_URL`).
- Postman **08** + README updated for AUTH-10 LoginAudit SQL and manual flows.
- Scoped coverage (auth + audit + mes/auth): **≥90%** statements/lines (`--runInBand`).

## 9. Task sequence

| Order | Task                             | Focus                                                         |
| ----- | -------------------------------- | ------------------------------------------------------------- |
| 1     | `01-loginaudit-completeness.md`  | MES `userId` mapping, GraphQL IP/UA, unit tests               |
| 2     | `02-integration-e2e-coverage.md` | Integration/E2E, cross-token, Postman/README, coverage report |

**Recommended first implementation task:** **01 — LoginAudit completeness** (unblocks real MES audit rows in DB and Postman SQL verification).
