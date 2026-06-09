# AUTH-09 Task 00 — Analysis & Decisions

## Goal

Analyze current GraphQL RBAC/JWT state in `apps/api` and document decisions plus a three-task implementation sequence. **No code changes in this task.**

**Depends on:** USR-02 (permission catalog + `PermissionsService`), AUTH-02 (GraphQL auth on API), AUTH-03 (auth hardening), AUTH-08 (`operationalProfile` link lookup).

---

## Scope

- Inventory JWT payloads (global, refresh, MES).
- Inventory GraphQL resolver auth (`@Public`, global `JwtAuthGuard`, `MesJwtGuard`, `MesRolesGuard`).
- Assess `PermissionsService` readiness and operational-user bridging options.
- Compare JWT enrichment strategies (role in JWT vs permissions in JWT vs server-side only).
- Define `PermissionDenied` error contract for GraphQL.
- Map candidate operations → permission codes (or auth-only).
- Postman gap analysis for RBAC negative tests.
- Record approved decisions and task order (01 → 03).

## Out of scope

- Implementation in `apps/api/src/**`, `postman/**`, Prisma, seed, or package files.
- Gateway changes (`apps/gateway/**`).
- REST `/api/plant/*` RBAC retrofit (MES HTTP keeps `MesRolesGuard` in this epic’s scope note only).
- New permission catalog codes for suppliers/recipes back-office (defer unless product approves).

## Allowed files

- `tasks/auth-09-graphql-rbac/**` (this file and sibling task specs)

## Forbidden files

- `apps/api/src/**`
- `apps/gateway/src/**`
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

## Acceptance criteria

- [x] Current JWT and GraphQL protection state documented with file references.
- [x] JWT strategy recommendation recorded (role/tenant in JWT; permissions resolved server-side).
- [x] Operational-user RBAC approach chosen for AUTH-09 (Option C for MES GraphQL; global User for back-office GraphQL).
- [x] `PermissionDenied` contract sketched.
- [x] Resolver → permission mapping table with explicit deferrals.
- [x] Tasks 01–03 scoped with allowed/forbidden files and validation commands.

## Validation commands

```bash
# Analysis-only — no implementation validation required.
test -f tasks/auth-09-graphql-rbac/01-jwt-role-permission-context.md
test -f tasks/auth-09-graphql-rbac/02-graphql-permission-guard.md
test -f tasks/auth-09-graphql-rbac/03-apply-rbac-tests-postman.md
```

## Risks

| Risk                                                  | Mitigation                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PermissionsModule` not imported in `AppModule` today | Task 02 wires module export; Task 03 consumes guard                                                     |
| Tenant only in header, not JWT                        | Guard must use `getTenantIdFromContext` + `sub`; Task 01 adds `tenantId` to JWT for consistency checks  |
| Back-office GraphQL domains lack permission codes     | AUTH-09 enforces only codes that exist in seed; suppliers/recipes stay auth-only until catalog extended |
| MES token on global resolver returns 401 (not 403)    | Postman documents “wrong token type”; optional Task 03 test                                             |

## Stop rule

Stop after task files 00–03 exist. Do not implement AUTH-09 code in this task.

---

## 1. Current JWT payloads

### Global access + refresh (`AuthService.issueTokens`)

| Field         | Present today | Notes                                             |
| ------------- | ------------- | ------------------------------------------------- |
| `sub`         | Yes           | Global `User.id`                                  |
| `email`       | Yes           |                                                   |
| `tenantId`    | **No**        | Tenant comes from `x-tenant-id` on each request   |
| `roleId`      | **No**        |                                                   |
| `roleCode`    | **No**        | Available on `me` / DB via `findByIdWithRoleCode` |
| `permissions` | **No**        |                                                   |

Source: `JwtPayload` in `apps/api/src/auth/interfaces/auth.interfaces.ts`; signing in `auth.service.ts` (`{ sub, email }` for both access and refresh).

Refresh uses same payload + `JWT_REFRESH_SECRET` (`jwt-refresh.strategy.ts`).

### MES access + refresh (`MesAuthService.issueTokens`)

| Field        | Present today                               |
| ------------ | ------------------------------------------- |
| `sub`        | Yes — `OperationalUser.id` (plant identity) |
| `cedulaHash` | Yes                                         |
| `role`       | Yes — `OperationalRole` enum                |
| `sedeId`     | Yes                                         |
| `tenantId`   | Yes                                         |
| `jti`        | Yes (access; blacklist on logout)           |

**Conclusion:** Global JWT does **not** carry enough context for RBAC without DB/header. MES JWT is sufficient for operational identity + `MesRolesGuard`, but **not** for `PermissionsService` (global `User` only).

---

## 2. Current GraphQL protection

### Global guard

- `APP_GUARD` → `JwtAuthGuard` (`app.module.ts`) applies to GraphQL via `GqlExecutionContext` (`jwt-auth.guard.ts`).
- `@Public()` skips global JWT (`auth.resolver.ts`, `mes-auth.resolver.ts` login paths).

### Resolver inventory (apps/api)

| Module / resolver         | Global JWT required                          | MES JWT                                                      | `@Public` operations                                    |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `AuthResolver`            | logout, me, changePassword                   | —                                                            | signup, login, refreshToken, forgot/reset/verify/resend |
| `UserResolver`            | operationalProfile, updateProfile            | —                                                            | —                                                       |
| `MesAuthResolver`         | —                                            | logoutOperational, meOperational (`@Public` + `MesJwtGuard`) | loginOperational                                        |
| `SupplyItemsResolver`     | supplyItems                                  | —                                                            | —                                                       |
| `RecipeResolver`          | recipes, recipe, createRecipe, subscriptions | —                                                            | —                                                       |
| `SupplierResolver`        | all queries/mutations/subscriptions          | —                                                            | —                                                       |
| `SupplierProductResolver` | all                                          | —                                                            | —                                                       |
| `PurchaseOrderResolver`   | all                                          | —                                                            | —                                                       |
| `TenantResolver`          | tenant, tenants                              | —                                                            | —                                                       |

### Role / permission guards on GraphQL

- **None** for permission codes.
- **No** `@RequirePermission` / `PermissionsGuard` / GraphQL equivalent.
- MES GraphQL: `MesJwtGuard` only (no `MesRolesGuard` on resolver — unlike REST `mes-auth.controller.ts` create-user routes).

### Errors today

- Missing/invalid global JWT → Passport `UnauthorizedException` (401-class GraphQL error).
- Missing `x-tenant-id` → `BadRequestException` in resolvers using `getTenantIdFromContext`.
- No `PermissionDenied` / consistent `FORBIDDEN` + extension code for missing permission.
- `PermissionsService` throws `NotFoundException` for missing user (must **not** leak into permission-denied paths).

---

## 3. PermissionsService (USR-02)

| Capability                                      | Status                                                        |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `resolveEffectivePermissions(userId, tenantId)` | Implemented                                                   |
| `hasPermission(userId, tenantId, code)`         | Implemented                                                   |
| Formula `(role ∪ allow) \ deny`                 | Implemented + tested                                          |
| `roleCode` on service API                       | **No** — uses `User.roleId` internally                        |
| OperationalUser                                 | **Not supported** — requires global `User.id`                 |
| HTTP exposure                                   | Placeholder `PermissionsController` only                      |
| `AppModule` registration                        | **`PermissionsModule` not imported** in `app.module.ts` today |

### Operational users (AUTH-09 decision)

| Option                                                         | Use in AUTH-09                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| **A** — Linked `OperationalUser.userId` → global permissions   | Defer to follow-up; needs bridge helper                             |
| **B** — Map `OperationalRole` → `Role.code`                    | Fragile (same codes, different models); not for back-office GraphQL |
| **C** — MES GraphQL/HTTP stays `MesJwtGuard` + `MesRolesGuard` | **Approved** for `loginOperational` / `meOperational` / plant REST  |

Back-office GraphQL RBAC uses **global `accessToken` only** + `PermissionsService` + `x-tenant-id`.

---

## 4. JWT role/permissions strategy

| Approach                           | Pros                                                                   | Cons                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Role/tenant in JWT only**        | Smaller token; role visible to clients; enforcement stays fresh via DB | Extra DB/cache per guarded resolver                                            |
| **Permissions array in JWT**       | Fast checks without DB                                                 | Stale after role/override changes until re-login; large tokens; security drift |
| **Both role + permissions in JWT** | —                                                                      | Worst staleness + size                                                         |

### Approved recommendation

1. **Add to global access + refresh JWT:** `tenantId`, `roleId`, `roleCode` (set at login/signup/refresh from DB).
2. **Do not embed** effective `permissions[]` in JWT for enforcement.
3. **Enforcement:** `PermissionsService.hasPermission(sub, tenantId, code)` at resolver guard time (`tenantId` from JWT **and** must match `x-tenant-id` when header present).
4. **Optional (Task 01):** extend GraphQL/REST `me` to return `roleCode` (already) and optionally `permissions: string[]` for UI — computed server-side, not from JWT.
5. **MES tokens:** unchanged; remain separate secret and payload.

---

## 5. PermissionDenied contract

- HTTP semantic: **403 Forbidden** (not 401).
- GraphQL: `extensions.code = 'PERMISSION_DENIED'` (and `message` generic, e.g. `"Permission denied"`).
- Do not expose required permission code or full matrix to clients (optional: log server-side).
- Distinguish from `UNAUTHENTICATED` (no/invalid JWT) and `BAD_USER_INPUT` (missing tenant header).

Implement in Task 02 via `ForbiddenException` + GraphQL exception filter or dedicated `PermissionDeniedException`.

---

## 6. Resolver → permission mapping (AUTH-09 target)

Seeded codes (13): `mes.users.*`, `plant.*`, `supply.items.*` — see `apps/api/prisma/seed.ts` and Postman folder **09 — RBAC Foundation**.

| GraphQL operation                     | AUTH-09 enforcement                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `me`, `logout`, `changePassword`      | Auth only (no permission code)                                                                           |
| `operationalProfile`, `updateProfile` | Auth only                                                                                                |
| `supplyItems`                         | `supply.items.read`                                                                                      |
| `recipes` / `recipe` / `createRecipe` | **Auth only** — no back-office recipe permission in catalog (`plant.recipes.manage` is MES plant domain) |
| `suppliers` / `supplier` / mutations  | **Auth only** — no supplier permissions in catalog                                                       |
| `supplierProduct*` / `purchaseOrder*` | **Auth only**                                                                                            |
| `tenant` / `tenants`                  | Auth only (consider `@Public` later — out of AUTH-09)                                                    |
| `loginOperational` / `meOperational`  | MES auth only (Option C)                                                                                 |
| Auth public mutations                 | Remain `@Public`                                                                                         |

Task 03 applies guards to **supply items** first; add negative Postman case: OPERATOR global user denied `supply.items.manage` when mutations exist.

---

## 7. Postman (read-only analysis)

- Folder **09** documents RBAC matrix; states **PermissionGuard not active**.
- Folder **10 — GraphQL Auth** covers token flows; no permission-denied cases.
- Env vars: `accessToken`, `mesAccessToken`, `permissionCode` (reference).
- Task 03 will add folder **11 — GraphQL RBAC** (or extend 10): missing token, wrong token type (MES on `supplyItems`), operator vs owner permission denial.

---

## Approved decisions (summary)

1. RBAC enforcement lives in **apps/api** GraphQL resolvers (guards/decorators).
2. **PermissionsService** + DB remain source of truth for effective permissions.
3. Global JWT enriched with **tenantId, roleId, roleCode**; **no** permissions in JWT for enforcement.
4. Permission checks are **server-side** on each guarded operation.
5. **accessToken** and **mesAccessToken** stay separate; no cross-use.
6. **PermissionDenied** is explicit, tested, non-leaking.
7. MES GraphQL keeps **MesJwtGuard**; HTTP plant keeps **MesRolesGuard**; no `PermissionsGuard` on `meOperational` in AUTH-09.

## Task sequence

| Task | Title                        |
| ---- | ---------------------------- |
| 01   | JWT role/permission context  |
| 02   | GraphQL permission guard     |
| 03   | Apply RBAC + tests + Postman |

**First implementation task:** **01-jwt-role-permission-context.md**
