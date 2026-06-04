# AUTH-03 Task 02 — Lockout & Token Expiration

## Goal

Implement **global** account lockout after **5** failed password attempts; verify token expiration, refresh rotation, and logout behavior; ensure `LoginAudit` records FAILED/LOCKED; document MES lockout vs ticket.

**Depends on:** Task 01 complete (or parallel only if no `AuthService` conflicts).

---

## Scope

### Global lockout (`AuthService` + `AuthRepository`)

- On failed password (user exists, active, not already locked): increment `loginAttempts`.
- When `loginAttempts` reaches **5**: set `lockedUntil` (define duration, e.g. 15 minutes — match MES or document constant).
- On successful login: reset `loginAttempts` to 0, clear `lockedUntil`, set `lastLoginAt`.
- When `lockedUntil > now`: reject with same generic message as invalid credentials; log `LoginAuditStatus.LOCKED`.
- Failed password: log `LoginAuditStatus.FAILED` (already present — keep).
- Add repository methods: `incrementLoginAttempts`, `lockUser`, `resetLoginAttempts` (mirror MES pattern).

### MES lockout (review only unless product requires 5)

- **Current:** `MAX_ATTEMPTS = 3`, 15 min lock, Redis IP rate limit (5/hour).
- **Decision in PR:** Either change operational threshold to **5** to match ticket, or document intentional **3** for PIN in `00-analysis-decisions.md` / PR description (no silent mismatch).

### Token expiration (verify + tests)

- **Global:** `ACCESS_TOKEN_TTL = '15m'`, `REFRESH_TOKEN_TTL = '7d'`; refresh re-hashes and stores new refresh token; logout sets `refreshToken` null.
- **Guards:** `ignoreExpiration: false` on jwt / jwt-refresh / mes-jwt strategies.
- **Errors:** Expired/invalid JWT → 401; invalid refresh → 403 with safe message (existing behavior).
- **MES:** Access 8h; logout blacklists `jti` in Redis; no new refresh REST route.
- **GraphQL:** No code changes unless delegation breaks; confirm resolvers still call REST only.

### Tests

- Global: 4 failures no lock; 5th failure sets lock; locked login returns 401 + LOCKED audit; success resets attempts.
- Refresh: invalid/expired refresh logs FAILED; valid refresh rotates token.
- Optional: expired access JWT guard test if missing.
- MES: update tests only if threshold changed to 5.

**Out of scope:** Postman lockout folder (task 03), sensitive field audit (task 03), password min length (task 01).

---

## Allowed files

- `apps/api/src/auth/service/auth.service.ts`
- `apps/api/src/auth/repository/auth.repository.ts`
- `apps/api/src/auth/interfaces/auth.interfaces.ts`
- `apps/api/src/auth/test/auth.service.spec.ts`
- `apps/api/src/auth/test/auth.repository.spec.ts`
- `apps/api/src/auth/strategies/jwt.strategy.ts` (tests only unless bug found)
- `apps/api/src/auth/strategies/jwt-refresh.strategy.ts`
- `apps/api/src/auth/guards/jwt-refresh.guard.ts`
- `apps/api/src/auth/test/jwt-refresh.guard.spec.ts`
- `apps/api/src/auth/test/auth.strategies.spec.ts` (if exists and relevant)
- `apps/api/src/mes/auth/service/mes-auth.service.ts` (only if aligning MAX_ATTEMPTS to 5)
- `apps/api/src/mes/auth/repository/mes-auth.repository.ts` (only if MES threshold changed)
- `apps/api/src/mes/auth/test/mes-auth.service.spec.ts` (only if MES changed)
- `tasks/auth-03-backend-security/00-analysis-decisions.md` (document MES threshold decision only)

---

## Forbidden files

- `apps/api/prisma/schema.prisma` / `migrations/**` (fields already exist)
- `apps/gateway/**` (unless bug found in delegation — then stop and split)
- `postman/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `scripts/validate-structure.js`

---

## Acceptance criteria

- [x] After **5** failed global password attempts, `lockedUntil` is set and further login attempts log **LOCKED** until expiry.
- [x] Successful global login resets `loginAttempts` and `lockedUntil`.
- [x] Generic error message on failure/lock (no account enumeration).
- [x] `LoginAudit` has FAILED on wrong password and LOCKED on locked account.
- [x] Refresh rotation and logout invalidation unchanged and covered by tests.
- [x] JWT strategies reject expired tokens (`ignoreExpiration: false`).
- [x] MES lockout decision documented (3 vs 5) in analysis file or PR notes.
- [x] `node scripts/validate-structure.js` passes.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern="auth\.(service|repository|strategies|jwt-refresh)"
pnpm --filter=@restopsiq/api test -- --testPathPattern=mes-auth.service
pnpm --filter=@restopsiq/api typecheck
```

---

## Risks

| Risk                                   | Mitigation                                       |
| -------------------------------------- | ------------------------------------------------ |
| Lockout blocks seeded users during QA  | Document unlock via DB or wait for `lockedUntil` |
| Changing MES from 3→5 breaks floor ops | Explicit product decision in PR                  |
| Race on concurrent failed logins       | Use DB increment like MES repository             |

---

## Stop rule

Stop after task 02 validation passes. Do not start task 03 in the same PR unless explicitly requested.
