# AUTH-09 Task 02 — GraphQL Permission Guard

## Goal

Introduce reusable GraphQL-aware permission enforcement using `PermissionsService`, returning a consistent **PermissionDenied** error. No broad resolver rollout in this task.

**Depends on:** Task 01 (JWT carries `tenantId` for mismatch checks). **Blocks:** Task 03.

---

## Scope

- Register `PermissionsModule` where guards can inject `PermissionsService` (e.g. new `apps/api/src/common/permissions/` or extend `auth.module` + export) — **without** modifying forbidden `app.module.ts` unless team explicitly approves; prefer importing `PermissionsModule` into feature modules that use the guard.
- Create `@RequirePermission(code)` and/or `@RequirePermissions(...codes)` metadata decorator.
- Create `PermissionsGuard` (or `GqlPermissionsGuard`) that:
  - Runs after authentication (global JWT present on `req.user`).
  - Resolves `userId` from `JwtPayload.sub`.
  - Resolves `tenantId` from `getTenantIdFromContext` (required header).
  - Optionally asserts `req.user.tenantId === header tenantId` when JWT includes `tenantId` (Task 01).
  - Calls `permissionsService.hasPermission(userId, tenantId, code)`.
  - Throws **PermissionDenied** (403, `extensions.code = 'PERMISSION_DENIED'`) when false.
  - Does **not** run on `@Public()` handlers.
- Support GraphQL via `GqlExecutionContext` (mirror `JwtAuthGuard.getRequest`).
- Unit tests: allow, deny, missing user → not found handled (guard should map service NotFound to 403 or 401 per decision — prefer **403 Permission denied** without detail).
- **Do not** attach guard to production resolvers yet (Task 03).

## Out of scope

- Applying decorator to supply/recipe/supplier resolvers.
- MES `MesJwtGuard` / `MesRolesGuard` changes.
- Postman.
- Caching layer for permissions (optional future).
- New permission seed codes.

## Allowed files

- `apps/api/src/common/decorators/require-permission.decorator.ts` (new)
- `apps/api/src/common/guards/permissions.guard.ts` (new)
- `apps/api/src/common/exceptions/permission-denied.exception.ts` (new, if used)
- `apps/api/src/common/filters/graphql-permission.filter.ts` (new, if needed)
- `apps/api/src/common/test/permissions.guard.spec.ts` (new)
- `apps/api/src/permissions/permissions.module.ts` (exports only, if adjusting)
- `apps/api/src/auth/auth.module.ts` (import/export wiring for guard providers only)
- `apps/api/src/graphql/**` (only if registering a filter provider in graphql module — avoid `app.module.ts`)

## Forbidden files

- `apps/api/src/app.module.ts`
- `apps/api/prisma/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/mes/**`
- `apps/api/src/**/resolver/**` (no resolver edits in Task 02)
- `postman/**`
- `apps/gateway/**`
- `package.json` / `pnpm-lock.yaml`
- Auth login/signup/refresh **behavior** changes (payload done in Task 01)

## Acceptance criteria

- [x] `@RequirePermission('supply.items.read')` metadata readable by guard.
- [x] Guard allows when `hasPermission` returns true (mocked service).
- [x] Guard throws PermissionDenied when `hasPermission` returns false.
- [x] GraphQL error shape includes `extensions.code: 'PERMISSION_DENIED'`.
- [x] Message does not include permission code or internal role matrix.
- [x] Guard skipped when handler/class marked `@Public()`.
- [x] No resolver in codebase has `@RequirePermission` applied yet (or only a dedicated test host resolver in `test/`).

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='permissions\.guard|permissions\.service'
```

## Risks

| Risk                                       | Mitigation                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `PermissionsModule` not globally available | Export guard + import `PermissionsModule` in modules that apply Task 03                |
| GraphQL vs REST context                    | Reuse `GqlExecutionContext` pattern from `JwtAuthGuard`                                |
| `NotFoundException` from service           | Guard catches and returns generic PermissionDenied or Unauthorized per security review |

## Stop rule

Stop after guard tests pass. Do not apply guards to domain resolvers until Task 03.
