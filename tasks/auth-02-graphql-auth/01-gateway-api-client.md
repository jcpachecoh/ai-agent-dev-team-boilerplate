# AUTH-02 Task 01 — Gateway API HTTP Client

## Goal

Add a typed HTTP client in `apps/gateway` that delegates auth (and future) calls to `apps/api` REST, forwarding tenant/auth/audit headers and mapping REST errors to GraphQL errors.

**Depends on:** Task 00 (decisions approved).

---

## Scope

- Add `API_BASE_URL` (or equivalent) to gateway env validation (default `http://localhost:3001`).
- Implement `ApiClient` (or `RestApiClient`) with methods for auth REST calls used in later tasks (stubs OK for unused methods if typed).
- Forward on every request:
  - `x-tenant-id` when provided
  - `Authorization` when provided
  - `x-forwarded-for` from GraphQL context IP
  - `user-agent` from incoming request
- Map NestJS HTTP status/body to gateway `AuthenticationError`, `ValidationError`, `ConflictError`, etc.
- Wire client into `createServices()` / `GraphQLContext.services` for resolver access.
- Unit tests for error mapping and header forwarding (mock `fetch`).

**Out of scope:** GraphQL resolvers, JWT context changes, Prisma auth removal.

---

## Allowed files

- `apps/gateway/src/config/env.ts`
- `apps/gateway/.env.example`
- `apps/gateway/src/services/api-client.ts` (new)
- `apps/gateway/src/services/types.ts`
- `apps/gateway/tests/services/api-client.test.ts` (new)

---

## Forbidden files

- `apps/api/**`
- `apps/gateway/src/schema/**`
- `apps/gateway/src/context/**`
- `apps/gateway/src/auth/auth.service.ts` (JWT helper — do not repurpose for REST auth)
- `apps/gateway/src/services/auth.service.ts` (legacy Prisma auth — task 08)
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Acceptance criteria

- [x] `API_BASE_URL` validated at startup; documented in `.env.example`.
- [x] Client performs `fetch` to `{API_BASE_URL}/api/...` paths.
- [x] Client forwards `x-tenant-id`, `Authorization`, `x-forwarded-for`, `user-agent`.
- [x] 401 → `AuthenticationError`; 400 → `ValidationError`; 409 → `ConflictError`; other 4xx/5xx mapped consistently.
- [x] Client exposed on `ctx.services.api` (or equivalent) from `createServices`.
- [x] Unit tests cover header forwarding and at least 401/400/409 mapping.
- [x] No Prisma calls in the new client.
- [x] No new auth logic (bcrypt/JWT signing) in gateway.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test -- --testPathPattern=api-client
```

---

## Risks

| Risk                           | Notes                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Adding `node-fetch` dependency | Prefer native `fetch` (Node 18+) to avoid `package.json` change unless blocked    |
| Error body shape mismatch      | Align mapper with NestJS `{ statusCode, message }` responses                      |
| Missing API at dev time        | Document that `apps/api` must run on `:3001` for integration tests in later tasks |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 02 without explicit approval.**
