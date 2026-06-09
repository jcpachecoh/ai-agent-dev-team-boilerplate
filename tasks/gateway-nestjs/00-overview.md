# Refactor: Gateway → NestJS

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Created:** 2026-06-02

## Goal

Migrate `apps/gateway` from a hand-rolled Express + Apollo Server + Pothos stack to
NestJS with `@nestjs/graphql` (code-first, Apollo driver).

The refactor is designed as **incremental, independently deployable phases** so the
gateway stays shippable throughout. Each phase has its own task file.

## Current Stack (to replace)

| Concern           | Current                                       |
| ----------------- | --------------------------------------------- |
| HTTP server       | Express 5                                     |
| GraphQL server    | Apollo Server 4 + `@as-integrations/express5` |
| Schema builder    | Pothos (`@pothos/core` + plugins)             |
| Auth guard        | Custom `authenticate()` middleware            |
| Rate limiting     | `rate-limiter-flexible` (in-process)          |
| Metrics           | Prometheus via custom `metricsMiddleware`     |
| DI / modules      | None — manual `createServices()` factory      |
| Config            | Zod env schema                                |
| Logging           | Pino                                          |
| WebSockets (subs) | `graphql-ws` + raw `ws` server                |

## Target Stack

| Concern       | Target                                        |
| ------------- | --------------------------------------------- |
| HTTP server   | NestJS (Fastify adapter preferred)            |
| GraphQL       | `@nestjs/graphql` code-first, Apollo driver   |
| Schema        | NestJS resolvers / ObjectType decorators      |
| Auth guard    | `@nestjs/passport` + JWT strategy             |
| Rate limiting | `@nestjs/throttler`                           |
| Config        | `@nestjs/config` wrapping existing Zod schema |
| Logging       | Keep Pino via `nestjs-pino`                   |
| DI / modules  | NestJS modules per domain                     |
| WebSockets    | `@nestjs/websockets` or keep `graphql-ws`     |

## Phase Map

```
01-bootstrap       NestJS app shell, config, Pino, Prisma module
02-auth            JWT guard, auth module, login resolver
03-graphql-core    GraphQL module, shared types, context interface
04-tenant          Tenant module + resolver (simple CRUD)
05-supplier        Supplier + SupplierProduct modules + resolvers
06-supply-item     SupplyItem module + resolver
07-recipe          Recipe module + resolver
08-purchase-order  PurchaseOrder module + resolver
09-subscriptions   WebSocket / subscription support
10-cutover         Remove old Express/Pothos code, cleanup
```

## Constraints

- Keep the existing Prisma schema and client (`@prisma/client` from `apps/api`)
- Preserve all existing GraphQL field names / mutation names (breaking change for clients)
- All modules must follow `interfaces/ → repository/ → service/ → resolver/ → test/` layout
  (same as `apps/api` NestJS conventions per `docs/MODULE-STRUCTURE.md`)
- `REDIS_ENABLED` flag must remain respected throughout
- Each phase must pass `pnpm tsc --noEmit` and existing tests before merging
