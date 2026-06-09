# Task: tenant + user modules + subscriptions

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-02  
**Depends On:** `04-domain-modules.md`

---

## Context

Two remaining domain modules (`tenant`, `user`) plus the real-time subscription
infrastructure need to be migrated before the old code can be removed.

The current gateway has a `pubsub.ts` singleton using `graphql-subscriptions`
`PubSub`. In NestJS this becomes a shared `PubSubModule` (singleton-scoped) that
any resolver can inject.

---

## Requirements

**Tenant module**

- [ ] `interfaces/tenant.interfaces.ts`, `repository/`, `service/`, `resolver/`
- [ ] Queries: `tenant(id)`, `tenants` (owner-only)
- [ ] Mutations: `createTenant`, `updateTenant` (owner-only, guarded by role check)

**User module**

- [ ] `interfaces/user.interfaces.ts`, `repository/`, `service/`, `resolver/`
- [ ] Queries: `me` (returns current user from JWT), `users` (admin-only)
- [ ] Mutations: `updateMyProfile`, `changePin`

**PubSub / Subscriptions**

- [ ] `src/pubsub/pubsub.module.ts` — provides `PUB_SUB` token wrapping `PubSub` instance
      from `graphql-subscriptions`; replace with Redis-backed `PubSub` when `REDIS_ENABLED=true`
- [ ] Migrate any existing `Subscription` resolvers from Pothos schema to NestJS
      `@Subscription()` decorators
- [ ] WebSocket auth: validate JWT from `connectionParams.Authorization` in the
      `GraphQLModule` `subscriptions.onConnect` hook

---

## Acceptance Criteria

- [ ] `Query.me` returns the authenticated user's profile
- [ ] `Mutation.createTenant` is only accessible to `OWNER` role
- [ ] At least one subscription (`alarmTriggered` or equivalent) works end-to-end via
      `graphql-ws` in development
- [ ] `pnpm tsc --noEmit` passes

---

## Files to Create or Modify

- `apps/gateway/src/tenant/` (full module)
- `apps/gateway/src/user/` (full module)
- `apps/gateway/src/pubsub/pubsub.module.ts`
- `apps/gateway/src/graphql/graphql.module.ts` — add `subscriptions.onConnect` JWT hook
