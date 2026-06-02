# AUTH-02 Task 02 — Dual JWT Context

## Goal

Extend GraphQL context to distinguish **global** JWT (`User`, `JWT_SECRET`, payload `{ sub, email }`) from **operational** JWT (`OperationalUser`, `MES_JWT_SECRET`, payload with `tenantId`, `role`, optional `jti`).

**Depends on:** Task 01 (API client available for protected delegate calls in later tasks).

---

## Scope

- Extend `GraphQLContext` with explicit auth kind, e.g.:
  - `authKind: 'global' | 'operational' | null`
  - `globalUser: { id: string; email: string } | null`
  - `operationalUser: { id: string; tenantId: string; role: UserRole; sedeId?: string; jti?: string } | null`
- Update `createContext` / `authenticate` flow:
  1. Extract Bearer token.
  2. Try verify with global secret (`JWT_SECRET`) — if payload has `email`, set `authKind: 'global'`.
  3. Else try verify with MES secret (`MES_JWT_SECRET` or env fallback chain matching API).
  4. For operational tokens with `jti`, optionally verify not blacklisted (delegate to API on protected routes, or read Redis if already available — prefer minimal: trust API on delegate; local verify for context only).
- Add Pothos auth scopes (or helpers) such as:
  - `isGlobalAuthenticated`
  - `isOperationalAuthenticated`
- Preserve `GRAPHQL_AUTH_DISABLED` dev bypass behavior without breaking dual-kind typing.
- Update `apps/gateway/src/context/types.ts` and tests in `apps/gateway/tests/context.test.ts`.

**Out of scope:** New GraphQL auth resolvers; removing legacy `AuthUser`-only context usage in resolvers (task 08).

---

## Allowed files

- `apps/gateway/src/config/env.ts` (MES JWT env vars only if missing)
- `apps/gateway/.env.example`
- `apps/gateway/src/auth/auth.guard.ts`
- `apps/gateway/src/auth/types.ts`
- `apps/gateway/src/context/createContext.ts`
- `apps/gateway/src/context/types.ts`
- `apps/gateway/src/schema/builder.ts` (auth scope definitions only)
- `apps/gateway/tests/context.test.ts`

---

## Forbidden files

- `apps/api/**`
- `apps/gateway/src/schema/auth/**`
- `apps/gateway/src/services/auth.service.ts`
- `apps/gateway/src/services/api-client.ts` (unless task 01 left a compile fix — prefer no changes)
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] Context exposes `authKind` and separate global vs operational user payloads.
- [x] Global JWT verified with `JWT_SECRET`; operational with MES secret (aligned with API `MesJwtStrategy` fallback order).
- [x] `accessToken` and MES token are not treated as the same type.
- [x] New auth scopes or guards prevent operational token on global-only fields and vice versa.
- [x] Existing non-auth resolvers still compile (may still use legacy `ctx.user` temporarily — document if unchanged).
- [x] Context tests cover: no token, global token, operational token, invalid token.
- [x] No Prisma auth lookups added to context factory.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test -- --testPathPattern=context
```

---

## Risks

| Risk                                   | Notes                                                         |
| -------------------------------------- | ------------------------------------------------------------- |
| Secret mismatch with API               | Document required env parity (`JWT_SECRET`, `MES_JWT_SECRET`) |
| Breaking existing `me` query           | Expected; full resolver fix in tasks 06–08                    |
| Redis blacklist not checked in context | Acceptable for context; logout delegate uses API              |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 03 without explicit approval.**
