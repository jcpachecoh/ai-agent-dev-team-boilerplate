# AUTH-02 Task 05 — API REST Prerequisites (`me` + `changePassword`)

## Goal

Add missing REST endpoints in `apps/api` so GraphQL can delegate global `me` and `changePassword` without Prisma reads in gateway.

**Depends on:** Task 04 (global auth mutations working via REST delegate).

---

## Scope

Implement in `apps/api` auth module:

### `GET /api/auth/me`

- Protected by global JWT (`JwtAuthGuard` / existing app guard).
- Returns safe `User` profile (no `passwordHash`, `refreshToken`).
- Include `roleCode` from related `Role`.
- Tenant scope from JWT `sub` lookup (no `x-tenant-id` required).

### `POST /api/auth/change-password`

- Protected by global JWT.
- Body: `{ currentPassword, newPassword }` (min length 8, max 72 — match existing DTO conventions).
- Verify current password with bcrypt; update `passwordHash`; optionally set `passwordChangedAt`.
- Return `{ message: 'Password updated successfully.' }` or 204-style message object.
- Do **not** expose hashes in response.

### Service layer

- Add `AuthService.me(userId: string)` and `AuthService.changePassword(userId, currentPassword, newPassword)` (or equivalent).
- Use existing repository safe-select paths.
- Optional: `AuditLog` UPDATE on password change — only if trivial within scope; LoginAudit not required for password change.

**Out of scope:** GraphQL resolvers (task 06); MES endpoints; Postman REST folder updates (optional note in task 10).

---

## Allowed files

- `apps/api/src/auth/interfaces/auth.interfaces.ts`
- `apps/api/src/auth/repository/auth.repository.ts`
- `apps/api/src/auth/service/auth.service.ts`
- `apps/api/src/auth/controller/auth.controller.ts`
- `apps/api/src/auth/controller/dto/change-password.dto.ts` (new)
- `apps/api/src/auth/controller/dto/me-response.dto.ts` (new, if needed)
- `apps/api/src/auth/test/auth.service.spec.ts`
- `apps/api/src/auth/test/auth.controller.spec.ts`

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth.module.ts` (unless compilation blocker — stop and report)
- `apps/gateway/**`
- `postman/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Acceptance criteria

- [x] `GET /api/auth/me` returns 200 with safe user profile for valid global access token.
- [x] `GET /api/auth/me` returns 401 without token.
- [x] `POST /api/auth/change-password` succeeds with valid current password.
- [x] `POST /api/auth/change-password` returns 401/403 with wrong current password (match existing auth error style).
- [x] Responses never include `passwordHash` or `refreshToken`.
- [x] Controller/service/repository tests updated and passing.
- [x] No Prisma schema changes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth
node scripts/validate-structure.js
```

---

## Risks

| Risk                            | Notes                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `auth.module.ts` wiring needed  | Stop and report if forbidden file must change                                  |
| Duplicate with `reset-password` | Document: change-password is authenticated; reset-password remains token-based |
| Missing global user in JWT      | Reuse existing `JwtStrategy` payload `{ sub, email }`                          |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 06 without explicit approval.**
