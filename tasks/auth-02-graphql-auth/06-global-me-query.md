# AUTH-02 Task 06 — Global `me` Query + `changePassword` Mutation

## Goal

Implement GraphQL `me` query and `changePassword` mutation delegating to new REST endpoints from task 05.

**Depends on:** Tasks 04 (global mutations), 05 (`GET /api/auth/me`, `POST /api/auth/change-password`).

---

## Scope

### Query: `me`

- Type: `GlobalUser`
- Auth: global access token only (`isGlobalAuthenticated`)
- Delegate: `GET /api/auth/me` with `Authorization: Bearer {accessToken}`
- No `x-tenant-id` required

### Mutation: `changePassword`

- Input: `ChangePasswordInput` (currentPassword, newPassword)
- Auth: global access token
- Delegate: `POST /api/auth/change-password`
- Return: `MessagePayload`

Rules:

- Reject operational (MES) Bearer with authorization error, not global profile data.
- Map REST errors to GraphQL errors via API client.
- Do not read `User` from gateway Prisma.

**Out of scope:** Operational `meOperational` (task 07); Postman (task 10).

---

## Allowed files

- `apps/gateway/src/schema/auth/**`
- `apps/gateway/src/services/api-client.ts`
- `apps/gateway/tests/resolvers/global-me.test.ts` (new)

---

## Forbidden files

- `apps/api/**` (unless task 05 incomplete — stop and report)
- `apps/gateway/src/services/auth.service.ts`
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] `me` returns global user profile matching REST `/api/auth/me` JSON.
- [x] `me` requires global JWT; operational token returns auth error.
- [x] `changePassword` delegates to REST; never returns secrets.
- [x] Wrong current password surfaces as GraphQL auth/validation error consistent with API.
- [x] Resolver tests mock API client for both operations.
- [x] No Prisma user lookups in resolvers.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test -- --testPathPattern=global-me
```

Manual smoke (API + gateway running, after global login):

```bash
# me query with accessToken Bearer
curl -s -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"query":"query { me { id email tenantId emailVerified } }"}'
```

---

## Risks

| Risk                       | Notes                                                  |
| -------------------------- | ------------------------------------------------------ |
| Task 05 not merged         | Blocked — verify REST routes exist before implementing |
| Legacy `me` query conflict | Task 08 renames operational `me` to `meOperational`    |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 07 without explicit approval.**
