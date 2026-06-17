# USR-02 Task 01 — Permission Schema

## Goal

Add the global `Permission` catalog model to `schema.prisma`. Permissions are system-defined capability codes shared across all tenants.

**Depends on:** Task 00 (decisions approved).

---

## Scope

- Add `Permission` model (global catalog — no `tenantId`).
- Add fields: `code` (unique), `name`, optional `description`, optional `module` (grouping), `isActive`, timestamps.
- Add `@@map("permissions")`.
- Add back-relations placeholder comments only if join models do not exist yet — **do not** add `RolePermission` or `UserPermission` in this task (tasks 02–03).
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Nothing else.

### Suggested `Permission` shape

```prisma
model Permission {
  id          String   @id @default(cuid())
  code        String   @unique // e.g. plant.orders.create
  name        String
  description String?
  module      String?  // e.g. plant, mes, supply
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([module, isActive])
  @@map("permissions")
}
```

**Design decisions:**

- `Permission.code` is globally unique — naming convention `{domain}.{resource}.{action}` (see task 00).
- `Role`, `User`, and `OperationalUser` models are **unchanged** in this task.
- No join tables in this task.

---

## Out of scope

- No migrations (task 04).
- No `RolePermission` or `UserPermission` models (tasks 02–03).
- No changes to existing `Role` or `User` relations.
- No seed data (tasks 05–06).
- No changes to `apps/api/src/`.

---

## Allowed files

- `apps/api/prisma/schema.prisma` — append `Permission` model only

---

## Forbidden files

- Any file under `apps/api/src/`
- Any file under `packages/`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [x] `Permission` model exists with `code`, `name`, `isActive`, timestamps.
- [x] `code` has `@@unique([code])` constraint.
- [x] Optional `description`, `module`, `resource`, and `action` fields present.
- [x] `@@map("permissions")` set.
- [x] Indexes on `module`, `[resource, action]`, and `isActive` present.
- [x] No `RolePermission`, `UserPermission`, or `PermissionEffect` enum added yet.
- [x] Existing `Role`, `User`, `OperationalUser` models unchanged.
- [x] `pnpm prisma format` exits 0.
- [x] `pnpm prisma validate` exits 0.
- [x] `pnpm prisma generate` exits 0.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```

---

## Risks

| Risk                       | Notes                                                                           |
| -------------------------- | ------------------------------------------------------------------------------- |
| Orphan model until task 02 | `Permission` has no relations until join tables added — expected                |
| Code churn                 | Renaming permission codes after seed requires migration — lock codes in task 00 |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 02 (RolePermission schema) without explicit approval.**
