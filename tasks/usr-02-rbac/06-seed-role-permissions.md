# USR-02 Task 06 — Seed Role Permissions

## Goal

Seed the `RolePermission` matrix for `palos-de-lena` tenant roles (`OWNER`, `SUPERVISOR`, `MANAGER`, `OPERATOR`) using permission IDs from task 05 and role IDs from existing USR-01 seed.

**Depends on:** Task 05 (permission catalog seeded).

---

## Scope

- Add `seedRolePermissions()` to `apps/api/prisma/seed.ts`.
- Upsert `RolePermission` rows linking each tenant role to its granted permissions.
- Use existing `ROLE_*_ID` constants and permission IDs from task 05.
- Follow matrix from task 00 (MANAGER ≡ SUPERVISOR in v1).
- Idempotent upserts on `(roleId, permissionId)`.
- Invoke from `main()` after `seedRoles()` and `seedPermissions()`.
- Run `pnpm db:seed` successfully.

### Role → permission matrix

**OWNER** — all 13 permissions.

**MANAGER** and **SUPERVISOR** — all except `mes.users.create` and `mes.users.role.read`:

- `plant.workstations.manage`
- `plant.recipes.manage`
- `plant.orders.read`
- `plant.orders.create`
- `plant.orders.plan`
- `plant.orders.pause`
- `plant.orders.resume`
- `plant.orders.cancel`
- `plant.executions.qa_approve`
- `supply.items.read`
- `supply.items.manage`

**OPERATOR**:

- `plant.orders.read`
- `supply.items.read`

---

## Out of scope

- No `UserPermission` seed rows.
- No changes to MES operational user seed blocks (unless import order requires — keep USR-01 seed intact).
- No changes to schema, migrations, or `apps/api/src/`.
- No enforcement in controllers.

---

## Allowed files

- `apps/api/prisma/seed.ts`

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- Any file under `apps/api/src/`
- Any file under `packages/`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Implementation notes

Suggested approach:

1. Define `ROLE_PERMISSION_MATRIX: Record<string, string[]>` mapping role code → permission codes.
2. Resolve role IDs from `seedRoles()` return value.
3. Resolve permission IDs from `seedPermissions()` return value.
4. Upsert each `(roleId, permissionId)` pair.

Use deterministic `RolePermission` IDs only if tests require them; otherwise let Prisma generate.

---

## Acceptance criteria

- [x] OWNER role has all 13 permissions.
- [x] MANAGER and SUPERVISOR roles have identical 11-permission set (no mes.users.\*).
- [x] OPERATOR role has exactly 2 permissions (orders.read, supply.items.read).
- [x] Upsert is idempotent.
- [x] Seed runs after roles and permissions exist.
- [x] `pnpm db:seed` exits 0.
- [x] Console output logs role-permission counts per role.

---

## Validation commands

```bash
cd apps/api
pnpm db:seed
# Optional verify:
# psql $DATABASE_URL -c "SELECT r.code, p.code FROM role_permissions rp JOIN roles r ON r.id = rp.\"roleId\" JOIN permissions p ON p.id = rp.\"permissionId\" WHERE r.\"tenantId\" = 'palos-de-lena' ORDER BY r.code, p.code;"
```

---

## Risks

| Risk                    | Notes                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Role ID drift           | Use upsert where keys from `seedRoles()`, not hardcoded unless USR-01 constants kept                  |
| Matrix vs MesRolesGuard | Seed matrix is stricter on plant master data than current guards — intentional for future enforcement |
| Duplicate upserts       | Use unique `(roleId, permissionId)` in upsert where clause                                            |

---

## Stop rule

**Stop after this task.** Report matrix counts per role and validation results. **Do not proceed to task 07 (PermissionsService) without explicit approval.**
