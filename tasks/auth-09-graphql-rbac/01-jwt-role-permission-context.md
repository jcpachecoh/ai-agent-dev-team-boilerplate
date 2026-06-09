# AUTH-09 Task 01 — JWT Role & Permission Context

## Goal

Enrich the **global** JWT payload with tenant and role context needed for GraphQL RBAC, without enabling permission enforcement yet. Optionally expose effective permissions on `me` for clients (server-computed).

**Depends on:** Task 00 (decisions). **Blocks:** Task 02.

---

## Scope

- Extend `JwtPayload` with `tenantId`, `roleId`, `roleCode`.
- Populate fields in `AuthService.issueTokens` (login, signup, refresh) from resolved `User` + `Role`.
- Update `JwtStrategy.validate` to pass through enriched payload (no permission checks).
- Align refresh token payload with access token (same claims).
- Ensure GraphQL `me` continues to return `roleCode`; optionally add `permissions: [String!]!` on `AuthUserProfile` via `PermissionsService.resolveEffectivePermissions` (read-only, not used for enforcement).
- Unit tests: token signing payload, strategy validate, refresh issues same claims.
- **Do not** add `@RequirePermission` or resolver guards in this task.
- **Do not** change MES JWT payload or `MesAuthService.issueTokens`.

## Out of scope

- Permission guard / `PermissionDenied` (Task 02).
- Resolver-level enforcement (Task 03).
- JWT permissions array for authorization.
- Auth lockout, LoginAudit, or login flow behavior changes beyond loading role for payload.
- Postman updates.

## Allowed files

- `apps/api/src/auth/interfaces/auth.interfaces.ts`
- `apps/api/src/auth/service/auth.service.ts`
- `apps/api/src/auth/strategies/jwt.strategy.ts`
- `apps/api/src/auth/strategies/jwt-refresh.strategy.ts`
- `apps/api/src/auth/resolver/auth.resolver.ts` (only if extending `AuthUserProfileType` fields)
- `apps/api/src/auth/repository/auth.repository.ts` (only if needed to load roleId for token issuance)
- `apps/api/src/auth/test/auth.service.spec.ts`
- `apps/api/src/auth/test/auth.strategies.spec.ts`
- `apps/api/src/auth/test/auth.resolver.spec.ts`
- `apps/api/src/auth/test/jwt-refresh.guard.spec.ts` (if payload assertions needed)
- `apps/api/src/auth/auth.module.ts` (import `PermissionsModule` **only** if `me` exposes permissions)
- `apps/api/src/permissions/**` — **no logic changes**; import module only

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/mes/**`
- `apps/api/src/user/**`
- `apps/api/src/**/resolver/**` except `auth/resolver/auth.resolver.ts`
- `apps/api/src/common/guards/**` (except if a one-line comment — prefer none)
- `postman/**`
- `apps/gateway/**`
- `package.json` / `pnpm-lock.yaml`

## Acceptance criteria

- [x] Global access JWT decodes to `{ sub, email, tenantId, roleId, roleCode }`.
- [x] Global refresh JWT carries the same identity/role claims as access.
- [x] MES JWT payload unchanged (manual check or existing mes-auth tests still pass).
- [x] No resolver returns 403 for missing permission (enforcement not active).
- [x] Tests assert payload shape at issue time (mock `JwtService.signAsync` or decode in test).
- [x] `me.permissions` not added — `me` continues to expose `roleCode` only; Task 02 uses server-side `PermissionsService`.

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='auth\.(service|strategies|resolver)|jwt-refresh'
```

## Risks

| Risk                                            | Mitigation                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Stale `roleCode` in JWT after admin role change | Accept for AUTH-09; enforcement uses DB via `PermissionsService`; document re-login |
| `tenantId` in JWT vs `x-tenant-id` mismatch     | Task 02 guard rejects mismatch with generic forbidden                               |
| Importing `PermissionsModule` in `AuthModule`   | Minimal: import for `me` only; do not register globally yet unless needed           |

## Stop rule

Stop after Task 01 validation passes. Do not start Task 02 in the same session unless explicitly requested.
