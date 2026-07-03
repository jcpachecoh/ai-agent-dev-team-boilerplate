# Task: add GraphQL bootstrap to apps/api

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-02  
**Depends On:** `01-inventory.md`

---

## Context

`apps/api` already has the NestJS foundation. This task adds the GraphQL plumbing required to host the migrated resolvers inside the same service that already serves REST.

The API should become the single runtime for Prisma, auth, REST, and GraphQL.

---

## Requirements

- [ ] Add a Nest GraphQL module to `apps/api`
- [ ] Add shared GraphQL context with request user, tenant, and loaders if needed
- [ ] Wire JWT auth so REST and GraphQL share the same authentication source
- [ ] Expose a working GraphQL endpoint alongside existing REST controllers
- [ ] Preserve the current env and config conventions used by the API

---

## Acceptance Criteria

- [ ] `apps/api` can boot with REST and GraphQL enabled together
- [ ] The GraphQL endpoint responds locally in development
- [ ] Existing REST routes still work after GraphQL bootstrap is added

---

## Files to Create or Modify

- `apps/api/src/graphql/**` — GraphQL module, context, and shared utilities
- `apps/api/src/auth/**` — reuse or extend auth for GraphQL guards
- `apps/api/src/app.module.ts` — import GraphQL module
- `apps/api/src/main.ts` — ensure global pipes/guards work for both transports
- `apps/api/package.json` — add any missing GraphQL dependencies
