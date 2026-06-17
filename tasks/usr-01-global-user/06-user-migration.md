# USR-01 Task 06 — User Migration

## Goal

Create and apply a Prisma migration that creates the `roles` and `users` tables, adds nullable `OperationalUser.userId`, and wires FK constraints for `User` → `Role` and `OperationalUser` → `User` only. **AuditLog** and **PasswordResetToken** FKs to `User` are deferred (Task 04 fix / Task 08+).

**Depends on:** Task 05 (full schema defined: `Role`, `User`, `OperationalUser.userId`).

---

## Scope

- Create one migration under `apps/api/prisma/migrations/` that:
  - Creates `DocumentType` enum in PostgreSQL (if not already present from a prior partial migration).
  - Creates `roles` table per task 03 schema.
  - Creates new `users` table per task 04 schema (replacing the dropped TestLab `users` table from task 02).
  - Adds `userId` column to `operational_users` (nullable initially if existing rows require backfill before NOT NULL).
  - Adds FK: `users.roleId` → `roles.id`.
  - Adds FK: `operational_users.userId` → `users.id` (nullable column).
  - **Does not** add FK: `audit_logs.userId` → `users.id` (deferred).
  - **Does not** add FK: `password_reset_tokens.userId` → `users.id` (deferred).
  - Prerequisite: `20260529120000_remap_user_testlab_table` renames TestLab `users` → `users_testlab` (not repeated in this migration).
  - Creates all required indexes and unique constraints from tasks 03–05.
- Apply migration locally via `prisma migrate dev`.
- Run `prisma validate`.

---

## Out of scope

- No seed data (task 07).
- No application code changes.
- No backfill of `OperationalUser.userId` (task 09).
- No data migration from old TestLab `users` rows (table was dropped in task 02; data is gone).
- Migration SQL must not recreate TestLab tables or enums.

---

## Allowed files

- `apps/api/prisma/migrations/<timestamp>_add_global_user_and_roles/migration.sql` — create (auto-generated)

---

## Forbidden files

- `apps/api/prisma/schema.prisma` — do not modify
- Any file under `apps/api/src/`
- Any file under `packages/`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Implementation notes

- Review generated SQL manually before commit. It must contain **only** changes related to `roles`, `users`, `operational_users.userId`, and FK/index additions listed above.
- If `operational_users` has seeded rows (from `pnpm db:seed`), `userId` should be **nullable** in this migration; task 09 backfills and a follow-up migration (or same task if coordinated) can add NOT NULL.
- `password_reset_tokens` rows referencing old TestLab user IDs become orphaned — acceptable; tokens expire or can be cleaned up.
- `audit_logs` rows with old `userId` values will fail FK unless nulled or cleaned before FK is added — consider a pre-FK `UPDATE audit_logs SET "userId" = NULL WHERE ...` step in migration if needed.

---

## Acceptance criteria

- [x] Migration file exists under `apps/api/prisma/migrations/`.
- [x] `roles` table created with tenant-scoped unique on `(tenantId, code)`.
- [x] `users` table created with all USR-01 columns and indexes.
- [x] `operational_users.userId` column added nullable with unique constraint.
- [x] FK constraints wired: `users.roleId` → `roles.id`, `operational_users.userId` → `users.id`.
- [x] No FK added: `audit_logs.userId` → `users.id`.
- [x] No FK added: `password_reset_tokens.userId` → `users.id`.
- [x] Migration SQL does not drop TestLab tables or rename `users_testlab`.
- [x] `npx prisma validate` exits 0.

---

## Validation commands

```bash
cd apps/api
npx prisma validate
npx prisma migrate dev --name add_global_user_and_roles
# Or, if migration already created:
npx prisma migrate deploy
```

---

## Risks

| Risk                                       | Notes                                                 |
| ------------------------------------------ | ----------------------------------------------------- |
| FK failure on `audit_logs` legacy `userId` | Null out or delete orphan audit rows before adding FK |
| `operational_users` rows without `userId`  | Keep column nullable until task 09                    |
| Empty `users` table breaks auth            | Expected until tasks 07–08                            |
| Migration includes unrelated DDL           | Manual SQL review required                            |

---

## Stop rule

**Stop after this task.** Report migration file path, validation results, and any pre-FK data cleanup performed. **Do not proceed to task 07 (seed update) without explicit approval.**
