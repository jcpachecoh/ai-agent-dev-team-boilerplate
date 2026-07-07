# USR-02 Task 04 — RBAC Migration

## Goal

Create and apply a Prisma migration that creates `permissions`, `role_permissions`, and `user_permissions` tables (plus `PermissionEffect` enum) per tasks 01–03. Schema must already be complete before running migrate.

**Depends on:** Task 03 (full RBAC schema defined in `schema.prisma`).

---

## Scope

- Create one migration under `apps/api/prisma/migrations/` that:
  - Creates `PermissionEffect` enum (`ALLOW`, `DENY`).
  - Creates `permissions` table per task 01.
  - Creates `role_permissions` table per task 02 with FKs to `roles` and `permissions`.
  - Creates `user_permissions` table per task 03 with FKs to `users` and `permissions`.
  - Creates all indexes and unique constraints from tasks 01–03.
- Apply migration locally via `prisma migrate dev` (or `migrate deploy` against existing DB).
- Run `prisma validate`.
- Manually review generated SQL — must contain **only** RBAC-related DDL.

---

## Out of scope

- No seed data (tasks 05–06).
- No application code changes.
- No changes to `Role`, `User`, or `OperationalUser` columns beyond new relations already in schema.
- No data backfill of permissions (seed handles that in tasks 05–06).
- Do not modify USR-01 migrations.

---

## Allowed files

- `apps/api/prisma/migrations/<timestamp>_usr_02_rbac/migration.sql` — create (auto-generated)

---

## Forbidden files

- `apps/api/prisma/schema.prisma` — do not modify in this task
- Any file under `apps/api/src/`
- Any file under `packages/`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Implementation notes

- Migration runs **after** USR-01 migrations (`roles`, `users` tables must exist).
- Prefer idempotent patterns only if team convention requires; otherwise standard Prisma-generated SQL is acceptable on fresh DBs.
- FK `role_permissions.roleId` → `roles.id`: `ON DELETE CASCADE`.
- FK `user_permissions.userId` → `users.id`: `ON DELETE CASCADE`.
- FK to `permissions.id`: `ON DELETE RESTRICT` on both join tables.

---

## Acceptance criteria

- [x] Migration file exists under `apps/api/prisma/migrations/`.
- [x] `permissions` table created with unique on `code`.
- [x] `role_permissions` table created with unique on `(roleId, permissionId)`.
- [x] `user_permissions` table created with unique on `(userId, permissionId)` and `PermissionEffect` column.
- [x] All FKs and indexes match tasks 01–03.
- [x] `pnpm prisma migrate dev --name usr_02_rbac_foundation` exits 0 against DB with USR-01 applied.
- [x] `pnpm prisma validate` exits 0.
- [x] No unrelated DDL (no changes to MES/plant/supply tables).

---

## Validation commands

```bash
cd apps/api
pnpm prisma validate
pnpm prisma migrate deploy
# or: pnpm prisma migrate dev --name usr_02_rbac
pnpm prisma generate
```

---

## Risks

| Risk              | Notes                                                          |
| ----------------- | -------------------------------------------------------------- |
| Migration order   | Must apply after USR-01 `users`/`roles` exist                  |
| Manual SQL edits  | Review generated SQL before commit — no drops of USR-01 tables |
| Empty join tables | Expected until tasks 05–06 seed                                |

---

## Stop rule

**Stop after this task.** Report migration name, SQL summary, and validation results. **Do not proceed to task 05 (seed permissions) without explicit approval.**
