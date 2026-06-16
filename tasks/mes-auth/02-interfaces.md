# MES-AUTH-01 Task 02 — Interfaces + `MesJwtPayload`

## Goal

Define all TypeScript contracts for the MES auth module before any implementation is written:
`IOperationalAuthRepository`, `IOperationalAuthService`, and `MesJwtPayload`.

**Depends on:** Task 01 (Prisma generate must have run so `OperationalUser` and `OperationalRole`
types are available from `@prisma/client`).

---

## Scope

- Create `apps/api/src/mes/auth/interfaces/mes-auth.interfaces.ts`.
- No implementation files.
- No tests.

---

## Out of scope

- No repository or service class implementation.
- No controller, DTO, strategy, or module.
- No changes to existing `auth.interfaces.ts`.

---

## Files allowed

- `apps/api/src/mes/auth/interfaces/mes-auth.interfaces.ts` — create

---

## Files forbidden

- Any existing file in `apps/api/src/auth/`
- Any file in `packages/`
- `schema.prisma`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
// apps/api/src/mes/auth/interfaces/mes-auth.interfaces.ts
import type { OperationalUser, OperationalRole } from '@prisma/client';

export interface IMesAuthRepository {
  findByCedulaHash(cedulaHash: string): Promise<OperationalUser | null>;
  findById(id: string): Promise<OperationalUser | null>;
  incrementLoginAttempts(id: string): Promise<void>;
  lockUser(id: string, until: Date): Promise<void>;
  resetLoginAttempts(id: string): Promise<void>;
  saveRefreshToken(id: string, hashedToken: string | null): Promise<void>;
}

export interface MesLoginDto {
  cedula: string;
  pin: string;
}

export interface MesAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface MesMeResponse {
  id: string;
  role: OperationalRole;
  tenantId: string;
  sedeId: string | null;
}

export interface IMesAuthService {
  login(dto: MesLoginDto, ipAddress: string): Promise<MesAuthTokens>;
  logout(userId: string): Promise<void>;
  me(userId: string): Promise<MesMeResponse>;
  getRole(userId: string): Promise<{ role: OperationalRole }>;
}

export interface MesJwtPayload {
  sub: string;
  cedulaHash: string;
  role: OperationalRole;
  sedeId: string | null;
  tenantId: string;
}
```

**Design decisions:**

- `findByCedulaHash` — the repository receives the already-computed SHA-256 hash. The service
  is responsible for hashing the raw cédula before calling the repository.
- `incrementLoginAttempts` and `lockUser` are separate methods — the service decides when to
  lock; the repository only performs the write.
- `MesJwtPayload` carries `cedulaHash` (not raw cédula) in the JWT for traceability.
- `IMesAuthService.login` receives `ipAddress` so the service can enforce the Redis rate limit.

---

## Acceptance criteria

- [ ] `IMesAuthRepository` is exported with 6 methods.
- [ ] `IMesAuthService` is exported with 4 methods.
- [ ] `MesJwtPayload` is exported with `sub`, `cedulaHash`, `role`, `sedeId`, `tenantId`.
- [ ] `MesAuthTokens`, `MesMeResponse` are exported.
- [ ] Existing `auth.interfaces.ts` is unchanged.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes with 0 errors.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
