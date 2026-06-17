# MES-AUTH-01 Task 08 — `MesAuthModule` + Structure Validation

## Goal

Wire all MES auth providers into `MesAuthModule` and register the module in `AppModule`.
Run `validate-structure.js` to confirm the module follows workspace conventions.

**Depends on:** Tasks 03–07 (all providers must exist before wiring).

---

## Scope

- Create `apps/api/src/mes/auth/mes-auth.module.ts`.
- Register `MesAuthModule` in `apps/api/src/app.module.ts`.
- Add `JWT_MES_SECRET` and `JWT_MES_REFRESH_SECRET` to `apps/api/.env.example`.
- Run `node scripts/validate-structure.js`.

---

## Out of scope

- No changes to `AuthModule`.
- No changes to any existing module.
- No new dependencies in `package.json`.

---

## Files allowed

- `apps/api/src/mes/auth/mes-auth.module.ts` — create
- `apps/api/src/app.module.ts` — add `MesAuthModule` import only
- `apps/api/.env.example` — add `JWT_MES_SECRET` and `JWT_MES_REFRESH_SECRET`

---

## Files forbidden

- `apps/api/src/auth/auth.module.ts` — do not modify
- `schema.prisma`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
// apps/api/src/mes/auth/mes-auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { MesAuthController } from './controller/mes-auth.controller';
import { MesAuthService } from './service/mes-auth.service';
import { MesAuthRepository } from './repository/mes-auth.repository';
import { MesJwtStrategy } from './strategies/mes-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_MES_SECRET ?? 'mes-dev-secret-change-in-production',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [MesAuthController],
  providers: [MesAuthRepository, MesAuthService, MesJwtStrategy],
  exports: [MesAuthService],
})
export class MesAuthModule {}
```

### AppModule change

In `apps/api/src/app.module.ts`, add `MesAuthModule` to the `imports` array:

```typescript
import { MesAuthModule } from './mes/auth/mes-auth.module';

@Module({
  imports: [
    // ... existing imports ...
    MesAuthModule,
  ],
})
export class AppModule {}
```

### `.env.example` additions

```
# MES Auth (cédula + PIN operational users)
JWT_MES_SECRET=change-me-in-production
JWT_MES_REFRESH_SECRET=change-me-refresh-in-production
```

### `validate-structure.js`

The script checks that each module directory under `src/` follows the required structure.
If `mes/auth/` is not yet recognized by the script, check whether it scans subdirectories
recursively. If not, no change is needed — the script validates module-level dirs only.

---

## Acceptance criteria

- [ ] `MesAuthModule` registers `MesAuthController`, `MesAuthService`, `MesAuthRepository`, `MesJwtStrategy`.
- [ ] `MesAuthModule` imports `PrismaModule`, `PassportModule`, `JwtModule`.
- [ ] `AppModule` imports `MesAuthModule`.
- [ ] `JWT_MES_SECRET` and `JWT_MES_REFRESH_SECRET` are in `.env.example`.
- [ ] `node scripts/validate-structure.js` exits 0.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=mes-auth` passes all tests.
- [ ] Existing `AuthModule` is unchanged.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=mes-auth
```
