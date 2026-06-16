# RES-226 Task 10 — AuthModule Wiring and Final Validation

## Goal

Wire `AuthEmailService` and `AuthEmailRepository` into `AuthModule`, confirm all providers are
registered, run full typecheck and tests, and validate module structure.

**Depends on:** All previous tasks (03, 05, 06, 07, 08, 09) must be complete.

---

## Scope

- Update `apps/api/src/auth/auth.module.ts` to include new providers.
- Run full validation suite.

---

## Out of scope

- No new implementation code.
- No new tests.
- No schema changes.

---

## Files allowed

- `apps/api/src/auth/auth.module.ts` — add `AuthEmailRepository` and `AuthEmailService`

---

## Files forbidden

- Any service, repository, or controller file (all implementation must already be done)
- `app.module.ts` (already updated in Task 03)
- Any file in `packages/`
- `schema.prisma`

---

## Implementation notes

Updated `AuthModule`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { AuthEmailService } from './service/auth-email.service';
import { AuthRepository } from './repository/auth.repository';
import { AuthEmailRepository } from './repository/auth-email.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthEmailRepository,
    AuthService,
    AuthEmailService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

**`EmailService` injection:** Because `EmailModule` is `@Global()`, `AuthEmailService` can
inject `EmailService` without `AuthModule` re-importing `EmailModule`. This is the intended
behavior of the `@Global()` decorator.

### Validation checklist

Run each command and confirm exit code 0:

```bash
# 1. Prisma client up-to-date
cd apps/api && npx prisma generate

# 2. TypeScript — zero errors
pnpm --filter=@restopsiq/api typecheck

# 3. All auth tests pass
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth

# 4. Full test suite
pnpm --filter=@restopsiq/api test

# 5. Module structure validation
node scripts/validate-structure.js
```

---

## Acceptance criteria

- [ ] `AuthModule` registers `AuthEmailRepository` and `AuthEmailService`.
- [ ] `AuthEmailService` can inject `EmailService` from the global `EmailModule`.
- [ ] `pnpm --filter=@restopsiq/api typecheck` exits 0.
- [ ] All auth tests pass.
- [ ] Full test suite passes.
- [ ] `node scripts/validate-structure.js` exits 0.
- [ ] No unrelated files were touched.

---

## Validation commands

```bash
cd apps/api && npx prisma generate
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth
pnpm --filter=@restopsiq/api test
node scripts/validate-structure.js
```
