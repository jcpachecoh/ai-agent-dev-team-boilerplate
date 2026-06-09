# Task: inventory gateway GraphQL surface

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-02  
**Depends On:** `00-overview.md`

---

## Context

Before moving code, we need a complete map of what the gateway currently exposes through GraphQL and what each resolver depends on in the API and database.

This task is about finding the migration boundary, not changing behavior.

---

## Requirements

- [ ] List every GraphQL query, mutation, and subscription currently exported by `apps/gateway`
- [ ] Identify the gateway files that implement auth, context, loaders, and pub/sub
- [ ] Map each GraphQL operation to the API module or database model it depends on
- [ ] Mark any REST endpoints that share domain logic with the GraphQL resolvers
- [ ] Document which parts must stay public and which parts require auth

---

## Acceptance Criteria

- [ ] A migration map exists for all gateway GraphQL operations
- [ ] No business logic is changed in this phase
- [ ] The dependency map is detailed enough to drive resolver-by-resolver migration

---

## Files to Create or Modify

- `apps/gateway/src/schema/**` — catalog queries, mutations, and subscriptions
- `apps/gateway/src/context/**` — catalog auth/context dependencies
- `apps/gateway/src/services/**` — catalog shared business logic used by GraphQL
- `tasks/gateway-to-api/01-inventory.md` — keep notes and migration map current
