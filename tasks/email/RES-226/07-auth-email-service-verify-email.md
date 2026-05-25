# RES-226 Task 07 — AuthEmailService: Verify Email Flow

## Goal

Implement `AuthEmailService.sendVerifyEmail()` and add OTP verification logic. This task
introduces Redis for OTP storage (TTL 900s) inside `AuthEmailService`.

**Depends on:** Task 02 (API dep), Task 03 (EmailModule), Task 04 (interfaces).

---

## Scope

- Add `sendVerifyEmail()` to `apps/api/src/auth/service/auth-email.service.ts`.
- Add a Redis client to `AuthEmailService` (following `LockService` pattern).
- Add `verifyOtp(userId, otpCode)` method to `AuthEmailService` (OTP validation + deletion).
- Add `verifyOtp` to `IAuthEmailService` in `auth.interfaces.ts`.
- Extend `apps/api/src/auth/test/auth-email.service.spec.ts` with OTP tests.

---

## Out of scope

- `sendWelcome`, `sendInvitation` (Task 08).
- Controller endpoints (Task 09).
- Module wiring (Task 10).
- No `emailVerified` field on `User` model.

---

## Files allowed

- `apps/api/src/auth/service/auth-email.service.ts` — add `sendVerifyEmail()` and `verifyOtp()`
- `apps/api/src/auth/interfaces/auth.interfaces.ts` — add `verifyOtp` to `IAuthEmailService`
- `apps/api/src/auth/test/auth-email.service.spec.ts` — add OTP tests

---

## Files forbidden

- `auth.repository.ts` — do not modify
- `auth-email.repository.ts` — do not modify (OTP is Redis-only, not DB)
- `auth.module.ts` (wiring is Task 10)
- `auth.controller.ts` (endpoints are Task 09)
- Any file in `packages/`
- `schema.prisma`

---

## Implementation notes

### Redis integration in AuthEmailService

Follow the `LockService` pattern — create Redis client in `OnModuleInit`, destroy in
`OnModuleDestroy`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class AuthEmailService implements IAuthEmailService, OnModuleInit, OnModuleDestroy {
  private redis!: Redis;

  onModuleInit(): void {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
  // ...
}
```

### OTP generation

6-digit numeric OTP:

```typescript
const otpCode = String(crypto.randomInt(100_000, 999_999));
```

Redis key pattern: `otp:{userId}` — TTL 900s.

### sendVerifyEmail()

```typescript
async sendVerifyEmail(
  user: { id: string; email: string; name: string },
  tenant: TenantContext,
): Promise<{ otpCode: string }> {
  const otpCode = String(crypto.randomInt(100_000, 999_999));
  await this.redis.set(`otp:${user.id}`, otpCode, 'EX', 900);

  await this.emailService.send({
    to: user.email,
    subject: 'Verifica tu correo electrónico',
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
    tenantLogoUrl: tenant.tenantLogoUrl,
    primaryColor: tenant.primaryColor,
    template: {
      type: 'verify-email',
      props: {
        userName: user.name,
        otpCode,
        expiresInMinutes: 15,
      },
    },
    priority: 'urgent',
  });

  return { otpCode };
}
```

### verifyOtp()

```typescript
async verifyOtp(userId: string, otpCode: string): Promise<void> {
  const stored = await this.redis.get(`otp:${userId}`);
  if (!stored || stored !== otpCode) {
    throw new BadRequestException('Invalid or expired verification code');
  }
  await this.redis.del(`otp:${userId}`);
}
```

Add `verifyOtp(userId: string, otpCode: string): Promise<void>` to `IAuthEmailService`.

### Minimum tests

- `sendVerifyEmail` stores OTP in Redis with key `otp:{userId}` and TTL 900s.
- `sendVerifyEmail` returns the generated `otpCode`.
- `sendVerifyEmail` calls `emailService.send` with `type: 'verify-email'` and `priority: 'urgent'`.
- `sendVerifyEmail` sends to correct email address.
- `verifyOtp` calls `redis.del` on success.
- `verifyOtp` throws `BadRequestException` when OTP not found in Redis.
- `verifyOtp` throws `BadRequestException` when OTP does not match.

Mock Redis with `{ get: jest.fn(), set: jest.fn(), del: jest.fn(), quit: jest.fn() }` — inject
mock via `onModuleInit` override in test (set `service['redis'] = mockRedis` after module compile).

---

## Acceptance criteria

- [ ] `sendVerifyEmail()` generates a 6-digit OTP and stores it in Redis with TTL 900s.
- [ ] `sendVerifyEmail()` returns `{ otpCode }`.
- [ ] `verifyOtp()` throws `BadRequestException` on mismatch or expired OTP.
- [ ] `verifyOtp()` deletes OTP from Redis on success.
- [ ] All OTP tests pass.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth-email.service
```
