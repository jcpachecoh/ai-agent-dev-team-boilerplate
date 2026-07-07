# USR-02 Task 07 — Permissions Service

## Goal

Implement a NestJS `permissions` module with repository and service to resolve **effective permissions** for a global `User` using the approved formula. No controller, guard, or HTTP exposure in this task.

**Depends on:** Task 06 (seeded role-permission data for local testing).

---

## Scope

- Create `apps/api/src/permissions/` module following NestJS module structure:
  - `interfaces/` — `IPermissionsRepository`, `IPermissionsService`, types
  - `repository/` — Prisma data access only; no HTTP exceptions
  - `service/` — business rules; throw `NotFoundException` when user missing/inactive
  - `permissions.module.ts`
- Implement `resolveEffectivePermissions(userId: string, tenantId: string): Promise<Set<string>>` (or `string[]` — document choice in interfaces).
- Resolution algorithm:
  1. Load active user by `id` where `tenantId` matches and `deletedAt` is null.
  2. Load permission codes via `User.roleId` → `RolePermission` → `Permission` (active only).
  3. Load `UserPermission` overrides for user (active permissions only).
  4. Apply: `(rolePermissions ∪ allowCodes) \ denyCodes`.
  5. Return distinct permission code set.
- Repository methods (suggested):
  - `findUserForPermissionResolution(userId, tenantId)`
  - `findPermissionCodesByRoleId(roleId)`
  - `findUserPermissionOverrides(userId)`
- **Do not** register `PermissionsModule` in `app.module.ts` (forbidden).
- **Do not** add controllers or guards.

---

## Out of scope

- No `@RequirePermissions` decorator or guard (USR-02B / USR-03).
- No JWT changes.
- No MES `OperationalUser` bridging (unlinked operational profiles).
- No changes to `MesRolesGuard`, `MesAuthModule`, or `AuthModule`.
- No changes to schema, migrations, or seed.
- No `app.module.ts` registration.

---

## Allowed files

- `apps/api/src/permissions/interfaces/**`
- `apps/api/src/permissions/repository/**`
- `apps/api/src/permissions/service/**`
- `apps/api/src/permissions/permissions.module.ts`

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/mes/**`
- `apps/api/src/auth/**`
- `apps/api/src/supplyitems/**`
- Any file under `packages/`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Interface sketch

```typescript
export interface IPermissionsService {
  resolveEffectivePermissions(userId: string, tenantId: string): Promise<ReadonlySet<string>>;
  hasPermission(userId: string, tenantId: string, permissionCode: string): Promise<boolean>;
}
```

`hasPermission` may delegate to `resolveEffectivePermissions` or query optimized path — implementer's choice; must match tests in task 08.

---

## Acceptance criteria

- [x] Module follows required NestJS structure (interfaces, repository, service, module).
- [x] Repository contains Prisma access only; does not throw HTTP exceptions.
- [x] Service throws `NotFoundException` for missing/inactive/deleted user or tenant mismatch.
- [x] `resolveEffectivePermissions` implements `(role ∪ allow) \ deny`.
- [x] DENY overrides ALLOW for same permission code.
- [x] Unlisted permissions are not in returned set (fail closed for `hasPermission`).
- [x] Inactive permissions (`isActive: false`) excluded from resolution.
- [x] `PermissionsModule` exports `PermissionsService` but is **not** imported in `app.module.ts`.
- [x] `node scripts/validate-structure.js` exits 0 (permissions module included).
- [x] `pnpm --filter=@restopsiq/api typecheck` exits 0.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
```

(Service unit tests are task 08.)

---

## Risks

| Risk                      | Notes                                                       |
| ------------------------- | ----------------------------------------------------------- |
| Module not wired globally | Expected — only tests import module until enforcement epic  |
| N+1 queries               | Acceptable for v1; optimize in enforcement epic if needed   |
| Cross-tenant userId       | Service must validate `user.tenantId === tenantId` argument |

---

## Stop rule

**Stop after this task.** Report files changed and typecheck/structure validation. **Do not proceed to task 08 (permissions tests) without explicit approval.**
