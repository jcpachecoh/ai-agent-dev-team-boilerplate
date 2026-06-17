# MES-AUTH-01 Task 05 — DTOs

## Goal

Create the `MesLoginDto` class with `class-validator` decorators enforcing cédula
(8–11 digits, numeric string) and PIN (4–6 digits, numeric string) constraints.

**Depends on:** Task 02 (interfaces define the shape; DTOs implement it as classes).

---

## Scope

- Create `apps/api/src/mes/auth/controller/dto/mes-login.dto.ts`.
- No other files.

---

## Out of scope

- No controller implementation.
- No service or repository changes.
- No tests for the DTO (validation is covered implicitly by controller tests in Task 06).

---

## Files allowed

- `apps/api/src/mes/auth/controller/dto/mes-login.dto.ts` — create

---

## Files forbidden

- Any file in `apps/api/src/auth/`
- `schema.prisma`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
// apps/api/src/mes/auth/controller/dto/mes-login.dto.ts
import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MesLoginDto {
  @ApiProperty({
    description: 'Cédula del operador (8–11 dígitos numéricos)',
    example: '12345678',
  })
  @IsString()
  @Matches(/^\d{8,11}$/, { message: 'cedula must be 8–11 numeric digits' })
  cedula!: string;

  @ApiProperty({
    description: 'PIN del operador (4–6 dígitos numéricos)',
    example: '1234',
  })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4–6 numeric digits' })
  pin!: string;
}
```

**Design decisions:**

- `@Matches(/^\d{8,11}$/)` — enforces strictly numeric, correct length range. Rejects
  letters, special characters, and out-of-range lengths at the validation layer before
  the service is called.
- `@Matches(/^\d{4,6}$/)` — same pattern for PIN.
- Both fields use `@IsString()` first so that a non-string body field gets a clean validation
  error before the regex is evaluated.
- No `@IsNotEmpty()` needed — `@Matches` already fails on empty strings.
- The DTO does NOT accept `tenantId` — tenant comes from the JWT in subsequent calls, not from
  the login body.

---

## Acceptance criteria

- [ ] `MesLoginDto` is exported from `mes-login.dto.ts`.
- [ ] `cedula` is validated as 8–11 numeric digits.
- [ ] `pin` is validated as 4–6 numeric digits.
- [ ] Both fields have `@ApiProperty` with example values.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes with 0 errors.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
