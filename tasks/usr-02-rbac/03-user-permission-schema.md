# USR-02 Task 03 — UserPermission Schema

## Goal

Add `PermissionEffect` enum and `UserPermission` join model for per-user permission overrides with `ALLOW` or `DENY` effect. Tenant scope is inherited from `User.tenantId`.

**Depends on:** Task 02 (`RolePermission` model exists).

---

## Scope

- Add `PermissionEffect` enum: `ALLOW`, `DENY`.
- Add `UserPermission` join model with `userId`, `permissionId`, `effect`, timestamps.
- Add FK: `userId` → `User.id` (`ON DELETE CASCADE` recommended).
- Add FK: `permissionId` → `Permission.id` (`ON DELETE RESTRICT` recommended).
- Add `@@unique([userId, permissionId])` — one override row per user per permission.
- Add indexes on `userId` and `permissionId`.
- Add back-relations: `User.userPermissions UserPermission[]`, `Permission.userPermissions UserPermission[]`.
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Nothing else.

### Suggested shapes

```prisma
enum PermissionEffect {
  ALLOW
  DENY
}

model UserPermission {
  id           String           @id @default(cuid())
  userId       String
  permissionId String
  effect       PermissionEffect
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Restrict)

  @@unique([userId, permissionId])
  @@index([userId])
  @@index([permissionId])
  @@map("user_permissions")
}
```

**Design decisions:**

- **DENY overrides ALLOW** when resolving effective permissions (task 07).
- At most one row per `(userId, permissionId)` — update `effect` rather than duplicate rows.
- Tenant scope via `User.tenantId`; resolver must reject cross-tenant lookups.
- `OperationalUser` and `OperationalRole` enum remain unchanged.

---

## Out of scope

- No migrations (task 04).
- No seed data (tasks 05–06).
- No `PermissionsService` (task 07).
- No changes to `apps/api/src/`.

---

## Allowed files

- `apps/api/prisma/schema.prisma` — append enum + `UserPermission` model and update `User` + `Permission` relations only

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

- [x] `PermissionEffect` enum exists with `ALLOW` and `DENY`.
- [x] `UserPermission` model exists with `userId`, `permissionId`, `effect`, `createdAt`.
- [x] `@@unique([userId, permissionId])` constraint present.
- [x] FKs to `User` and `Permission` with `onDelete: Cascade` on both relations.
- [x] `User.userPermissions` and `Permission.userPermissions` back-relations added.
- [x] `@@index([effect])` present.
- [x] `@@map("user_permissions")` set.
- [x] `Role`, `RolePermission`, and `OperationalUser` unchanged except `User` relation addition.
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

| Risk                  | Notes                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| Conflicting overrides | Unique constraint prevents duplicate rows; service updates `effect` in place |
| Soft-deleted users    | Resolver (task 07) should exclude inactive/deleted users                     |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 04 (RBAC migration) without explicit approval.**
