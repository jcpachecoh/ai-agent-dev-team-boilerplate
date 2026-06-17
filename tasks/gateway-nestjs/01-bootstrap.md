# Task: bootstrap nestjs app shell for gateway

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-02  
**Depends On:** none

---

## Context

`apps/gateway` is currently a plain Express + Apollo Server app with no dependency
injection framework. This task replaces the entry point with a NestJS application
while keeping the existing config, Pino logger, and Prisma client intact.

The goal is a **running, deployable NestJS app** that serves only `GET /health`
at the end of this phase. Subsequent phases layer the GraphQL and domain modules on top.

---

## Requirements

- [ ] Install NestJS core deps: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify`,
      `@nestjs/config`, `nestjs-pino`, `pino-http`
- [ ] Create `src/app.module.ts` — root module, imports `ConfigModule` and `PrismaModule`
- [ ] Create `src/prisma/prisma.module.ts` and `src/prisma/prisma.service.ts` wrapping the
      existing Prisma singleton
- [ ] Create `src/config/config.module.ts` wrapping the existing Zod `env` object via
      `@nestjs/config` custom `validate` function (keep Zod schema, don't rewrite it)
- [ ] Replace `src/index.ts` bootstrap with NestJS `NestFactory.create` using Fastify adapter
- [ ] Wire Pino via `nestjs-pino` `LoggerModule.forRoot()`
- [ ] Add `GET /health` via a `HealthController` (`@nestjs/terminus` or a plain controller)
      returning `{ status, uptime, timestamp, env }` — same shape as current `/health`
- [ ] Keep `REDIS_ENABLED` env flag plumbing (no Redis connection unless explicitly enabled)
- [ ] All existing env vars validated at startup; app exits on invalid config
- [ ] `pnpm tsc --noEmit` passes with zero errors

---

## Acceptance Criteria

- [ ] `pnpm --filter @restopsiq/gateway dev` starts without errors
- [ ] `GET /health` returns `{ status: "ok", ... }` with HTTP 200
- [ ] Zod config validation rejects a missing `DATABASE_URL` at startup
- [ ] No reference to `express` or `apollo-server` in the new entry point

---

## Files to Create or Modify

- `apps/gateway/package.json` — add NestJS deps, remove express/apollo deps that move later
- `apps/gateway/src/main.ts` — NestJS bootstrap (replaces `index.ts`)
- `apps/gateway/src/app.module.ts` — root module
- `apps/gateway/src/config/config.module.ts` — wraps Zod env
- `apps/gateway/src/prisma/prisma.module.ts`
- `apps/gateway/src/prisma/prisma.service.ts`
- `apps/gateway/src/health/health.controller.ts`
- `apps/gateway/src/health/health.module.ts`
- `apps/gateway/tsconfig.json` — enable `emitDecoratorMetadata`, `experimentalDecorators`
