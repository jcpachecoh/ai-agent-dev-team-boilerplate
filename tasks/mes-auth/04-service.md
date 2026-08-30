# MES-AUTH-01 Task 04 — `MesAuthService` + Unit Tests

## Goal

Implement `MesAuthService` with the full authentication business logic:
credential validation, lockout enforcement, Redis rate limiting, JWT issuance,
logout, me, and getRole. Write unit tests first.

**Depends on:** Task 02 (interfaces), Task 03 (repository).

---

## Scope

- Create `apps/api/src/mes/auth/service/mes-auth.service.ts`.
- Create `apps/api/src/mes/auth/test/mes-auth.service.spec.ts`.

---

## Out of scope

- No controller or DTO.
- No JWT strategy or guard.
- No module wiring.
- No changes to existing `AuthService`.

---

## Files allowed

- `apps/api/src/mes/auth/service/mes-auth.service.ts` — create
- `apps/api/src/mes/auth/test/mes-auth.service.spec.ts` — create

---

## Files forbidden

- Any file in `apps/api/src/auth/`
- `mes-auth.module.ts` — not yet
- `schema.prisma`

---

## Implementation notes

### Constants

```typescript
const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 5;
const ACCESS_TOKEN_TTL = '8h';
const REFRESH_TOKEN_TTL = '7d';
const SALT_ROUNDS = 12;
```

### Login flow

```
1. Compute SHA-256 of raw cédula → cedulaHash
2. Check Redis rate limit for ipAddress:
   - Key: `mes:rate:{ip}`
   - INCR → if > RATE_LIMIT_MAX → throw TooManyRequestsException
   - Set EXPIRE RATE_LIMIT_WINDOW_SECONDS on first increment
3. Find OperationalUser by cedulaHash
4. If not found → throw UnauthorizedException('Cédula o PIN incorrecto')
5. If lockedUntil > now → throw UnauthorizedException('Cédula o PIN incorrecto')
6. Compare bcrypt(pin, user.pinHash)
7. If not match:
   a. repository.incrementLoginAttempts(user.id)
   b. If (user.loginAttempts + 1) >= MAX_ATTEMPTS:
      repository.lockUser(user.id, new Date(Date.now() + LOCK_DURATION_MS))
   c. throw UnauthorizedException('Cédula o PIN incorrecto')
8. repository.resetLoginAttempts(user.id)
9. Issue JWT pair → save hashed refresh token
10. Return { accessToken, refreshToken }
```

### JWT payload

```typescript
const payload: MesJwtPayload = {
  sub: user.id,
  cedulaHash: user.cedulaHash,
  role: user.role,
  sedeId: user.sedeId,
  tenantId: user.tenantId,
};
// accessToken: signAsync(payload, { expiresIn: '8h' })
// refreshToken: signAsync(payload, { expiresIn: '7d', secret: JWT_MES_REFRESH_SECRET })
```

### Redis

Use `ioredis` directly (same pattern as `AuthEmailService`):

```typescript
import Redis from 'ioredis';
// Instantiate in onModuleInit, quit in onModuleDestroy
private redis: Redis;
```

Do **not** inject a shared Redis token — keep it scoped to this service.

### Test strategy

Mock `MesAuthRepository` and `JwtService` with jest mocks.
Mock ioredis with `jest.mock('ioredis')` at the top of the spec file.
Inject the mocked Redis instance directly after `onModuleInit`.

Minimum tests:

- `login` — valid cédula + PIN returns `{ accessToken, refreshToken }`.
- `login` — unknown cédula → `UnauthorizedException`.
- `login` — locked user (`lockedUntil` in future) → `UnauthorizedException`.
- `login` — wrong PIN → `UnauthorizedException` + `incrementLoginAttempts` called.
- `login` — 3rd wrong PIN → `incrementLoginAttempts` + `lockUser` called.
- `login` — rate limit exceeded (Redis INCR > 5) → `TooManyRequestsException`.
- `login` — success resets `loginAttempts`.
- `logout` — calls `saveRefreshToken(id, null)`.
- `me` — returns `{ id, role, tenantId, sedeId }`.
- `me` — user not found → `NotFoundException`.
- `getRole` — returns `{ role }`.
- `getRole` — user not found → `NotFoundException`.

---

## Acceptance criteria

- [ ] `MesAuthService` implements `IMesAuthService`.
- [ ] Login uses SHA-256 for cédula lookup and bcrypt for PIN comparison.
- [ ] Failed login always returns `"Cédula o PIN incorrecto"` (no enumeration).
- [ ] 3 failed attempts → `lockUser` called with `now + 15 min`.
- [ ] Locked user is rejected without incrementing attempts further.
- [ ] Rate limit > 5/min per IP → `TooManyRequestsException` (429).
- [ ] JWT access token TTL is 8h.
- [ ] All minimum tests pass.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=mes-auth.service` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=mes-auth.service
```
