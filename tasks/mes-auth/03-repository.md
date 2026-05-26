# MES-AUTH-01 Task 03 — `MesAuthRepository` + Unit Tests

## Goal

Implement `MesAuthRepository` — the Prisma data-access layer for `OperationalUser`.
No business logic, no HTTP exceptions, no hashing. Write unit tests first.

**Depends on:** Task 01 (Prisma generate), Task 02 (interfaces).

---

## Scope

- Create `apps/api/src/mes/auth/repository/mes-auth.repository.ts`.
- Create `apps/api/src/mes/auth/test/mes-auth.repository.spec.ts`.

---

## Out of scope

- No lockout logic (that belongs to the service).
- No hashing (hashing is done by the service before calling the repository).
- No `MesAuthService` implementation.
- No controller or module wiring.

---

## Files allowed

- `apps/api/src/mes/auth/repository/mes-auth.repository.ts` — create
- `apps/api/src/mes/auth/test/mes-auth.repository.spec.ts` — create

---

## Files forbidden

- Any file in `apps/api/src/auth/`
- `auth.module.ts`, `mes-auth.module.ts` — not yet (wiring is Task 08)
- `schema.prisma`
- Any file in `packages/`

---

## Implementation notes

```typescript
// apps/api/src/mes/auth/repository/mes-auth.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { IMesAuthRepository } from '../interfaces/mes-auth.interfaces';

@Injectable()
export class MesAuthRepository implements IMesAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCedulaHash(cedulaHash: string) {
    return this.prisma.operationalUser.findUnique({ where: { cedulaHash } });
  }

  findById(id: string) {
    return this.prisma.operationalUser.findUnique({ where: { id } });
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: { loginAttempts: { increment: 1 } },
    });
  }

  async lockUser(id: string, until: Date): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: { lockedUntil: until },
    });
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: { loginAttempts: 0, lockedUntil: null },
    });
  }

  async saveRefreshToken(id: string, hashedToken: string | null): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: { refreshToken: hashedToken },
    });
  }
}
```

### Test strategy

Mock `PrismaService` with a plain object (`prismaMock`). Test each method independently.
Never test business logic here — only assert that the correct Prisma call is made.

Minimum tests:

- `findByCedulaHash` — calls `operationalUser.findUnique({ where: { cedulaHash } })` and returns result.
- `findByCedulaHash` — returns `null` when not found.
- `findById` — calls `operationalUser.findUnique({ where: { id } })` and returns result.
- `findById` — returns `null` when not found.
- `incrementLoginAttempts` — calls `update` with `{ loginAttempts: { increment: 1 } }`.
- `lockUser` — calls `update` with `{ lockedUntil: <date> }`.
- `resetLoginAttempts` — calls `update` with `{ loginAttempts: 0, lockedUntil: null }`.
- `saveRefreshToken` — calls `update` with `{ refreshToken: 'hashed' }`.
- `saveRefreshToken` — calls `update` with `{ refreshToken: null }` when null passed.

---

## Acceptance criteria

- [ ] `MesAuthRepository` implements `IMesAuthRepository`.
- [ ] `MesAuthRepository` injects only `PrismaService`.
- [ ] No business logic, no HTTP exceptions in repository.
- [ ] All 6 methods are tested (9+ test cases).
- [ ] Tests use a plain `prismaMock` object — no `@nestjs/testing` module setup needed.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=mes-auth.repository` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=mes-auth.repository
```
