# AUTH-02 Task 00 — Analysis & Decisions

## Goal

Document the analysis, architectural decisions, and task sequence for AUTH-02 — GraphQL auth endpoints in `apps/gateway` with REST delegation to `apps/api`. No implementation in this task.

**Status:** Planning (analysis captured here; prior agent analysis incorporated)

---

## Scope

- Record current-state findings for GraphQL auth in gateway vs REST auth in API.
- Record the approved integration pattern (GraphQL → HTTP → AuthService / MesAuthService).
- Define the ordered task sequence (tasks 01–10).
- Capture decisions that downstream tasks must follow.

---

## Out of scope

- Any code, schema, migration, or Postman changes.
- Implementation of any task in this epic.

---

## Allowed files

- `tasks/auth-02-graphql-auth/00-analysis-decisions.md` (this file)
- Other files under `tasks/auth-02-graphql-auth/` (task definitions only)

---

## Forbidden files

- `apps/api/**`
- `apps/gateway/**`
- `apps/web-app/**`
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Current state summary

### GraphQL lives only in `apps/gateway`

| Aspect                  | Location                                                                  |
| ----------------------- | ------------------------------------------------------------------------- |
| GraphQL server          | `apps/gateway` — Apollo Server 4 at `http://localhost:4000/graphql`       |
| Schema style            | Pothos code-first (`apps/gateway/src/schema/**`)                          |
| Web-app consumer        | `apps/web-app/src/lib/graphql-client.ts` → default `:4000/graphql`        |
| Existing domain GraphQL | suppliers, supplier-products, supply-items, recipes, subscriptions        |
| Partial auth GraphQL    | `login`, `logout`, `refreshToken`, `me` — operational-only, Prisma-direct |

### REST auth is source of truth in `apps/api`

| Flow        | Identity          | REST prefix       | Tokens                                                                 | Audit                             |
| ----------- | ----------------- | ----------------- | ---------------------------------------------------------------------- | --------------------------------- |
| Global      | `User`            | `/api/auth/*`     | `accessToken` + `refreshToken`                                         | `LoginAudit` via `AuthService`    |
| Operational | `OperationalUser` | `/api/mes/auth/*` | `accessToken` (stored as `mesAccessToken` in Postman) + `refreshToken` | `LoginAudit` via `MesAuthService` |

### Legacy gateway auth drift (must be replaced)

`GatewayAuthService.loginWithPin()` uses Prisma direct, skips `LoginAudit`, uses different JWT semantics (`token` vs `accessToken`/`refreshToken`), and `logout`/`refreshToken` resolvers are not aligned with REST.

### REST gaps for AUTH-02 ticket

| Operation                                                  | REST today        | Notes                                                                     |
| ---------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `signup`, `login`, `logout`, `refreshToken`, `verifyEmail` | Yes               | Delegate as-is                                                            |
| `changePassword`                                           | **No**            | Closest is `POST /api/auth/reset-password` (token-based, unauthenticated) |
| Global `me`                                                | **No**            | MES has `GET /api/mes/auth/me` only                                       |
| Operational refresh                                        | **No REST route** | Tokens issued; refresh deferred in GraphQL                                |

---

## Key decisions (mandatory for all AUTH-02 tasks)

1. **GraphQL remains in `apps/gateway`.** Do not add GraphQL to `apps/api`.
2. **`apps/api` remains the auth source of truth.** All token issuance, refresh rotation, logout invalidation, and `LoginAudit` stay in NestJS services.
3. **Gateway auth operations must delegate to `apps/api` REST.** Resolvers call HTTP endpoints; they do not reimplement bcrypt/JWT.
4. **No Prisma-direct auth logic for new AUTH-02 flows.** Do not extend `GatewayAuthService.loginWithPin` for new endpoints.
5. **Do not add `@nestjs/graphql` to `apps/api`.**
6. **Do not create a second GraphQL endpoint in `apps/api`.**
7. **Global auth and operational auth remain separate.** Different login flows, JWT strategies, and `sub` IDs.
8. **`accessToken` and `mesAccessToken` remain separate.** Not interchangeable; different secrets/payloads.
9. **`signup`, `login`, `loginOperational` require `x-tenant-id`.** Forward header to API; do not accept tenant-only-in-body as the primary strategy.
10. **`me` and `meOperational` are separate queries.** Do not merge into one unified `me`.
11. **`logout` and `logoutOperational` are separate mutations.** Bearer token type determines which REST route to call.
12. **Global `refreshToken` mutation exists.** Operational refresh is **deferred** unless a REST route is added in a future ticket.
13. **`changePassword` requires REST prerequisite** (task 05) if `POST /api/auth/change-password` does not exist when task 06 runs.
14. **Postman gets folder `10 — GraphQL Auth`** targeting `http://localhost:4000/graphql`.

---

## Approved integration pattern

```
Client (web-app / Postman)
  → GraphQL mutation/query (apps/gateway :4000/graphql)
    → HTTP delegate (ApiClient)
      → REST endpoint (apps/api :3001/api/...)
        → AuthService / MesAuthService / AuditService
```

Gateway responsibilities:

- GraphQL schema (Pothos types, resolvers)
- Header forwarding (`x-tenant-id`, `Authorization`, `x-forwarded-for`, `user-agent`)
- Dual JWT context (`global` vs `operational`)
- REST error → GraphQL error mapping

API responsibilities:

- Password/PIN verification, token issue/rotate/revoke
- `LoginAudit` persistence
- Business rules and guards

---

## Proposed GraphQL surface (target)

### Global auth

| Operation        | Type     | REST delegate                              |
| ---------------- | -------- | ------------------------------------------ |
| `signup`         | mutation | `POST /api/auth/signup`                    |
| `login`          | mutation | `POST /api/auth/login`                     |
| `logout`         | mutation | `POST /api/auth/logout`                    |
| `refreshToken`   | mutation | `POST /api/auth/refresh`                   |
| `verifyEmail`    | mutation | `POST /api/auth/verify-email`              |
| `changePassword` | mutation | `POST /api/auth/change-password` (task 05) |
| `me`             | query    | `GET /api/auth/me` (task 05)               |

### Operational auth

| Operation           | Type     | REST delegate               |
| ------------------- | -------- | --------------------------- |
| `loginOperational`  | mutation | `POST /api/mes/auth/login`  |
| `logoutOperational` | mutation | `POST /api/mes/auth/logout` |
| `meOperational`     | query    | `GET /api/mes/auth/me`      |

### Legacy gateway fields to deprecate (task 08)

- `login` (cedula/pin) → replace with `loginOperational`
- `logout` (no-op) → replace with real global/operational mutations
- `refreshToken` (re-sign) → replace with global `refreshToken` delegate
- `me` (OperationalUser only) → split into `me` / `meOperational`

---

## Task sequence

| #   | File                                  | Summary                                            |
| --- | ------------------------------------- | -------------------------------------------------- |
| 01  | `01-gateway-api-client.md`            | HTTP client + env + error mapping                  |
| 02  | `02-dual-jwt-context.md`              | Dual JWT verification in GraphQL context           |
| 03  | `03-graphql-auth-types.md`            | Pothos output/input types                          |
| 04  | `04-global-auth-mutations.md`         | signup, login, logout, refreshToken, verifyEmail   |
| 05  | `05-api-me-change-password-prereq.md` | REST `me` + `change-password` in API               |
| 06  | `06-global-me-query.md`               | GraphQL `me` + `changePassword`                    |
| 07  | `07-operational-auth-graphql.md`      | loginOperational, meOperational, logoutOperational |
| 08  | `08-deprecate-legacy-gateway-auth.md` | Remove Prisma-direct auth paths                    |
| 09  | `09-tests-validation.md`              | Gateway tests + validation                         |
| 10  | `10-postman-graphql-auth.md`          | Postman folder `10 — GraphQL Auth`                 |

**Recommended first implementation task:** `01-gateway-api-client.md`

---

## Acceptance criteria

- [ ] All 14 key decisions documented above.
- [ ] Task sequence 01–10 defined with dependencies noted.
- [ ] REST gaps (`me`, `changePassword`, operational refresh) explicitly called out.
- [ ] No code or Postman changes in this task.

---

## Validation commands

None (documentation-only task).

---

## Risks

| Risk                                            | Mitigation                                                |
| ----------------------------------------------- | --------------------------------------------------------- |
| Implementers reintroduce Prisma auth in gateway | Task 08 explicitly removes legacy paths; code review gate |
| Split GraphQL added to API by mistake           | Decision 5/6 — forbidden in all gateway-only tasks        |
| Token type confusion in context                 | Task 02 dual JWT + separate queries/mutations             |
| `changePassword` blocked on missing REST        | Task 05 before task 06                                    |

---

## Stop rule

**Stop after this task.** Do not implement task 01 or modify any application code without starting task 01 explicitly.
