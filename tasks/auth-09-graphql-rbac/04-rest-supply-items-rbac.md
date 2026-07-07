# AUTH-09 Task 04 — REST supply-items RBAC

## Goal

Close the GraphQL vs REST bypass by applying the same permission model to REST supply-items routes.

**Depends on:** Tasks 01–03 complete.

---

## Scope

### Controller enforcement (global JWT only)

| Route                               | Permission                                    |
| ----------------------------------- | --------------------------------------------- |
| `GET /api/supply-items`             | `supply.items.read`                           |
| `GET /api/supply-items/:id`         | `supply.items.read`                           |
| `POST` / `PATCH` / `PUT` / `DELETE` | `supply.items.manage` when write routes exist |

`@UseGuards(PermissionsGuard)` on `SupplyItemsController`. Write routes not implemented in API yet — manage covered in unit tests + Postman docs.

### Tests

- REST metadata: read on `findAll` / `findOne`.
- OWNER read/manage allow via `PermissionsGuard` (HTTP context).
- OPERATOR read allow; manage deny → `PermissionDeniedException`.
- Missing user → `UnauthorizedException`.
- Tenant mismatch → 403 permission denied.
- MES token vs global JWT secret (regression).

### Postman

- Extend folder **04 — Supply Items** with **REST RBAC** requests (owner/operator read, no token, MES token, tenant mismatch).

## Out of scope

- Suppliers, recipes, purchase-orders, plant, MES RBAC.
- Prisma schema, seed, JWT payload, permission catalog.
- Implementing full REST CRUD (POST/PATCH/DELETE).
- AUTH-10.

## Allowed files

- `apps/api/src/supplyitems/**`
- `apps/api/src/common/**` (only if HTTP denial behavior needs change)
- `apps/api/src/permissions/**` (tests only)
- `apps/api/src/**/test/**`
- `postman/restopsiq-api.collection.json`
- `postman/local.environment.json`
- `postman/README.md`
- `tasks/auth-09-graphql-rbac/**`

## Forbidden files

- `apps/api/prisma/schema.prisma`, migrations, `seed.ts`
- `package.json`, `pnpm-lock.yaml`
- JWT payload / MES auth changes
- Other modules’ RBAC
- `apps/api/src/app.module.ts`

## Acceptance criteria

- [x] `PermissionsGuard` on REST supply-items controller.
- [x] Read routes require `supply.items.read`.
- [x] Manage permission documented/tested for future write routes.
- [x] Global `accessToken` required; `mesAccessToken` rejected.
- [x] Tenant mismatch → 403 without matrix leakage.
- [x] Postman REST RBAC cases in folder 04.
- [x] README states GraphQL + REST supply-items protected.

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='supply|permissions|auth|rbac'
node -e "JSON.parse(require('fs').readFileSync('postman/restopsiq-api.collection.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('postman/local.environment.json','utf8'))"
```

## Stop rule

Stop after validation. AUTH-09 complete (GraphQL + REST supply-items). Do not start AUTH-10.
