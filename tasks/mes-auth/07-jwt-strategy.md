# MES-AUTH-01 Task 07 — `MesJwtStrategy` + `MesJwtGuard`

## Goal

Create a dedicated Passport JWT strategy (`mes-jwt`) and its corresponding guard
for the MES auth flow. This must not interfere with the existing `jwt` strategy
used by the TestLab auth module.

**Depends on:** Task 02 (interfaces — `MesJwtPayload` type).

---

## Scope

- Create `apps/api/src/mes/auth/strategies/mes-jwt.strategy.ts`.
- Create `apps/api/src/mes/auth/guards/mes-jwt.guard.ts`.

---

## Out of scope

- No changes to existing `jwt.strategy.ts` or `JwtRefreshGuard`.
- No module wiring (Task 08).
- No tests at this step (strategy is thin enough that integration via controller tests covers it).

---

## Files allowed

- `apps/api/src/mes/auth/strategies/mes-jwt.strategy.ts` — create
- `apps/api/src/mes/auth/guards/mes-jwt.guard.ts` — create

---

## Files forbidden

- `apps/api/src/auth/strategies/jwt.strategy.ts` — do not modify
- `apps/api/src/auth/guards/` — do not modify
- `schema.prisma`

---

## Implementation notes

```typescript
// apps/api/src/mes/auth/strategies/mes-jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { MesJwtPayload } from '../interfaces/mes-auth.interfaces';

@Injectable()
export class MesJwtStrategy extends PassportStrategy(Strategy, 'mes-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_MES_SECRET ?? 'mes-dev-secret-change-in-production',
    });
  }

  validate(payload: MesJwtPayload): MesJwtPayload {
    return payload;
  }
}
```

```typescript
// apps/api/src/mes/auth/guards/mes-jwt.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class MesJwtGuard extends AuthGuard('mes-jwt') {}
```

**Design decisions:**

- Strategy name is `'mes-jwt'` (not `'jwt'`) — Passport uses this name to resolve the correct
  strategy when `AuthGuard('mes-jwt')` is invoked. Having two strategies with the same name
  would cause unpredictable behavior.
- `JWT_MES_SECRET` is a separate env var from `JWT_SECRET` — MES tokens are signed with a
  different key so that a TestLab token cannot be used to authenticate as an operational user.
- The `validate` method simply returns the payload (no DB lookup) — same pattern as the
  existing `JwtStrategy`. Token freshness is guaranteed by `exp` in the payload.

---

## Environment variable required

Add to `apps/api/.env.example`:

```
JWT_MES_SECRET=change-me-in-production
JWT_MES_REFRESH_SECRET=change-me-refresh-in-production
```

---

## Acceptance criteria

- [ ] `MesJwtStrategy` extends `PassportStrategy(Strategy, 'mes-jwt')`.
- [ ] `MesJwtStrategy` reads `JWT_MES_SECRET` from env.
- [ ] `MesJwtGuard` extends `AuthGuard('mes-jwt')`.
- [ ] Existing `JwtStrategy` and `JwtRefreshGuard` are unchanged.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
