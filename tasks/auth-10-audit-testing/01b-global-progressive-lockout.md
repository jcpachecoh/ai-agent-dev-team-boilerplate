# AUTH-10 Task 01b — Global Progressive Lockout

## Goal

Implement AUTH-03 global lockout on password login: 5 failed attempts → 15-minute lock, LoginAudit FAILED/LOCKED, reset on success.

**Depends on:** Task 01 (LoginAudit). **Unblocks:** Task 02 lockout integration tests.

---

## Scope

- `AuthService.login` only (global email/password).
- Constants: `MAX_LOGIN_ATTEMPTS = 5`, `LOCK_DURATION_MS = 15 minutes`.
- Repository: `incrementLoginAttempts`, `lockUser`, `resetLoginAttempts`.
- **5th failed attempt:** increment → lock → LoginAudit `LOCKED` / `Account locked`.
- **Attempts 1–4:** increment → LoginAudit `FAILED` / `Invalid password`.
- **Pre-locked (`lockedUntil` > now):** no increment, LoginAudit `LOCKED`.
- **Success:** `resetLoginAttempts` (clears attempts, `lockedUntil`, sets `lastLoginAt`).
- Unknown/inactive: no increment.

## Out of scope

- MES lockout (unchanged, 3 attempts).
- Prisma schema/migrations, Postman, JWT, password policy.

## Allowed files

- `apps/api/src/auth/**`
- `apps/api/src/auth/test/**`
- `tasks/auth-10-audit-testing/**`

## Forbidden files

- `apps/api/prisma/**`, `postman/**`, `package.json`, `apps/api/src/mes/**`

## Acceptance criteria

- [x] Wrong password increments `loginAttempts` via repository.
- [x] 5th failure sets `lockedUntil` and logs `LOCKED`.
- [x] Login while locked does not increment.
- [x] Success resets attempts and lock.
- [x] Unknown user does not increment.
- [x] Refresh/logout unchanged.

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='auth|audit'
```

## Stop rule

Stop after validation. Do not start Task 02.
