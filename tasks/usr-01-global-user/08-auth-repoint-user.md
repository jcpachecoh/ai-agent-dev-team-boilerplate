# USR-01 Task 08 — Auth Repoint to User

## Goal

Repoint the email/password `AuthModule` from `UserTestLab` to the global `User` model. Enforce tenant-scoped email lookup, bcrypt cost 12, and ensure `passwordHash` is never returned in default query responses.

**Depends on:** Task 07 (seed provides `Role`, global `User`, and linked `OperationalUser` rows for local testing).

---

## Scope

- Replace all `UserTestLab` / `prisma.userTestLab` usage in the email auth stack with global `User` / `prisma.user`.
- Enforce tenant-scoped lookups via `(tenantId, email)` compound unique.
- Update signup/login/forgot-password/resend-verification to require `x-tenant-id` header.
- Update signup DTO and service to satisfy required `User` fields (`cedula`, `documentType`, `roleId` resolved server-side).
- Split repository read paths into safe vs credential methods; never expose secrets in public responses.
- Update all auth tests under `apps/api/src/auth/test/`.
- Ensure signup/login/refresh/logout/reset-password flows work against `User`.
- Run typecheck and auth-related tests.

**UserTestLab after this task:** remains in schema and seed for TestLab domain tables (projects, test cases, etc.). Email auth must **stop using** `UserTestLab` entirely — no references to `userTestLab` or `UserTestLab` in allowed auth files.

---

## Out of scope

- No changes to `MesAuthModule` / MES cédula + PIN auth (continues using `OperationalUser`).
- No gateway GraphQL changes (task 10 or follow-up).
- No changes to `schema.prisma`, migrations, or `seed.ts`.
- No removal of `UserTestLab` from schema or seed.
- No changes to `auth.module.ts` unless required for compilation (prefer no wiring changes — repository/service swap only).
- No changes to `apps/api/src/app.module.ts`.
- No wiring `AuditLog` or `PasswordResetToken` Prisma relations to `User`.
- No Postman collection updates (task 10 or follow-up).
- No `verifyOtp` → `User.emailVerified` persistence (pre-existing gap).
- No lockout implementation via `loginAttempts` / `lockedUntil` unless trivially added during login guard (optional; not required for acceptance).

### Note on `auth.module.ts`

If provider wiring requires no changes (repository swap only), do not touch `auth.module.ts`. If compilation fails without module changes, stop and report before modifying forbidden files.

---

## Allowed files

Planning analysis (Task 08 pre-work) confirmed repository-only changes are insufficient. **Approved scope expansion:**

- `apps/api/src/auth/interfaces/auth.interfaces.ts`
- `apps/api/src/auth/repository/auth.repository.ts`
- `apps/api/src/auth/service/auth.service.ts`
- `apps/api/src/auth/service/auth-email.service.ts`
- `apps/api/src/auth/controller/auth.controller.ts`
- `apps/api/src/auth/controller/dto/**`
- `apps/api/src/auth/test/**`

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/mes/**`
- `apps/api/src/auth/auth.module.ts` (unless compilation blocker — stop and report first)
- `apps/api/src/app.module.ts`
- Any file under `packages/`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Approved design decisions

### Tenant strategy

Align with MES and supply-items: use required **`x-tenant-id` header**.

| Endpoint                         | Tenant required?    | Notes                                                                  |
| -------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `POST /auth/signup`              | Yes — `x-tenant-id` | Compound lookup/create on `(tenantId, email)` and `(tenantId, cedula)` |
| `POST /auth/login`               | Yes — `x-tenant-id` | Compound lookup on `(tenantId, email)`                                 |
| `POST /auth/forgot-password`     | Yes — `x-tenant-id` | Replace hardcoded `tenantId: 'global'` in controller                   |
| `POST /auth/resend-verification` | Yes — `x-tenant-id` | Same                                                                   |
| `POST /auth/refresh`             | No                  | Token/`sub` based                                                      |
| `POST /auth/logout`              | No                  | JWT `sub` based                                                        |
| `POST /auth/reset-password`      | No                  | Reset token hash lookup; `userId` on token is globally unique          |
| `POST /auth/verify-email`        | No                  | OTP/Redis based                                                        |

Do **not** use synthetic tenant `'global'` for user lookup — seed roles/users exist under `palos-de-lena`.

### Signup strategy

- **Required:** `email`, `password`, `cedula`, `documentType` (enum: CC, CE, PASAPORTE, TI, PEP).
- **Optional:** `roleCode` — defaults to **`OPERATOR`** when omitted.
- **Server-side:** resolve `roleId` via `roles(tenantId, code)`; reject unknown/inactive roles.
- **Conflict checks:** `(tenantId, email)` and `(tenantId, cedula)` before create.
- **Password:** bcrypt cost **12** (`SALT_ROUNDS = 12`); never store plain text.
- **`name`:** not persisted — `User` has no `name` field (see name strategy below).

Suggested repository helper: `findRoleByTenantAndCode(tenantId, code)`.

### Name / display strategy

- Global `User` has **no `name` field**.
- Remove `name` from signup persistence path; optionally keep `name` on DTO as deprecated/ignored or remove from DTO (implementation choice — must not write to DB).
- Email flows use **`email` as display fallback** (e.g. reset-password `userName`, resend-verification caller payload).
- `IAuthEmailService` methods that accept `{ name: string }` from external callers (welcome, invite) remain unchanged — those names come from caller DTOs, not from `User`.

### PasswordHash / refreshToken exposure strategy

Repository must split methods:

| Method purpose                                                           | Returns             | Fields                                                          |
| ------------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------- |
| Public lookup (forgot-password, resend-verification, service public API) | Safe user           | Excludes `passwordHash`, `refreshToken`                         |
| Credential lookup (login)                                                | Credential user     | Includes `passwordHash`; used only inside `AuthService.login`   |
| Refresh lookup                                                           | Refresh user        | Includes `refreshToken`; used only inside `AuthService.refresh` |
| Write paths (`createUser`, `updatePassword`, `saveRefreshToken`)         | Safe user or `void` | Never return secrets to controller                              |

**Rule:** public/service/controller responses must **never** expose `passwordHash` or `refreshToken`. Add test assertions where practical.

Suggested types in `auth.interfaces.ts`:

- `AuthUserSafe` — omit secrets
- `AuthUserWithPassword` — internal login only
- `AuthUserWithRefresh` — internal refresh only

### UserTestLab coexistence

- **`UserTestLab` stays** in `schema.prisma` and `seed.ts` for TestLab FK domains.
- **Email auth stops using it** — zero `userTestLab` / `UserTestLab` references in allowed Task 08 files after completion.

### Dev login after Task 08

Seed global users (Task 07) — use with **`x-tenant-id: palos-de-lena`**:

| Email                            | Password       |
| -------------------------------- | -------------- |
| `mes-owner@palos-de-lena.dev`    | `TestPass123!` |
| `mes-operator@palos-de-lena.dev` | `TestPass123!` |

**Not valid for email auth after Task 08:**

| Email                | Reason                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `test@restopsiq.dev` | Remains **TestLab-only** (`users_testlab`); not in global `users` table |

Document fixture change in task report; Postman updates deferred to task 10.

### `AuthEmailRepository`

Already uses `PasswordResetToken.userId` as orphan string — no schema change. After repoint, new reset tokens reference global `User.id`. Legacy tokens pointing at TestLab user IDs will not reset global users (acceptable).

---

## Implementation notes

Suggested order:

1. Define safe/credential types and updated `IAuthRepository` / `IAuthService` in `auth.interfaces.ts`.
2. Implement `AuthRepository` against `prisma.user` with split select paths + `findRoleByTenantAndCode`.
3. Update DTOs and controller (`x-tenant-id` header, signup fields).
4. Update `AuthService` (tenant-aware signup/login; safe return types).
5. Update `AuthEmailService` (tenant-scoped lookup; email display fallback).
6. Update all files under `auth/test/`.
7. Validate.

---

## Acceptance criteria

- [x] No references to `UserTestLab` or `userTestLab` in allowed auth files.
- [x] `AuthRepository` uses `prisma.user` for all user CRUD.
- [x] Signup/login/forgot-password/resend-verification require `x-tenant-id` header.
- [x] Signup requires `cedula` and `documentType`; optional `roleCode` defaults to `OPERATOR`; `roleId` resolved server-side.
- [x] Repository splits safe vs credential read methods; public paths exclude `passwordHash` and `refreshToken`.
- [x] Email flows use email as display fallback (no dependency on `User.name`).
- [x] Auth tests updated and passing.
- [x] `pnpm --filter=@restopsiq/api typecheck` passes.
- [x] `pnpm --filter=@restopsiq/api test -- --testPathPattern=auth` passes.
- [x] MES auth module untouched and still passes its existing tests.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth
node scripts/validate-structure.js
```

---

## Risks

| Risk                                        | Notes                                                          |
| ------------------------------------------- | -------------------------------------------------------------- |
| Global email lookup breaks                  | Must switch to `(tenantId, email)` compound lookup             |
| `passwordHash` leaked in API response       | Split repository methods + test assertions                     |
| Missing `x-tenant-id` on login/signup       | Required header; document in Swagger                           |
| `test@restopsiq.dev` Postman fixture breaks | Use `mes-owner@…` + `palos-de-lena`; Postman update in task 10 |
| Legacy reset tokens (TestLab userId)        | Won't reset global User; tokens expire                         |
| Role escalation on signup                   | Validate `roleCode` server-side; default OPERATOR              |
| `auth.module.ts` forbidden but needed       | Stop and escalate rather than modifying forbidden file         |

---

## Stop rule

**Stop after this task.** Report files changed, validation results, tenant-resolution decision, and dev fixture change. **Do not proceed to task 09 (backfill operational users) without explicit approval.**
