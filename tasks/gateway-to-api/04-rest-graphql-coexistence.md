# Task: keep REST and GraphQL working in one service

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `completed`  
**Created:** 2026-06-02  
**Depends On:** `03-migrate-resolvers.md`

---

## Context

After GraphQL is inside the API, the service must continue to support both REST and GraphQL without route conflicts, auth regressions, or deployment drift.

This task covers the integration edge where the two transports share the same business logic, auth, and configuration.

---

## Requirements

- [x] Confirm REST controllers and GraphQL resolvers can use the same domain services
- [x] Confirm shared auth works for both REST and GraphQL requests
- [x] Confirm health checks and deployment startup still pass
- [x] Confirm no route conflicts exist between REST paths and GraphQL endpoint paths
- [x] Add or update tests that prove both transports work in the same runtime

---

## Acceptance Criteria

- [x] A local `apps/api` run serves REST and GraphQL together
- [x] Existing REST integrations still pass
- [x] Existing GraphQL integrations still pass
- [x] The service starts cleanly in Railway-like production settings

---

## Progress Notes

- Added explicit API health route: `GET /health` (excluded from global `/api` prefix) while preserving `GET /api`.
- Confirmed route separation remains clean: REST under `/api/*`, GraphQL under `/graphql`.
- Updated controller test coverage in `apps/api/src/app.controller.spec.ts` for `/health` alias behavior.

---

## Files to Create or Modify

- `apps/api/src/app.module.ts` — final transport wiring
- `apps/api/src/main.ts` — startup and global middleware/guards
- `apps/api/src/health/**` — verify health checks still reflect both transports
- `apps/api/src/**/test/**` — update or add integration coverage
- `apps/api/prisma/**` — only if any schema-driven resolver needs it
