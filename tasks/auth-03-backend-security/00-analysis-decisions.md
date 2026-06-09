# AUTH-03 — Analysis & Decisions (compact)

## Goal

Analyze backend security for AUTH-03 and define a **3-task** implementation plan. No code in this step.

## Architecture (fixed)

1. Security logic lives in **`apps/api`** (`AuthService`, `MesAuthService`, repositories, guards).
2. **`apps/gateway`** GraphQL auth **delegates to REST** — no bcrypt, lockout, or token issuance in gateway.
3. DB `@@unique` constraints are required; service-level checks + safe errors are required.
4. Global (`User` email/password) and operational (`OperationalUser` cédula/PIN) auth stay separate; `accessToken` ≠ `mesAccessToken`.

---

## Current status by requirement

| #   | Requirement            | Status                     | Gap                                                                                                                                                                                                           |
| --- | ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Email unique / tenant  | **Done**                   | DB `@@unique([tenantId, email])`; `signup` pre-check → 409; tests exist. Race: no `P2002` → 409 fallback.                                                                                                     |
| 2   | Cédula unique / tenant | **Done**                   | DB `@@unique([tenantId, cedula])`; signup pre-check → 409; MES `createUser` checks `cedulaHash`. User stores plaintext cédula; OperationalUser stores hash — link via `userId`, not same column.              |
| 3   | Password **> 8**       | **Done (Task 01)**         | Min length **9** on API DTOs and gateway Zod.                                                                                                                                                                 |
| 4   | Bcrypt cost **12**     | **Done**                   | `SALT_ROUNDS = 12` in auth + MES services, refresh hash, seed; unit tests assert cost 12.                                                                                                                     |
| 5   | Lockout **5** failures | **Done (global, Task 02)** | Global: 5 attempts, 15 min lock, `password_invalido` / `cuenta_bloqueada` audit reasons. **MES unchanged:** 3 PIN attempts + 15 min + Redis IP rate limit (5/hour) — intentional difference documented below. |
| 6   | Token expiration       | **Done (Task 02 verify)**  | Global access 15m, refresh 7d, rotation on refresh, logout clears refresh hash; JWT `ignoreExpiration: false` tested. MES access 8h, logout blacklists `jti`. No REST MES refresh route.                      |
| 7   | Sensitive fields       | **Done (Task 03)**         | REST/GraphQL tests; no `passwordHash`/`pinHash`/`cedulaHash` in responses; JWT tokens only where expected.                                                                                                    |
| 8   | Postman negatives      | **Done (Task 03)**         | Folder `05 AUTH-03 Security Validation` + GraphQL weak/duplicate cases; README documents lockout/JWT limits.                                                                                                  |

---

## Why only 3 implementation tasks

| Task   | Bundles                                        | Rationale                                                                                                                                      |
| ------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **01** | Uniqueness + password + bcrypt                 | Same surfaces (DTOs, validation, signup/password flows, gateway Zod); bcrypt already correct — mostly verify + password min length.            |
| **02** | Lockout + tokens                               | Both touch `AuthService.login` / refresh / guards; global lockout is the main missing feature; token behavior largely exists — verify + tests. |
| **03** | Sensitive fields + GraphQL + Postman + closure | Read-only review plus collection/tests; no new business rules.                                                                                 |

Splitting into 9 tasks would duplicate validation commands and file allow-lists for tightly coupled auth code paths.

---

## Task sequence

1. `01-uniqueness-password-policy.md`
2. `02-lockout-token-expiration.md`
3. `03-sensitive-fields-postman-validation.md`

**Recommended first implementation:** **Task 01** — small, establishes password rule and P2002 handling before lockout edits `AuthService`.

---

## Out of scope (entire epic)

- Prisma schema/migrations (constraints already exist).
- `package.json` / lockfile changes unless explicitly approved later.
- Gateway implementing security logic (only validation parity + delegation review in task 03).
- Changing MES lockout from 3 → 5 unless task 02 explicitly decides and documents (optional sub-scope in 02).

---

## MES lockout vs global (Task 02 decision)

- **Global `User` (email/password):** `MAX_LOGIN_ATTEMPTS = 5`, `LOCK_DURATION_MS = 15 minutes` — per AUTH-03 ticket.
- **MES `OperationalUser` (cédula/PIN):** remains **`MAX_ATTEMPTS = 3`** with the same 15-minute lock window, plus **Redis IP rate limit** (5 attempts/hour per IP). Plant-floor PIN auth is intentionally stricter; do not unify to 5 without product approval.

---

## Stop rule

**AUTH-03 epic:** Tasks 01–03 implemented. Epic can be closed pending PR review.

**Known non-blocking:** Gateway resolver integration tests (`auth-delegation.integration.test.ts`) fail with `Cannot find module '../builder'` — Task 03 uses `auth-types.security.test.ts` (source inspection) instead.
