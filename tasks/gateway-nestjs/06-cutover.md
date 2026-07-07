# Task: cutover — remove old express/pothos stack, final cleanup

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-02  
**Depends On:** `05-tenant-user-subscriptions.md`

---

## Context

Once all domain modules are live in NestJS (phases 01–05), the original Express/Pothos
code can be deleted. This task is a pure cleanup pass — no new features, no schema changes.

---

## Requirements

- [ ] Delete `src/app.ts` (Express app factory — replaced by NestJS bootstrap)
- [ ] Delete `src/index.ts` (replaced by `src/main.ts`)
- [ ] Delete `src/server.ts` (Apollo Server factory)
- [ ] Delete `src/schema/` directory (all Pothos type builders and resolvers)
- [ ] Delete `src/context/createContext.ts` and `src/context/dataLoaders.ts`
      (replaced by `src/graphql/`)
- [ ] Delete `src/services/types.ts` and `src/services/base.service.ts`
      (replaced by per-module repositories)
- [ ] Delete `src/middleware/` (replaced by NestJS guards/interceptors)
- [ ] Remove Pothos packages from `package.json`:
      `@pothos/core`, `@pothos/plugin-errors`, `@pothos/plugin-scope-auth`,
      `@pothos/plugin-validation`, `@pothos/plugin-dataloader`
- [ ] Remove `@as-integrations/express5`, `express`, `cors`, `helmet`
      (Fastify adapter used instead)
- [ ] Remove `rate-limiter-flexible` (replaced by `@nestjs/throttler`)
- [ ] Update `tsconfig.json` — remove any paths that referenced deleted dirs
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] All existing tests pass: `pnpm --filter @restopsiq/gateway test`
- [ ] Bundle size (`dist/`) is smaller than current build

---

## Acceptance Criteria

- [ ] No file in `src/` imports from `express`, `@pothos/*`, or `rate-limiter-flexible`
- [ ] `GET /health`, `GET /metrics`, and `POST /graphql` all return correct responses
- [ ] Full test suite passes with no skipped tests
- [ ] Railway deploy succeeds (check Deployments tab)
- [ ] `pnpm --filter @restopsiq/gateway build` exits 0

---

## Files to Delete

- `apps/gateway/src/app.ts`
- `apps/gateway/src/index.ts`
- `apps/gateway/src/server.ts`
- `apps/gateway/src/schema/` (entire directory)
- `apps/gateway/src/context/` (entire directory)
- `apps/gateway/src/services/base.service.ts`
- `apps/gateway/src/services/types.ts`
- `apps/gateway/src/middleware/` (entire directory)

## Files to Modify

- `apps/gateway/package.json` — remove deleted deps, verify all remaining deps are used
- `apps/gateway/tsconfig.json` — clean up paths
- `apps/gateway/jest.config.js` — update `roots` if needed
