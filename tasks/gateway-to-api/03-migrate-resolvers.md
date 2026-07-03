# Task: migrate gateway resolvers into apps/api modules

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `in-progress`  
**Created:** 2026-06-02  
**Depends On:** `02-bootstrap-graphql.md`

---

## Context

This is the core migration step: move the GraphQL schema, resolvers, and shared types from the gateway into the API module tree that already owns the business logic.

The backend should continue serving the same GraphQL operations, just from the same runtime as REST.

---

## Requirements

- [x] Move all gateway GraphQL resolvers into `apps/api`
- [x] Move shared GraphQL types and DTOs needed by those resolvers into API modules
- [x] Reuse existing API repositories and services where possible instead of duplicating logic
- [x] Preserve all GraphQL names, inputs, and outputs used by clients
- [x] Keep module boundaries aligned with the API's NestJS conventions

---

## Acceptance Criteria

- [x] Every previously working gateway GraphQL operation is implemented in `apps/api`
- [x] Resolver tests cover the migrated operations
- [x] No resolver in `apps/gateway` remains required for production behavior

---

## Progress Notes

- Migrated domains in `apps/api`: `auth`, `supplyitems`, `user`, `supplier`, `supplier-product`, `recipe`, `purchase-order`, `tenant`.
- Resolver module parity confirmed: 8 gateway resolver modules matched by 8 API resolver modules.
- Added resolver and service unit tests for `purchase-order` and `tenant` under:
  - `apps/api/src/purchase-order/test/*`
  - `apps/api/src/tenant/test/*`
- Validation:
  - `pnpm build` in `apps/api` passes.
  - Targeted Jest suites for `purchase-order` and `tenant` pass.

---

## Files to Create or Modify

- `apps/api/src/**/resolver/**` — new GraphQL resolvers for each domain
- `apps/api/src/**/controller/**` — only if shared DTOs or auth adapters are needed
- `apps/api/src/**/service/**` — reuse or extend domain services
- `apps/api/src/**/interfaces/**` — add GraphQL-facing contracts where helpful
- `apps/gateway/src/schema/**` — delete or deprecate after parity is reached
