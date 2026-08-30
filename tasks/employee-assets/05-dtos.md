# OS-558 Task 05 — DTOs REST (Swagger) + InputTypes GraphQL

## Goal

Crear DTOs de entrada/salida para el controller REST (con decoradores Swagger) y InputTypes para el resolver GraphQL.

**Depends on:** Task 02 (interfaces, tipos base).

---

## Scope

```
apps/api/src/payroll/controller/dto/
├── create-employee-asset.dto.ts
├── update-employee-asset.dto.ts
└── employee-asset.response.dto.ts
```

GraphQL InputTypes pueden ir en `apps/api/src/payroll/resolver/` o en `dto/` siguiendo el patrón del proyecto.

---

## Out of scope

- Controller (Task 06), resolver (Task 07).

---

## Implementation

### `create-employee-asset.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetType } from '@prisma/client';

export class CreateEmployeeAssetDto {
  @ApiProperty({ description: 'ID del empleado (EmployeeDetails.id)' })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: 'Nombre o descripción del activo',
    example: 'Computador portátil Dell XPS',
  })
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @ApiProperty({ enum: AssetType, description: 'Categoría del activo' })
  @IsEnum(AssetType)
  type: AssetType;

  @ApiProperty({ description: 'Valor del activo en COP', example: 3500000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({ description: 'Fecha de asignación (ISO 8601). Default: ahora.' })
  @IsOptional()
  @IsDateString()
  assignmentDate?: string;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

### `update-employee-asset.dto.ts`

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { AssetStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateEmployeeAssetDto {
  @ApiPropertyOptional({ enum: AssetStatus, description: 'Nuevo estado del activo' })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Valor actualizado en COP' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional({ description: 'Observaciones (ej. motivo de retorno o baja)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

### `employee-asset.response.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus } from '@prisma/client';

export class EmployeeAssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  assetName: string;

  @ApiProperty({ enum: AssetType })
  type: AssetType;

  @ApiProperty()
  assignmentDate: Date;

  @ApiProperty({ description: 'Valor en COP' })
  value: number;

  @ApiProperty({ enum: AssetStatus })
  status: AssetStatus;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

### GraphQL InputTypes (para Task 07 — referencia aquí)

```typescript
// create-employee-asset.input.ts
import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsPositive, IsOptional, IsEnum } from 'class-validator';
import { AssetType } from '@prisma/client';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(AssetType, { name: 'AssetType' });

@InputType()
export class CreateEmployeeAssetInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @Field(() => AssetType)
  @IsEnum(AssetType)
  type: AssetType;

  @Field(() => Float)
  @IsPositive()
  value: number;

  @Field({ nullable: true })
  @IsOptional()
  assignmentDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;
}

// update-employee-asset.input.ts
import { InputType, Field, Float } from '@nestjs/graphql';
import { IsEnum, IsPositive, IsOptional, IsString } from 'class-validator';
import { AssetStatus } from '@prisma/client';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(AssetStatus, { name: 'AssetStatus' });

@InputType()
export class UpdateEmployeeAssetInput {
  @Field(() => AssetStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsPositive()
  value?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Nota:** Si `AssetStatus` ya fue registrado en el schema GraphQL en otro módulo, omitir el `registerEnumType` aquí y referenciarlo desde donde esté declarado.

---

## Acceptance criteria

- [ ] `CreateEmployeeAssetDto` con validaciones `class-validator` y decoradores Swagger.
- [ ] `UpdateEmployeeAssetDto` con todos los campos opcionales.
- [ ] `EmployeeAssetResponseDto` mapea todos los campos del modelo.
- [ ] `CreateEmployeeAssetInput` y `UpdateEmployeeAssetInput` GraphQL.
- [ ] `pnpm typecheck` exit 0.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
