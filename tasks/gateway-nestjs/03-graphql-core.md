# Task: graphql core — module, context, shared types, throttler

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-02  
**Depends On:** `02-auth.md`

---

## Context

The current gateway wires Apollo Server manually with a `createContext()` factory that
builds per-request DataLoaders and injects services. With NestJS the equivalent is the
`GraphQLModule.forRootAsync()` context factory and a request-scoped `GqlContext`.

This task also replaces `rate-limiter-flexible` with `@nestjs/throttler` and wires
`nestjs-pino` as the NestJS logger.

---

## Requirements

- [ ] Install: `@nestjs/graphql`, `@apollo/server`, `@as-integrations/fastify`,
      `@nestjs/throttler`
- [ ] `src/graphql/graphql.module.ts` — `GraphQLModule.forRootAsync` with:
  - `autoSchemaFile: true` (in-memory, code-first)
  - `subscriptions: { 'graphql-ws': true }`
  - `context` factory that attaches `{ user, tenantId, requestId, loaders }` to each request
  - Playground enabled in non-production
- [ ] `src/graphql/context.ts` — `GqlContext` interface (replaces `GraphQLContext` in old code)
- [ ] `src/graphql/dataloader/` — DataLoader factories moved here from old `context/dataLoaders.ts`
- [ ] `src/common/throttler.module.ts` — `ThrottlerModule.forRootAsync` reading
      `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW` from config; `GqlThrottlerGuard`
      extracting IP from GraphQL context
- [ ] Prometheus metrics endpoint (`GET /metrics`) kept via a plain `MetricsController`
- [ ] `pnpm tsc --noEmit` passes

---

## Acceptance Criteria

- [ ] GraphQL Playground loads at `/graphql` in development
- [ ] `{ user, requestId }` available in any resolver via `@Context()`
- [ ] Throttler returns HTTP 429 after exceeding `RATE_LIMIT_MAX_REQUESTS` in a window
- [ ] `GET /metrics` returns Prometheus text format
- [ ] WebSocket subscription handshake succeeds (`graphql-ws` protocol)

---

## Files to Create or Modify

- `apps/gateway/src/graphql/graphql.module.ts`
- `apps/gateway/src/graphql/context.ts`
- `apps/gateway/src/graphql/dataloader/` (per-entity loader files)
- `apps/gateway/src/common/throttler.module.ts`
- `apps/gateway/src/common/throttler.guard.ts`
- `apps/gateway/src/metrics/metrics.controller.ts`
- `apps/gateway/src/metrics/metrics.module.ts`
- `apps/gateway/src/app.module.ts` — add `GraphQLModule`, `ThrottlerModule`
