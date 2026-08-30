# AUTH-02 Task 04 — Global Auth GraphQL Mutations

## Goal

Implement GraphQL mutations that delegate to global REST auth endpoints: `signup`, `login`, `logout`, `refreshToken`, `verifyEmail`.

Email flows `forgotPassword`, `resetPassword`, `resendVerification` are **task 11** (expanded AUTH-02 scope).

**Depends on:** Tasks 01 (API client), 03 (GraphQL types).

---

## Scope

Wire Pothos mutations in `apps/gateway/src/schema/auth/`:

| Mutation       | REST                          | Headers                                |
| -------------- | ----------------------------- | -------------------------------------- |
| `signup`       | `POST /api/auth/signup`       | `x-tenant-id` required                 |
| `login`        | `POST /api/auth/login`        | `x-tenant-id` required                 |
| `logout`       | `POST /api/auth/logout`       | `Authorization: Bearer {accessToken}`  |
| `refreshToken` | `POST /api/auth/refresh`      | `Authorization: Bearer {refreshToken}` |
| `verifyEmail`  | `POST /api/auth/verify-email` | none                                   |

Implementation rules:

- Read `x-tenant-id` from GraphQL HTTP request headers (`ctx.request`), not from mutation input as primary tenant source.
- Forward `ctx.ip` and `user-agent` for LoginAudit (API extracts these).
- Return `{ accessToken, refreshToken }` on signup/login/refresh — same shape as REST.
- Use `isGlobalAuthenticated` scope on `logout` only.
- Do **not** implement `changePassword` or `me` in this task (tasks 05–06).
- Do **not** implement operational mutations in this task (task 07).

**Out of scope:** Removing legacy gateway `login`/`logout`/`refreshToken` (task 08); Postman (task 10).

---

## Allowed files

- `apps/gateway/src/schema/auth/**`
- `apps/gateway/src/services/api-client.ts` (add auth method wrappers if not done in task 01)
- `apps/gateway/tests/resolvers/global-auth.test.ts` (new)

---

## Forbidden files

- `apps/api/**`
- `apps/gateway/src/services/auth.service.ts`
- `apps/gateway/src/context/**` (unless compile fix)
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] All five mutations delegate to API via HTTP client — no Prisma auth, no local JWT signing for these flows.
- [x] `signup` and `login` fail with clear GraphQL error if `x-tenant-id` header missing.
- [x] Token responses match REST: `{ accessToken, refreshToken }`.
- [x] `logout` invalidates refresh token server-side (REST behavior preserved).
- [x] `refreshToken` uses refresh JWT as Bearer (same as REST `JwtRefreshGuard`).
- [x] `verifyEmail` returns message payload on success.
- [x] Resolver tests mock API client and assert correct paths/headers/bodies.
- [ ] Manual smoke: with API running, GraphQL login produces LoginAudit row (document in report; no automated DB test required).

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test -- --testPathPattern=global-auth
```

Optional manual smoke (API + gateway running):

```bash
curl -s -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: palos-de-lena' \
  -d '{"query":"mutation { login(input: { email: \"mes-owner@palos-de-lena.dev\", password: \"TestPass123!\" }) { accessToken refreshToken } }"}'
```

---

## Risks

| Risk                                     | Notes                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Legacy `login` mutation name collision   | Global `login` replaces semantic; legacy operational `login` removed in task 08 |
| Refresh token passed in input vs header  | Match REST: Bearer refresh JWT on refresh mutation                              |
| Coexistence with legacy auth.mutation.ts | May temporarily have duplicate field names — resolve in task 08                 |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 05 without explicit approval.**
