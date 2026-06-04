# RES-226 Task 05 — AuthEmailRepository

## Goal

Implement `AuthEmailRepository` — the Prisma data-access layer for `PasswordResetToken` CRUD.
No business logic, no HTTP exceptions, no token generation.

**Depends on:** Task 01 (schema + Prisma generate), Task 04 (interfaces).

---

## Scope

- Create `apps/api/src/auth/repository/auth-email.repository.ts`.
- Create `apps/api/src/auth/test/auth-email.repository.spec.ts`.

---

## Out of scope

- No token generation or hashing logic (that lives in the service).
- No `AuthEmailService` implementation.
- No controller or module wiring.
- No changes to `auth.repository.ts`.

---

## Files allowed

- `apps/api/src/auth/repository/auth-email.repository.ts` — create
- `apps/api/src/auth/test/auth-email.repository.spec.ts` — create

---

## Files forbidden

- `apps/api/src/auth/repository/auth.repository.ts` — do not modify
- Any file in `packages/`
- `auth.module.ts` — not yet (wiring is Task 10)
- `schema.prisma`

---

## Implementation notes

```typescript
// apps/api/src/auth/repository/auth-email.repository.ts
import { Injectable } from '@nestjs/common';
import type { PasswordResetToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateResetTokenData, IAuthEmailRepository } from '../interfaces/auth.interfaces';

@Injectable()
export class AuthEmailRepository implements IAuthEmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  createResetToken(data: CreateResetTokenData): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({ data });
  }

  findResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async markResetTokenUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteExpiredResetTokens(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
  }
}
```

### Test strategy

Mock `PrismaService` with a plain object. Test each method independently.

Minimum tests:

- `createResetToken` — calls `prisma.passwordResetToken.create` with correct data.
- `findResetToken` — returns token when found, returns `null` when not found.
- `markResetTokenUsed` — calls `update` with `{ usedAt: expect.any(Date) }`.
- `deleteExpiredResetTokens` — calls `deleteMany` with `userId` and correct OR clause.

---

## Acceptance criteria

- [ ] `AuthEmailRepository` implements `IAuthEmailRepository`.
- [ ] `AuthEmailRepository` injects only `PrismaService`.
- [ ] No business logic or HTTP exceptions in repository.
- [ ] All 4 methods are tested.
- [ ] Tests mock `PrismaService` only.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=auth-email.repository` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth-email.repository
```
