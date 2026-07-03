# AUTH-09 Task 03 — Apply RBAC, Tests & Postman

## Goal

Apply permission guards to selected GraphQL operations, add integration/unit coverage for allow/deny paths, and extend Postman with RBAC negative cases.

**Depends on:** Tasks 01–02 complete.

---

## Scope

### Resolver enforcement (global JWT only)

| Resolver / field                                                                        | Guard                                                      |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `supplyItems`                                                                           | `@RequirePermission('supply.items.read')`                  |
| `operationalProfile`, `updateProfile`                                                   | Auth only (no permission decorator)                        |
| `me`, `logout`, `changePassword`                                                        | Auth only                                                  |
| Public auth mutations                                                                   | Remain `@Public()`                                         |
| `recipes`, `recipe`, `createRecipe`, `suppliers*`, `supplierProduct*`, `purchaseOrder*` | **Auth only** — document gap; no invented permission codes |
| `MesAuthResolver`                                                                       | Unchanged — `MesJwtGuard` only                             |

Import `PermissionsModule` + apply `PermissionsGuard` on guarded resolver methods (e.g. `@UseGuards(PermissionsGuard)` at class or method level).

### Tests

- Resolver test: OWNER (or mocked `hasPermission: true`) can call `supplyItems`.
- Resolver test: OPERATOR denied when `hasPermission: false` → PermissionDenied.
- Optional e2e-style: login seeded `mes-operator@` global user + `x-tenant-id: palos-de-lena` → GraphQL `supplyItems` succeeds (read).
- Confirm `meOperational` still works with `mesAccessToken` (regression).
- Wrong token: `mesAccessToken` on `supplyItems` → 401 (existing JWT strategy).

### Postman

- Add folder **11 — GraphQL RBAC** (or extend folder 10 with subfolder):
  - Missing `Authorization` on `supplyItems` → error
  - `mesAccessToken` on global query → unauthorized
  - Global OPERATOR `supplyItems` → 200 (has `supply.items.read`)
  - Document future: mutation with `supply.items.manage` denied for OPERATOR when mutation exists
- Update `postman/README.md` RBAC section: enforcement active for GraphQL supply items.
- Clarify env vars: `accessTokenOwner`, `accessTokenOperator` if not already distinct.

## Out of scope

- REST supply-items RBAC — see Task 04.
- Plant HTTP `MesRolesGuard` changes.
- New Prisma permissions for suppliers/recipes.
- Frontend changes.
- Gateway.

## Allowed files

- `apps/api/src/supplyitems/resolver/supplyitems.resolver.ts`
- `apps/api/src/supplyitems/supplyitems.module.ts`
- `apps/api/src/supplyitems/test/supplyitems.resolver.spec.ts`
- `apps/api/src/user/resolver/user.resolver.ts` (only if adding guard documentation tests — prefer no change)
- `apps/api/src/auth/test/**` (regression only if JWT tests break)
- `apps/api/src/mes/auth/test/mes-auth.resolver.spec.ts` (meOperational regression)
- `postman/restopsiq-api.collection.json`
- `postman/README.md`
- `postman/local.environment.json` (only if new variables required)

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/app.module.ts` (unless explicitly approved for `PermissionsModule` — prefer module-level imports)
- `apps/api/src/auth/service/auth.service.ts` (login behavior — done in Task 01)
- `apps/api/src/mes/auth/service/**` (MES token issuance)
- `apps/gateway/**`
- `package.json` / `pnpm-lock.yaml`

## Acceptance criteria

- [x] `supplyItems` requires `supply.items.read`; denied users get PermissionDenied.
- [x] Seeded global OPERATOR can query `supplyItems` with `accessToken` + `x-tenant-id`.
- [x] Seeded global OWNER can query `supplyItems`.
- [x] `meOperational` unchanged with MES token (no mes-auth resolver changes).
- [x] Postman folder documents and runs at least 3 RBAC negative/positive cases.
- [x] No sensitive fields exposed in GraphQL error extensions.
- [x] Suppliers/recipes GraphQL remain auth-only (documented in README).

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='supplyitems|permissions|user\.resolver|mes-auth\.resolver|auth\.'
```

Manual (document in task report):

```bash
# API running with seed
# Postman: folder 11 — GraphQL RBAC
```

## Risks

| Risk                                  | Mitigation                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| OPERATOR token from wrong seeded user | Use README seed emails for global OPERATOR vs OWNER                            |
| Postman pre-request skips `/graphql`  | Manual login steps in folder 11 description                                    |
| Only one supply GraphQL field         | Still validates guard pipeline; manage code reserved for REST/future mutations |

## Stop rule

Stop after validation passes and Postman folder is updated. REST supply-items RBAC is Task 04. Do not start AUTH-10 or supplier permission catalog without a new ticket.
