# USR-01 Task 00 — Analysis & Decisions

## Goal

Document the analysis, architectural decisions, and task sequence for USR-01 — User table as the global centralized identity foundation for RestOpsIQ. No implementation in this task.

**Status:** Done (analysis captured here; prior agent analysis incorporated)

---

## Scope

- Record current-state findings for user/auth-related Prisma models.
- Record blocking constraints and recommended implementation strategy.
- Define the ordered task sequence (tasks 01–10).
- Capture decisions that downstream tasks must follow.

---

## Out of scope

- Any code, schema, or migration changes.
- Implementation of any task in this epic.

---

## Allowed files

- `tasks/usr-01-global-user/00-analysis-decisions.md` (this file)
- Other files under `tasks/usr-01-global-user/` (task definitions only)

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- Any file under `apps/api/src/`
- Any file under `packages/`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Current state summary

### Two parallel identity systems

| System               | Prisma model      | Physical table               | Auth mechanism   |
| -------------------- | ----------------- | ---------------------------- | ---------------- |
| TestLab (deprecated) | `UserTestLab`     | `users` via `@@map("users")` | Email + password |
| MES (active)         | `OperationalUser` | `operational_users`          | Cédula + PIN     |

There is **no** global `User` model, **no** `Role` table, and **no** `Tenant` Prisma model. `tenantId` is a plain `String` on domain models.

### Models that do not exist yet (deferred)

The following USR-01 ticket relations are **deferred** to future epics because the models do not exist:

- `EmployeeProfile`
- `PayrollProfile`
- `BankAccount`
- `EmergencyContact`
- `UserPermission`
- `LoginAudit`

`ProductionIncident` is also not present in the schema today.

### Existing relations to repoint eventually

- `AuditLog.userId` → currently FK to `UserTestLab` / `users`
- `PasswordResetToken.userId` → orphan string (no Prisma relation by design in RES-226)

Both should eventually relate to the new global `User` model (tasks 04 and 06).

---

## Key decisions

### 1. `UserTestLab` blocks the `users` table

`UserTestLab` maps to the physical PostgreSQL table `users` through `@@map("users")`. Nine TestLab tables hold FK constraints to `users(id)`. A new global `User` model cannot own `@@map("users")` until TestLab schema is removed and the old table is dropped or replaced (tasks 01 → 02 → 04 → 06).

### 2. Do not rename `OperationalUser` directly to `User`

MES auth, JWT strategy, `OperatorSession`, plant app, gateway GraphQL, and seed fixtures all depend on `OperationalUser` today. Renaming in place would break MES in a single step. Instead, introduce a global `User` and keep `OperationalUser` as a **1:1 operational profile** linked via `userId` (task 05).

### 3. `Role` must be created

There is no `Role` model. `User.roleId` FK requires a new tenant-scoped `Role` table (task 03). The existing `OperationalRole` enum on `OperationalUser` remains temporarily until MES auth migrates to `roleId`.

### 4. `OperationalUser` keeps `cedulaHash` and `pinHash` temporarily

MES login looks up users by `tenantId + cedulaHash` and verifies `pinHash`. These fields stay on `OperationalUser` during transition. A later epic can refactor MES auth to authenticate against `User` + profile.

### 5. `User` stores `cedula` and `passwordHash` per ticket

Global identity fields on `User`:

- `cedula String` — unique per tenant (plain string per ticket; not a hash)
- `documentType` enum: CC, CE, PASAPORTE, TI, PEP
- `passwordHash String` — bcrypt cost 12, never plain text
- `email String` — unique per tenant
- Full auth lifecycle fields per ticket (lockout, soft delete, etc.)

### 6. `passwordHash` must never be exposed by default query responses

Repositories, services, controllers, GraphQL resolvers, and DTOs must exclude `passwordHash` (and `refreshToken`) from default selects and API responses. Explicit credential-update paths may write `passwordHash`; they must never return it.

### 7. Deferred profile and permission models

Do not add Prisma relations for `EmployeeProfile`, `PayrollProfile`, `BankAccount`, `EmergencyContact`, `UserPermission`, or `LoginAudit` in USR-01. Add them when those models are defined in separate tickets.

### 8. `AuditLog` and `PasswordResetToken` relate to `User` (deferred)

- Task 04: **`User` model only** — `AuditLog.userId` and `PasswordResetToken.userId` stay orphan strings (no Prisma `@relation` to `User`).
- Reason: both columns currently store **UserTestLab IDs**; DB `audit_logs` FK still targets **`users_testlab`** after bridge rename.
- Task 06: create `roles` + `users` tables; **do not** add Prisma FKs to `User` for audit/tokens yet.
- Task 08+: after auth repoint and user backfill, wire `AuditLog` → `User` and `PasswordResetToken` → `User` in schema + migration (Task 06b or post–Task 08).

### 9. TestLab removal must precede the final `User` table

~~Ordered path (superseded by strategy update below):~~

1. ~~Remove TestLab models from schema (01)~~
2. ~~Drop TestLab tables via migration (02)~~
3. Add `Role` + `DocumentType` (03) ✅
4. Add `User` model (04)
5. Link `OperationalUser` 1:1 to `User` (05)
6. Migrate DB: `roles`, new `users`, FKs (06)
7. Update seed (07)
8. Repoint email auth (08)
9. Backfill operational users (09)
10. Validation & security review (10)

### Strategy update (post Task 01 reversal)

**Keep TestLab.** Do not delete TestLab Prisma models or drop TestLab tables.

To free `@@map("users")` for the global `User` model:

1. Remap `UserTestLab` to `@@map("users_testlab")` (**task 01b** — replaces superseded tasks 01–02).
2. Migration: `ALTER TABLE "users" RENAME TO "users_testlab"`.
3. Add global `User` with `@@map("users")` (task 04 + task 06).
4. Auth continues on `UserTestLab` / `users_testlab` until email auth repoints to `User` (task 08).
5. TestLab FKs remain on `users_testlab`; no TestLab data loss.

Task 02 (drop TestLab migration) is **superseded** by the rename approach. Task 01 (remove TestLab schema) is **reverted**.

### 10. Task 08 scope (approved)

Email auth repoint requires more than repository/interfaces alone. **Approved allowed files** for Task 08 include the full email auth stack: interfaces, repository, service, `auth-email.service`, controller, DTOs, and all `auth/test/**` files. See `08-auth-repoint-user.md` for tenant header strategy, signup fields, name/passwordHash handling, and dev login fixtures.

**After Task 08:** `UserTestLab` remains in schema/seed for TestLab; email auth uses global `User` only. Dev login: `x-tenant-id: palos-de-lena` with `mes-owner@palos-de-lena.dev` / `mes-operator@palos-de-lena.dev` (`TestPass123!`). `test@restopsiq.dev` stays TestLab-only.

---

## Task sequence

| Task | File                               | Type           |
| ---- | ---------------------------------- | -------------- |
| 00   | `00-analysis-decisions.md`         | Planning       |
| 01   | `01-remove-testlab-schema.md`      | Schema-only    |
| 02   | `02-drop-testlab-migration.md`     | Migration      |
| 03   | `03-role-document-type-schema.md`  | Schema-only    |
| 04   | `04-user-schema.md`                | Schema-only    |
| 05   | `05-operational-user-link.md`      | Schema-only    |
| 06   | `06-user-migration.md`             | Migration      |
| 07   | `07-seed-update.md`                | Seed           |
| 08   | `08-auth-repoint-user.md`          | Application    |
| 09   | `09-backfill-operational-users.md` | Data migration |
| 10   | `10-validation-security.md`        | Validation     |

---

## Acceptance criteria

- [x] Analysis documents current `UserTestLab`, `OperationalUser`, and related models.
- [x] All nine key decisions above are recorded.
- [x] Task sequence 01–10 is defined with clear dependencies.
- [x] Deferred models are explicitly listed.
- [x] No code or schema files were modified.

---

## Validation commands

None — planning task only.

---

## Risks

| Risk                                                               | Mitigation                                                                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| TestLab removal breaks email auth before `User` exists             | Tasks 01–02 leave auth broken until task 08; do not deploy partial epic to production without coordination |
| Dual role representations (`OperationalRole` enum vs `Role` table) | Document in task 05/09; consolidate in a future MES auth epic                                              |
| Gateway GraphQL type named `User` maps to `OperationalUser`        | Address naming in task 10 or a follow-up gateway task                                                      |
| `cedula` stored as plain string                                    | Document compliance review in task 10                                                                      |

---

## Stop rule

**Do not proceed to task 01 until this analysis is reviewed and approved.** After completing any task in this epic, stop and report — do not automatically continue to the next task.

---

## Epic completion (Task 10 — 2026-05-29)

USR-01 validation complete. Email auth repointed to global `User` with tenant-scoped `x-tenant-id`. `UserTestLab` retained for TestLab module only. MES auth unchanged on `OperationalUser`. Seeded OperationalUsers linked via nullable `userId`. `AuditLog` and `PasswordResetToken` FK wiring remains deferred. See `10-validation-security.md` for full checklist and closure recommendation.
