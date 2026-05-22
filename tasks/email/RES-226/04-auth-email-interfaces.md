# RES-226 Task 04 — Auth Email Interfaces

## Goal

Define all TypeScript interfaces and types required by the auth email flow:
`IAuthEmailRepository`, `IAuthEmailService`, `TenantContext`, and `CreateResetTokenData`.
These contracts must be defined before any implementation files are written.

**Depends on:** Task 01 (Prisma schema must be generated so `PasswordResetToken` type is available).

---

## Scope

- Add new interfaces to `apps/api/src/auth/interfaces/auth.interfaces.ts`.
- No implementation files.
- No tests.

---

## Out of scope

- No repository or service class implementation.
- No controller or DTO changes.
- No changes to existing `IAuthRepository` or `IAuthService`.

---

## Files allowed

- `apps/api/src/auth/interfaces/auth.interfaces.ts` — append new interfaces only

---

## Files forbidden

- Any implementation file (repository, service, controller)
- Any file in `packages/`
- `schema.prisma`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

Append to the existing `auth.interfaces.ts` (do not replace existing content):

```typescript
import type { PasswordResetToken } from '@prisma/client';

// ---------------------------------------------------------------------------
// Tenant context (no Prisma Tenant model exists)
// ---------------------------------------------------------------------------

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}

// ---------------------------------------------------------------------------
// Auth email repository
// ---------------------------------------------------------------------------

export interface CreateResetTokenData {
  tenantId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IAuthEmailRepository {
  createResetToken(data: CreateResetTokenData): Promise<PasswordResetToken>;
  findResetToken(tokenHash: string): Promise<PasswordResetToken | null>;
  markResetTokenUsed(id: string): Promise<void>;
  deleteExpiredResetTokens(userId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Auth email service
// ---------------------------------------------------------------------------

export interface IAuthEmailService {
  sendResetPassword(userEmail: string, tenant: TenantContext, ipAddress?: string): Promise<void>;

  sendVerifyEmail(
    user: { id: string; email: string; name: string },
    tenant: TenantContext,
  ): Promise<{ otpCode: string }>;

  sendWelcome(
    user: { email: string; name: string; role: string },
    tenant: TenantContext,
    temporaryPassword?: string,
  ): Promise<void>;

  sendInvitation(
    invitee: { email: string; name: string },
    inviter: { name: string },
    tenant: TenantContext,
    role: string,
    workspaceName: string,
  ): Promise<void>;
}
```

**Why `role: string` in `IAuthEmailService.sendWelcome`?** `WelcomeProps.role` is typed as
`'owner' | 'manager' | 'cashier' | 'accountant'` in `packages/email`. The interface uses a
broader `string` to avoid importing package types into the interface layer. The implementation
will cast/validate.

---

## Acceptance criteria

- [ ] `TenantContext` interface is exported from `auth.interfaces.ts`.
- [ ] `CreateResetTokenData` interface is exported.
- [ ] `IAuthEmailRepository` interface is exported with 4 methods.
- [ ] `IAuthEmailService` interface is exported with 4 methods.
- [ ] Existing interfaces (`IAuthRepository`, `IAuthService`, `AuthTokens`, `JwtPayload`) are unchanged.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes with 0 errors.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
