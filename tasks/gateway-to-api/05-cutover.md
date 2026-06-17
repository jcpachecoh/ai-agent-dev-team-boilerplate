# Task: remove gateway service and finalize single-service deployment

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `completed`  
**Created:** 2026-06-02  
**Depends On:** `04-rest-graphql-coexistence.md`

---

## Context

Once the API serves both REST and GraphQL correctly, the gateway service should be removed so the deployment surface stays simple and stable.

This final step cleans up the old GraphQL gateway and updates Railway so only one backend service remains.

---

## Requirements

- [x] Remove gateway-specific GraphQL code after parity is confirmed
- [x] Update Railway so only `apps/api` is deployed for backend traffic
- [x] Remove or archive gateway build config and deployment notes
- [x] Clean up any frontend or client references that pointed directly at the gateway service
- [x] Verify the single-service deployment works in production

---

## Acceptance Criteria

- [x] Railway runs one backend service for REST and GraphQL
- [x] No production traffic depends on `apps/gateway`
- [x] The old gateway code is no longer part of the release path

---

## Progress Notes

- Web-app local stack no longer starts gateway (`dev:stack` now runs `api + web-app`).
- Web-app GraphQL defaults/proxy now target API (`/graphql` proxied to `apps/api`, default target `http://localhost:3001`).
- Frontend runtime messaging updated to reference API GraphQL instead of gateway.
- Railway root config now uses API health check endpoint (`/health`) backed by `apps/api`.
- `apps/gateway` runtime removed (stub package + README only); GraphQL auth contract aligned with web-app/Postman (`GlobalLoginInput`, `loginOperational`, etc.).
- Smoke tests: `apps/api/src/test/smoke.spec.ts` and `apps/api/SMOKE-TESTS.md`.

---

## Files to Create or Modify

- `apps/gateway/**` — delete or archive obsolete GraphQL runtime files
- `apps/api/**` — final production backend entrypoint
- `railway.toml` — ensure it targets the API service only
- `apps/gateway/railway.toml` — remove if no longer needed
- `apps/web-app/**` — update any client URLs if they still reference gateway directly
