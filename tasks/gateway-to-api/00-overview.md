# Consolidation: Move GraphQL from Gateway into API

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `completed`  
**Created:** 2026-06-02  
**Depends On:** `none`

---

## Goal

Consolidate the current GraphQL gateway into `apps/api` so the platform exposes both REST and GraphQL from the same NestJS service.

The objective is to remove the extra deployment surface that is causing Railway build and routing issues, while preserving existing client behavior and GraphQL field names.

---

## Current State

- `apps/gateway` currently owns GraphQL resolvers, auth context, and edge-style request handling.
- `apps/api` already owns Prisma, NestJS modules, and the main backend domain structure.
- Railway is currently easier to break when two services need to stay in sync.

---

## Target State

- `apps/api` serves REST and GraphQL from one NestJS application.
- GraphQL resolvers are migrated into API modules alongside existing REST controllers.
- Shared auth, Prisma, config, and logging live in one runtime.
- `apps/gateway` becomes removable after feature parity is confirmed.

---

## Phase Map

```
01-inventory           Catalog gateway GraphQL operations and REST dependencies
02-bootstrap-graphql   Add GraphQL module, context, auth, and shared plumbing to apps/api
03-migrate-resolvers   Move all gateway resolvers and GraphQL types into API modules
04-rest-graphql-coexistence  Keep REST and GraphQL working in the same service
05-cutover             Remove gateway service, update Railway, and verify deployment
```

---

## Constraints

- Preserve existing GraphQL operation names and response shapes.
- Keep Prisma access inside `apps/api` only.
- Follow the NestJS module structure already used by the API.
- Do not break existing REST endpoints while GraphQL is being added.
- The final deployment should use a single backend service.
