# RES-226 — Email Module: Auth Integration

## Goal

Integrate `@restopsiq/email` into `apps/api` as a NestJS `EmailModule`, implement an
`AuthEmailService` that orchestrates cryptographic token generation, DB/Redis persistence, and
email dispatch, and expose four new public auth endpoints:

- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`

---

## Background

RES-224 and RES-225 delivered a fully-tested `packages/email` package that exports:

- `EmailService` — pre-renders React Email templates and enqueues jobs to BullMQ.
- `EmailWorker` — processes jobs and sends via Resend with retry/DLQ/rate-limit.
- All four auth email templates: `WelcomeEmail`, `ResetPasswordEmail`, `VerifyEmailTemplate`,
  `InviteUserEmail`.

`apps/api` currently has no email functionality. It does have Redis via `ioredis` (used by
`LockService`) and `PrismaService` for DB access.

---

## Scope

- Add `@restopsiq/email` as a workspace dependency to `apps/api`.
- Fix `EmailServiceConfig` mismatch (Task 02).
- Create `apps/api/src/email/email.module.ts` with `@Global()` provider.
- Add `PasswordResetToken` model to Prisma schema.
- Create `AuthEmailRepository` for `PasswordResetToken` CRUD.
- Create `AuthEmailService` with four methods.
- Add four endpoints to `AuthController`.
- Wire everything into `AuthModule` and `AppModule`.
- Unit tests for all new logic.

---

## Out of scope

- `EmailWorker` bootstrap/lifecycle (separate ticket).
- Tenant model creation (no Tenant table — use `TenantContext` interface).
- Email preview / Storybook.
- Rate limiting at HTTP layer (already handled by `EmailService` worker via BullMQ).
- E2E / integration tests against real DB or Redis.
- `emailVerified` field on `User` model (tracked Redis-only during verification TTL).
- Invitation acceptance flow (endpoint `POST /auth/accept-invite` is out of scope).

---

## Current auth architecture

```
apps/api/src/auth/
├── auth.module.ts            ← imports PrismaModule, PassportModule, JwtModule
├── interfaces/auth.interfaces.ts
├── repository/auth.repository.ts
├── service/auth.service.ts   ← signup, login, refresh, logout
├── controller/auth.controller.ts ← POST signup, login, refresh, logout
├── controller/dto/login.dto.ts, signup.dto.ts
├── guards/jwt-refresh.guard.ts
├── strategies/jwt.strategy.ts, jwt-refresh.strategy.ts
└── test/auth.{controller,service,repository,strategies}.spec.ts
```

`AuthController` injects only `AuthService`. Global `JwtAuthGuard` protects all routes;
`@Public()` bypasses it.

---

## Current User/Tenant limitations

**No Tenant model.** The `User` model has no `tenantId`. Other domain models use `tenantId:
String` as a plain denormalized field. For email dispatch, tenant context (name, logo, colors) must
be passed as a plain `TenantContext` interface:

```typescript
export interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}
```

`AuthEmailService` methods receive this interface, not a Prisma `Tenant` entity.

No `emailVerified` field exists on `User`. Email verification state is maintained Redis-only
(TTL 900s). Verification status is consumed on first correct use.

---

## Prisma model contract

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  tenantId  String
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([tenantId, userId])
  @@map("password_reset_tokens")
}
```

**No `User` relation declared** — to avoid coupling `User` model changes to this ticket.
The `userId` references `User.id` by convention.

After schema change:

```bash
cd apps/api && npx prisma format
cd apps/api && npx prisma validate
cd apps/api && npx prisma generate
```

---

## EmailModule integration strategy

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

Because `EmailModule` is `@Global()`, any module that imports `AppModule` (which imports
`EmailModule`) can inject `EmailService` without re-importing.

---

## EmailServiceConfig mismatch and resolution strategy

**Problem:** `EmailServiceConfig` in `packages/email/src/types.ts` currently declares:

```typescript
export interface EmailServiceConfig {
  redisUrl: string;
  resendApiKey: string; // ← required but EmailService never uses it
  from: string; // ← required but EmailService never uses it
}
```

`EmailService` only uses `config.redisUrl` in its constructor. The other fields belong to
`EmailWorkerConfig`, not `EmailServiceConfig`.

**Resolution (Task 02):** Make `resendApiKey` and `from` optional in `EmailServiceConfig`:

```typescript
export interface EmailServiceConfig {
  redisUrl: string;
  resendApiKey?: string; // used only by EmailWorker
  from?: string; // used only by EmailWorker
}
```

This is a non-breaking change. `EmailModule.useFactory` can then pass only `{ redisUrl }`.
The fix lives in `packages/email/src/types.ts`. Must re-run typecheck after.

---

## AuthEmailService contract

```typescript
// apps/api/src/auth/service/auth-email.service.ts

@Injectable()
export class AuthEmailService {
  /**
   * Generates a secure single-use reset token, hashes it, stores in DB,
   * and enqueues the reset-password email.
   * Returns silently if user not found (prevents email enumeration).
   */
  async sendResetPassword(
    userEmail: string,
    tenant: TenantContext,
    ipAddress?: string,
  ): Promise<void>;

  /**
   * Generates a 6-digit OTP, stores it in Redis with TTL 900s,
   * and enqueues the verify-email email.
   * Returns the otpCode for caller's use (e.g., tests).
   */
  async sendVerifyEmail(
    user: { id: string; email: string; name: string },
    tenant: TenantContext,
  ): Promise<{ otpCode: string }>;

  /**
   * Enqueues a welcome email. No token generation needed.
   */
  async sendWelcome(
    user: { email: string; name: string; role: WelcomeProps['role'] },
    tenant: TenantContext,
    temporaryPassword?: string,
  ): Promise<void>;

  /**
   * Generates an invite token, stores in Redis with TTL 172800s,
   * and enqueues the invite-user email.
   */
  async sendInvitation(
    invitee: { email: string; name: string },
    inviter: { name: string },
    tenant: TenantContext,
    role: string,
    workspaceName: string,
  ): Promise<void>;
}
```

---

## AuthEmailRepository strategy

New file: `apps/api/src/auth/repository/auth-email.repository.ts`

Responsibilities (Prisma only, no business logic, no HTTP exceptions):

```typescript
export interface IAuthEmailRepository {
  createResetToken(data: CreateResetTokenData): Promise<PasswordResetToken>;
  findResetToken(tokenHash: string): Promise<PasswordResetToken | null>;
  markResetTokenUsed(id: string): Promise<void>;
  deleteExpiredResetTokens(userId: string): Promise<void>;
}

export interface CreateResetTokenData {
  tenantId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}
```

---

## Endpoint contracts

### POST /auth/forgot-password

```
@Public()
Body: ForgotPasswordDto { email: string }
Response: 200 { message: 'If the email exists, a reset link has been sent.' }
Note: Always 200 regardless of whether email exists (prevents enumeration).
```

### POST /auth/reset-password

```
@Public()
Body: ResetPasswordDto { token: string, newPassword: string (min 8, max 72) }
Response: 200 { message: 'Password updated successfully.' }
Errors:
  400 — token expired
  400 — token already used
  400 — token not found
```

### POST /auth/verify-email

```
@Public()
Body: VerifyEmailDto { otpCode: string }
Response: 200 { message: 'Email verified successfully.' }
Errors:
  400 — OTP not found or expired
```

### POST /auth/resend-verification

```
@Public()
Body: ResendVerificationDto { email: string }
Response: 200 { message: 'If the email exists, a verification code has been sent.' }
Note: Always 200 regardless of whether email exists.
```

---

## Token security strategy

| Token type     | Storage                           | Format                                   | TTL     | Hash before store       |
| -------------- | --------------------------------- | ---------------------------------------- | ------- | ----------------------- |
| reset-password | DB (PasswordResetToken.tokenHash) | `crypto.randomBytes(32).toString('hex')` | 3600s   | SHA-256                 |
| verify-email   | Redis `otp:{userId}`              | 6-digit numeric OTP                      | 900s    | No (OTP is short-lived) |
| invite         | Redis `invite:{token}`            | `crypto.randomBytes(32).toString('hex')` | 172800s | No (token IS the key)   |

**Password reset token flow:**

1. Generate: `rawToken = crypto.randomBytes(32).toString('hex')`
2. Hash: `tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')`
3. Store: `PasswordResetToken { tokenHash, expiresAt: now + 3600s }`
4. Email: URL contains `rawToken`
5. Verify: hash incoming token → look up `tokenHash` in DB

**Single-use enforcement:** On successful reset, set `usedAt = new Date()`. On any use attempt,
reject if `usedAt != null` (400 Bad Request) or `expiresAt < now()` (400 Bad Request).

---

## Redis TTL strategy

| Key pattern         | TTL     | Used by           |
| ------------------- | ------- | ----------------- |
| `otp:{userId}`      | 900s    | verify-email OTP  |
| `invite:{rawToken}` | 172800s | invite-user token |

Redis instance: injected in `AuthEmailService` constructor via a dedicated provider or direct
`new Redis(process.env.REDIS_URL)` following the `LockService` pattern.

---

## Password reset flow

```
Client                  AuthController          AuthEmailService         AuthEmailRepository
  |                         |                       |                        |
  |--POST /forgot-password-->|                       |                        |
  |  { email }              |                       |                        |
  |                         |--sendResetPassword()-->|                        |
  |                         |                       |--findByEmail()-------->AuthRepository
  |                         |                       |<-- user | null --------|
  |                         |                       |  (if null: return early)|
  |                         |                       |--deleteExpired()------->|
  |                         |                       |--createResetToken()---->|
  |                         |                       |--emailService.send()   |
  |<--200 always------------|                       |                        |

  |--POST /reset-password--->|                       |                        |
  |  { token, newPassword }  |                       |                        |
  |                         |--resetPassword()*----->AuthService             |
  |                         |   (new method in       |--findResetToken()----->|
  |                         |    AuthService or       |<-- token | null -------|
  |                         |    AuthEmailService)   |  (if null: 400)        |
  |                         |                       |  check usedAt/expiresAt|
  |                         |                       |--markUsed()------------>|
  |                         |                       |--bcrypt.hash(newPwd)   |
  |                         |                       |--user.update(pwdHash)  |
  |<--200 or 400 ------------|                       |                        |
```

Note: `reset-password` token consumption and password update logic should live in `AuthService`
(because it modifies `User.passwordHash`) — `AuthEmailService` delegates to it.

---

## Email verification flow

```
Client                  AuthController          AuthEmailService         Redis
  |                         |                       |                        |
  |--POST /resend-verify---->|                       |                        |
  |  { email }              |                       |                        |
  |                         |--sendVerifyEmail()---->|                        |
  |                         |                       |--generate 6-digit OTP  |
  |                         |                       |--SET otp:{userId} TTL->|
  |                         |                       |--emailService.send()   |
  |<--200 always------------|                       |                        |

  |--POST /verify-email----->|                       |                        |
  |  { otpCode }            |                       |                        |
  |                         |--verifyOtp()---------->|                        |
  |                         |                       |--GET otp:{userId}----->|
  |                         |                       |  (if null: 400)        |
  |                         |                       |--DEL otp:{userId}----->|
  |<--200 or 400 ------------|                       |                        |
```

Note: `POST /verify-email` requires the user to be authenticated (JWT) to identify which
`userId` to look up in Redis.

---

## Welcome/invitation flow

- `sendWelcome()`: Called after `signup()` by `AuthService` or explicitly. No token. Directly
  calls `emailService.send()` with `template: { type: 'welcome', props: {...} }`.
- `sendInvitation()`: Generates invite token, stores in Redis, calls `emailService.send()`.
  Accept URL: `${process.env.APP_URL}/auth/accept-invite?token={rawToken}`.

---

## Testing strategy

| File                                      | What to test                                                                            | Mock                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `test/auth-email.repository.spec.ts`      | CRUD methods                                                                            | `PrismaService`                                |
| `test/auth-email.service.spec.ts`         | Token generation, hash, TTL, silent on missing user, token reuse 400, token expired 400 | `AuthEmailRepository`, `EmailService`, `Redis` |
| `test/auth.controller.spec.ts` (extended) | 4 new endpoints delegate correctly, always-200 on forgot-password/resend                | `AuthEmailService`                             |

Patterns to follow:

- Mock with plain objects `{ method: jest.fn() }`
- `jest.clearAllMocks()` in `beforeEach`
- Spy on `crypto.randomBytes` is allowed but not required (test hash contract via behavior)

---

## Acceptance criteria

- [ ] `POST /auth/forgot-password` returns 200 for both existing and non-existing emails.
- [ ] Reset token is stored as SHA-256 hash in DB, never plaintext.
- [ ] Reset token URL contains raw token (not hash).
- [ ] Reusing the same reset token returns 400.
- [ ] Expired reset token returns 400 with descriptive message.
- [ ] `POST /auth/verify-email` with correct OTP returns 200 and deletes OTP from Redis.
- [ ] `POST /auth/verify-email` with wrong/expired OTP returns 400.
- [ ] `EmailService.send()` is called once per email dispatch method.
- [ ] All new endpoints are `@Public()`.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes with 0 errors.
- [ ] All new test suites pass.
- [ ] `node scripts/validate-structure.js` passes.

---

## Risks and follow-ups

| #   | Risk                                                                                            | Resolution                                                                           |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | `EmailServiceConfig` requires `resendApiKey` and `from` but `EmailService` only uses `redisUrl` | Task 02: make them optional in `packages/email/src/types.ts`                         |
| 2   | No `Tenant` model in Prisma                                                                     | Use `TenantContext` interface throughout — no schema change needed                   |
| 3   | `verify-email` endpoint needs to know `userId`                                                  | Require JWT auth on `POST /auth/verify-email` (remove `@Public()` from that one)     |
| 4   | `AuthController` constructor changes break existing spec                                        | Update `auth.controller.spec.ts` to include `AuthEmailService` mock                  |
| 5   | Redis injection in `AuthEmailService`                                                           | Follow `LockService` pattern: `new Redis(process.env.REDIS_URL)` in `onModuleInit()` |
| 6   | `pnpm install` required after adding workspace dep                                              | Must run after Task 02 — lockfile will update                                        |

---

## Validation commands

```bash
# Task 01 — schema
cd apps/api && npx prisma format
cd apps/api && npx prisma validate
cd apps/api && npx prisma generate

# Task 02 — types fix + dep add
pnpm install
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/api typecheck

# After any auth task
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth

# Task 10 — full wiring
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test
node scripts/validate-structure.js

# Task 11 — manual validation
# (see 11-postman-api-validation.md)
```
