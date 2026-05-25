# RES-226 Task 06 — AuthEmailService: Reset Password Flow

## Goal

Implement the `sendResetPassword()` method of `AuthEmailService` and the `resetPassword()`
method in `AuthService`. Cover cryptographic token generation, SHA-256 hashing, DB persistence,
email dispatch, and token validation/consumption on reset.

**Depends on:** Task 02 (API dep), Task 03 (EmailModule), Task 04 (interfaces), Task 05 (repository).

---

## Scope

- Create `apps/api/src/auth/service/auth-email.service.ts` (partial — reset-password only).
- Extend `apps/api/src/auth/service/auth.service.ts` with `resetPassword()`.
- Extend `apps/api/src/auth/interfaces/auth.interfaces.ts` with `resetPassword` in `IAuthService`.
- Create `apps/api/src/auth/test/auth-email.service.spec.ts` (partial).
- Update `apps/api/src/auth/test/auth.service.spec.ts` to cover `resetPassword`.

---

## Out of scope

- `sendVerifyEmail`, `sendWelcome`, `sendInvitation` (separate tasks).
- Controller endpoints (Task 09).
- Module wiring (Task 10).
- Redis provider (not needed for reset-password — DB-only).

---

## Files allowed

- `apps/api/src/auth/service/auth-email.service.ts` — create
- `apps/api/src/auth/service/auth.service.ts` — add `resetPassword()` method
- `apps/api/src/auth/interfaces/auth.interfaces.ts` — add `resetPassword` to `IAuthService`
- `apps/api/src/auth/test/auth-email.service.spec.ts` — create
- `apps/api/src/auth/test/auth.service.spec.ts` — add `resetPassword` tests

---

## Files forbidden

- Any file in `packages/`
- `auth.module.ts` (wiring is Task 10)
- `auth.controller.ts` (endpoints are Task 09)
- `schema.prisma`

---

## Implementation notes

### AuthEmailService (partial — reset-password only)

```typescript
// apps/api/src/auth/service/auth-email.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { EmailService } from '@restopsiq/email';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import type { IAuthEmailService, TenantContext } from '../interfaces/auth.interfaces';

const RESET_TOKEN_TTL_SECONDS = 3600;
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

@Injectable()
export class AuthEmailService implements IAuthEmailService {
  constructor(
    private readonly emailService: EmailService,
    private readonly authRepository: AuthRepository,
    private readonly authEmailRepository: AuthEmailRepository,
  ) {}

  async sendResetPassword(
    userEmail: string,
    tenant: TenantContext,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.authRepository.findByEmail(userEmail);
    if (!user) return; // silent — prevents email enumeration

    await this.authEmailRepository.deleteExpiredResetTokens(user.id);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_SECONDS * 1000);

    await this.authEmailRepository.createResetToken({
      tenantId: tenant.tenantId,
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${APP_URL}/auth/reset-password?token=${rawToken}`;
    const expiresAtFormatted = expiresAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    await this.emailService.send({
      to: userEmail,
      subject: 'Restablece tu contraseña',
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      tenantLogoUrl: tenant.tenantLogoUrl,
      primaryColor: tenant.primaryColor,
      template: {
        type: 'reset-password',
        props: {
          userName: user.name ?? userEmail,
          resetUrl,
          expiresAt: expiresAtFormatted,
          ipAddress,
        },
      },
      priority: 'urgent',
    });
  }

  // sendVerifyEmail, sendWelcome, sendInvitation — implemented in Tasks 07 and 08
  async sendVerifyEmail(): Promise<{ otpCode: string }> {
    throw new Error('Not implemented yet');
  }
  async sendWelcome(): Promise<void> {
    throw new Error('Not implemented yet');
  }
  async sendInvitation(): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
```

Note: The stub methods are placeholders for tasks 07 and 08. They satisfy the interface until
those tasks are implemented.

### AuthService.resetPassword()

Add to `auth.service.ts`:

```typescript
async resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const record = await this.authRepository.findResetToken(tokenHash); // delegated — see note

  if (!record) throw new BadRequestException('Invalid or expired reset token');
  if (record.usedAt) throw new BadRequestException('Reset token has already been used');
  if (record.expiresAt < new Date()) throw new BadRequestException('Reset token has expired');

  await this.authRepository.markResetTokenUsed(record.id); // delegated
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await this.authRepository.updatePassword(record.userId, passwordHash);
}
```

`findResetToken` and `markResetTokenUsed` are delegated to `AuthEmailRepository` — inject it
in `AuthService` for the `resetPassword` flow, or alternatively move the full consumption
logic into `AuthEmailService`. **Preferred**: inject `AuthEmailRepository` in `AuthService`
for `resetPassword`, keeping HTTP exception logic in the service layer.

`AuthRepository` needs a new method `updatePassword(userId, passwordHash)`.

### Token security notes

- Raw token: `crypto.randomBytes(32).toString('hex')` — 64 hex chars, 256 bits of entropy.
- Stored hash: `SHA-256(rawToken)` — irreversible; DB breach cannot reveal raw token.
- URL-safe: hex string requires no encoding.
- Single-use: `markResetTokenUsed` sets `usedAt`; subsequent use rejected by `usedAt != null` check.

### Minimum tests for AuthEmailService (reset-password)

- `sendResetPassword` returns void and calls `emailService.send` when user exists.
- `sendResetPassword` returns void silently when user does not exist (no exception thrown).
- `sendResetPassword` calls `deleteExpiredResetTokens` before creating token.
- `sendResetPassword` creates token with correct hash (SHA-256 of randomBytes output).
- `sendResetPassword` creates token with correct TTL (expiresAt ≈ now + 3600s).
- `sendResetPassword` passes `priority: 'urgent'` to `emailService.send`.

### Minimum tests for AuthService.resetPassword

- Throws `BadRequestException` when token not found.
- Throws `BadRequestException` when token already used (`usedAt != null`).
- Throws `BadRequestException` when token expired (`expiresAt < now`).
- Calls `markResetTokenUsed` on valid token.
- Calls `updatePassword` with hashed new password.

---

## Acceptance criteria

- [ ] `AuthEmailService.sendResetPassword()` exists and is covered by tests.
- [ ] Token is hashed with SHA-256 before DB storage.
- [ ] `sendResetPassword` is silent (no throw) when user email not found.
- [ ] `AuthService.resetPassword()` exists and validates used/expired states.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=auth` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth
```
