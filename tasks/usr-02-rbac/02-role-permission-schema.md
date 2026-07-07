# USR-02 Task 02 — RolePermission Schema

## Goal

Add the `RolePermission` join model linking tenant-scoped `Role` to global `Permission`. Tenant scope is inherited from `Role.tenantId` — no `tenantId` column on the join table.

**Depends on:** Task 01 (`Permission` model exists).

---

## Scope

- Add `RolePermission` join model with `roleId`, `permissionId`, `createdAt`.
- Add FK: `roleId` → `Role.id` (`ON DELETE CASCADE` recommended — removing role removes its grants).
- Add FK: `permissionId` → `Permission.id` (`ON DELETE RESTRICT` recommended — do not delete catalog permissions with grants).
- Add `@@unique([roleId, permissionId])`.
- Add indexes on `roleId` and `permissionId`.
- Add back-relations: `Role.rolePermissions RolePermission[]`, `Permission.rolePermissions RolePermission[]`.
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Nothing else.

### Suggested `RolePermission` shape

```prisma
model RolePermission {
  id           String   @id @default(cuid())
  roleId       String
  permissionId String
  createdAt    DateTime @default(now())

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Restrict)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}
```

**Design decisions:**

- **Effectively tenant-scoped** via `Role.tenantId` — document in code comments if helpful.
- No `ALLOW`/`DENY` on role grants — role grants are always affirmative; denials are user-level only (task 03).
- Do not add `UserPermission` in this task.

---

## Out of scope

- No migrations (task 04).
- No `UserPermission` or `PermissionEffect` enum (task 03).
- No seed data (tasks 05–06).
- No changes to `OperationalUser` or MES auth.
- No changes to `apps/api/src/`.

---

## Allowed files

- `apps/api/prisma/schema.prisma` — append `RolePermission` model and update `Role` + `Permission` relations only

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

- [x] `RolePermission` model exists with `roleId`, `permissionId`, `createdAt`.
- [x] `@@unique([roleId, permissionId])` constraint present.
- [x] FKs to `Role` and `Permission` with `onDelete: Cascade` on both relations.
- [x] `Role.rolePermissions` and `Permission.rolePermissions` back-relations added.
- [x] `@@map("role_permissions")` set.
- [x] No `UserPermission` model added yet.
- [x] `OperationalRole` enum unchanged.
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

| Risk                       | Notes                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| CASCADE on role delete     | Deleting a tenant role removes all grants — acceptable for v1                                  |
| Cross-tenant roleId misuse | Application must never assign permissions across tenants — enforced in service layer (task 07) |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 03 (UserPermission schema) without explicit approval.**
