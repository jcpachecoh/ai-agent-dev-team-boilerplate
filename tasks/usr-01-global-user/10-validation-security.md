# USR-01 Task 10 — Validation & Security Review

## Goal

Validate the complete USR-01 epic end-to-end: schema integrity, migrations, seed, email auth against `User`, MES auth unchanged on `OperationalUser`, and security rules — especially that `passwordHash` is never exposed in default API responses.

**Depends on:** Tasks 01–09 complete.

---

## Scope

- Run full validation command suite (see below).
- Manual smoke tests (Postman/curl documented).
- Security checklist review.
- Postman/manual testing doc updates for USR-01 auth changes.
- Document known deferred items.

---

## Task 10 execution results (2026-05-29)

### Validation commands

| Command                                                                   | Result                                             |
| ------------------------------------------------------------------------- | -------------------------------------------------- |
| `cd apps/api && pnpm prisma validate`                                     | ✅ Pass                                            |
| `cd apps/api && pnpm prisma migrate deploy`                               | ✅ Pass — 14 migrations, no pending                |
| `cd apps/api && pnpm prisma generate`                                     | ✅ Pass                                            |
| `cd apps/api && pnpm prisma db seed`                                      | ✅ Pass                                            |
| `node scripts/validate-structure.js`                                      | ✅ Pass — 6 modules                                |
| `pnpm --filter=@restopsiq/api typecheck`                                  | ✅ Pass                                            |
| `pnpm --filter=@restopsiq/api test -- --testPathPattern='auth\|mes/auth'` | ✅ Pass — 19 suites, 228 tests                     |
| `pnpm --filter=@restopsiq/api run test:cov`                               | ✅ Pass — 36 suites, 415 tests                     |
| `npx tsx scripts/backfill-operational-users.ts --dry-run`                 | ✅ Pass — 0 writes; 2 orphans skipped (no mapping) |

### Auth global User verification

| Check                                            | Result                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| Email auth uses `prisma.user`, not `UserTestLab` | ✅ Pass — no `userTestLab` references under `apps/api/src/auth/`          |
| `UserTestLab` seed still exists                  | ✅ Pass — `test@restopsiq.dev` in `users_testlab`                         |
| Seeded global Users                              | ✅ Pass — `mes-owner@palos-de-lena.dev`, `mes-operator@palos-de-lena.dev` |
| Seeded OperationalUsers linked                   | ✅ Pass — owner/operator `userId` set to global User ids                  |
| `OperationalUser.userId` nullable                | ✅ Pass — schema + 2 legacy orphans remain unlinked                       |

### MES auth regression verification

| Check                                                        | Result                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| MES auth still uses `OperationalUser` (cedulaHash + pinHash) | ✅ Pass — `mes-auth` tests unchanged, 228 auth/mes tests pass |
| MES login independent of global User JWT                     | ✅ Pass — Postman MES Auth folder unchanged except docs       |

### Security checklist

| Item                                                                | Result                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `passwordHash` excluded from public repository selects              | ✅ Pass — `AUTH_USER_SAFE_SELECT` omits it; tests in `auth.repository.spec.ts`  |
| `refreshToken` excluded from public repository selects              | ✅ Pass — only `findByIdForRefresh` includes it                                 |
| `passwordHash` / `refreshToken` not in service/controller responses | ✅ Pass — tokens only `{ accessToken, refreshToken }`; integration tests assert |
| Bcrypt cost 12 on password writes                                   | ✅ Pass — `SALT_ROUNDS = 12`; test added in `auth.service.spec.ts`              |
| Login rejects `isActive=false`                                      | ✅ Pass — `auth.service.spec.ts`, `auth-global-user-login.regression.spec.ts`   |
| Login rejects `deletedAt != null`                                   | ✅ Pass — `auth.service.spec.ts`                                                |
| Refresh rejects inactive / soft-deleted users                       | ✅ Pass — `auth.service.spec.ts`                                                |
| Tenant-scoped email lookup                                          | ✅ Pass — `tenantId_email` unique; cross-tenant signup test added               |
| Tenant-scoped cédula uniqueness                                     | ✅ Pass — `ConflictException` test; DB `@@unique([tenantId, cedula])`           |

### Tenant uniqueness verification

| Scenario                                             | Result                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| Same email rejected within same tenant               | ✅ Pass — signup/login use `findByTenantAndEmail`             |
| Same cédula rejected within same tenant              | ✅ Pass — signup uses `findByTenantAndCedula`                 |
| Same email allowed across tenants (when roles exist) | ✅ Pass — tenant-scoped lookup; unit test for tenant B signup |

### OperationalUser backfill verification

| Scenario                        | Result                                            |
| ------------------------------- | ------------------------------------------------- |
| Seed links known cédulas        | ✅ Pass — 2 seeded OperationalUsers linked        |
| Dry-run makes no writes         | ✅ Pass — CLI `--dry-run` exit 0                  |
| Orphans without mapping skipped | ✅ Pass — 2 legacy rows, `skippedNoMapping: 2`    |
| Idempotent re-run               | ✅ Pass — seed backfill `linked: 0` on second run |

### Deferred FK verification

| Item                                          | Result                                                               |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `AuditLog` → `User` Prisma relation           | ✅ Deferred — no `user` relation on `AuditLog` model                 |
| `PasswordResetToken` → `User` Prisma relation | ✅ Deferred — orphan `userId` field only                             |
| Migration comments document deferral          | ✅ Pass — `20260529130000_usr_01_global_user_identity/migration.sql` |

### Postman / manual testing updates

| Item                                                       | Result                                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `x-tenant-id: palos-de-lena` on signup/login/forgot/resend | ✅ Updated in collection                                                                  |
| Login credentials → mes-owner/operator                     | ✅ Updated in `local.environment.json`, `recipes-local.environment.json`, collection vars |
| `test@restopsiq.dev` marked TestLab-only                   | ✅ `testLabEmail` var + README note                                                       |
| Signup body: cedula, documentType, optional roleCode       | ✅ Collection pre-request + body updated                                                  |
| Refresh/logout/reset-password no x-tenant-id               | ✅ Documented in collection descriptions + README                                         |

---

## Acceptance criteria

- [x] `pnpm prisma validate` passes.
- [x] `pnpm db:seed` passes with USR-01 migrations applied.
- [x] `pnpm --filter=@restopsiq/api typecheck` passes.
- [x] Auth + MES auth tests pass.
- [x] `node scripts/validate-structure.js` passes.
- [x] Email login credentials documented (Postman uses global User).
- [x] MES login credentials unchanged (cédula + PIN).
- [x] Security checklist reviewed — all pass.
- [x] Deferred items documented below.
- [x] Postman docs updated — no misleading `UserTestLab` email auth references.

---

## Known deferred items (post-USR-01)

- Wire `AuditLog.userId` FK to global `User` (after legacy TestLab ID migration strategy).
- Wire `PasswordResetToken.userId` FK to global `User`.
- `verifyOtp` does not set `User.emailVerified`.
- Gateway GraphQL `User` type may still map to `OperationalUser`.
- `OperationalRole` enum vs `Role` table dual representation.
- Production backfill requires ops JSON mapping for plain cédulas (2 local orphans remain).
- `OperationalUser.userId` NOT NULL enforcement (future).
- `EmployeeProfile`, `PayrollProfile`, `BankAccount`, `EmergencyContact`, `UserPermission`, `LoginAudit` relations.
- Plain `cedula` storage compliance review.
- Seed console still prints legacy “TestLab (email auth, no tenant)” label — cosmetic only.

---

## Epic closure recommendation

**USR-01 can be closed.** All Task 10 validation commands pass, security checks pass, Postman/manual docs updated, and deferred items are documented for follow-up tickets.

---

## Stop rule

**Stop after this task.** Do not start unrelated work without a new ticket.
