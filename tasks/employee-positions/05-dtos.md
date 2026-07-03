# EMP-POS-01 Task 05 — DTOs REST (Swagger)

## Goal

Crear DTOs de request/response para el catálogo de cargos vía REST, con `class-validator`.

**Depends on:** Task 02.

---

## Scope

- `apps/api/src/payroll/controller/dto/create-employee-position.dto.ts`
- `apps/api/src/payroll/controller/dto/update-employee-position.dto.ts`
- `apps/api/src/payroll/controller/dto/employee-position.response.dto.ts`
- `apps/api/src/payroll/controller/dto/list-employee-positions-query.dto.ts`

---

## Out of scope

- Controller implementation (Task 06).

---

## Files allowed

- Archivos listados arriba en `controller/dto/`

---

## Implementation notes

### `CreateEmployeePositionDto`

```typescript
@ApiProperty({ example: 'Analista de Nómina' })
@IsString() @IsNotEmpty() @MaxLength(120)
title!: string;

@ApiProperty({ example: 'Administración' })
@IsString() @IsNotEmpty() @MaxLength(120)
area!: string;

@ApiProperty({ example: '4500000.00' })
@IsNumber({ maxDecimalPlaces: 2 })
@Min(0)
baseSalaryRange!: number;
```

### `UpdateEmployeePositionDto`

Todos los campos opcionales con mismas validaciones.

### `ListEmployeePositionsQueryDto`

```typescript
@IsOptional() @IsBoolean() @Transform(...) includeInactive?: boolean;
@IsOptional() @IsString() area?: string;
@IsOptional() @IsString() search?: string;
```

### `EmployeePositionResponseDto`

Mapea `id`, `title`, `area`, `baseSalaryRange` (number), `isActive`, `createdAt`, `updatedAt`.

---

## Acceptance criteria

- [ ] DTOs exportados con `@ApiProperty`.
- [ ] Validaciones en create/update.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
