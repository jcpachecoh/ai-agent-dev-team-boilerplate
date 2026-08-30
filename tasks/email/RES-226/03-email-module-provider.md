# RES-226 Task 03 — EmailModule Provider

## Goal

Create `apps/api/src/email/email.module.ts` as a `@Global()` NestJS module that provides
`EmailService` from `@restopsiq/email` using a factory, and register it in `AppModule`.

**Depends on:** Task 02 (workspace dep and `EmailServiceConfig` fix must be done first).

---

## Scope

- Create `apps/api/src/email/email.module.ts`.
- Register `EmailModule` in `apps/api/src/app.module.ts`.
- Typecheck passes.

---

## Out of scope

- No `AuthEmailService` yet.
- No controller or endpoint.
- No `email/` repository, service, or interfaces beyond the module file.
- No tests for this module (the module is just DI wiring).

---

## Files allowed

- `apps/api/src/email/email.module.ts` — create new file
- `apps/api/src/app.module.ts` — add `EmailModule` import

---

## Files forbidden

- Any file in `apps/api/src/auth/`
- Any file in `packages/`
- `schema.prisma`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### email.module.ts

```typescript
// apps/api/src/email/email.module.ts
import { Global, Module } from '@nestjs/common';
import { EmailService } from '@restopsiq/email';

@Global()
@Module({
  providers: [
    {
      provide: EmailService,
      useFactory: () =>
        new EmailService({
          redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
        }),
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
```

**Why `@Global()`?** `EmailService` must be injectable in `AuthModule` (and potentially future
modules) without each module re-importing `EmailModule`. This follows the pattern for globally
shared infrastructure providers (same approach as `PrismaModule` if it were global).

**Why `useFactory` and not `useClass`?** `EmailService` from `@restopsiq/email` is not a
NestJS-decorated class — it is a plain TypeScript class that takes a config object in its
constructor. `useFactory` handles this correctly.

**Redis URL pattern:** Consistent with `LockService` which reads `process.env.REDIS_URL`
directly. No `ConfigModule` used anywhere in `apps/api`.

### app.module.ts

Add `EmailModule` to the `imports` array:

```typescript
import { EmailModule } from './email/email.module';

@Module({
  imports: [PrismaModule, EmailModule, AuthModule, AuditModule, TestlabModule, SupplyItemsModule, LockModule],
  ...
})
export class AppModule {}
```

`EmailModule` must be imported **before** `AuthModule` to ensure the global provider is
registered before `AuthModule` consumers can inject it.

---

## Acceptance criteria

- [ ] `apps/api/src/email/email.module.ts` exists and exports `EmailModule`.
- [ ] `EmailModule` is decorated with `@Global()`.
- [ ] `EmailService` is provided via `useFactory` reading `process.env.REDIS_URL`.
- [ ] `EmailModule` is imported in `AppModule`.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes with 0 errors.
- [ ] No other files were changed.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
