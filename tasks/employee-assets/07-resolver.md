# OS-558 Task 07 — Resolver GraphQL: `EmployeeAssetsResolver`

## Goal

Implementar `EmployeeAssetsResolver` para exponer `employeeAssets`, `createEmployeeAsset`, y `updateEmployeeAsset` en el schema GraphQL. Tests unitarios del resolver.

**Depends on:** Task 04 (service), Task 05 (InputTypes GraphQL).

---

## Scope

- `apps/api/src/payroll/resolver/employee-assets.resolver.ts`
- `apps/api/src/payroll/test/employee-assets.resolver.spec.ts`
- Entity GraphQL `EmployeeAsset` (ObjectType) — puede ir en `resolver/` o en `entities/`.

---

## Out of scope

- Controller REST (Task 06).
- Integración nómina (Task 08).

---

## Files allowed

- `apps/api/src/payroll/resolver/employee-assets.resolver.ts`
- `apps/api/src/payroll/resolver/employee-asset.entity.ts` (ObjectType)
- `apps/api/src/payroll/test/employee-assets.resolver.spec.ts`

---

## Referencia: patrón existente

Ver `apps/api/src/payroll/resolver/employee-positions.resolver.ts`.

---

## Implementation

### `employee-asset.entity.ts` (ObjectType)

```typescript
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { AssetStatus, AssetType } from '@prisma/client';

@ObjectType()
export class EmployeeAssetGql {
  @Field(() => ID)
  id: string;

  @Field()
  tenantId: string;

  @Field()
  employeeId: string;

  @Field()
  assetName: string;

  @Field(() => AssetType)
  type: AssetType;

  @Field()
  assignmentDate: Date;

  @Field(() => Float)
  value: number;

  @Field(() => AssetStatus)
  status: AssetStatus;

  @Field({ nullable: true })
  notes?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
```

### `employee-assets.resolver.ts`

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { EmployeeAssetsService } from '../service/employee-assets.service';
import { EmployeeAssetGql } from './employee-asset.entity';
import { CreateEmployeeAssetInput } from './dto/create-employee-asset.input';
import { UpdateEmployeeAssetInput } from './dto/update-employee-asset.input';
import { AssetStatus } from '@prisma/client';

@Resolver(() => EmployeeAssetGql)
export class EmployeeAssetsResolver {
  constructor(private readonly service: EmployeeAssetsService) {}

  @Query(() => [EmployeeAssetGql])
  @UseGuards(JwtAuthGuard)
  async employeeAssets(
    @Args('employeeId') employeeId: string,
    @Args('status', { nullable: true, type: () => AssetStatus }) status: AssetStatus | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployeeAssetGql[]> {
    const assets = await this.service.findByEmployee(employeeId, user.tenantId, status);
    return assets.map((a) => ({ ...a, value: Number(a.value) }));
  }

  @Mutation(() => EmployeeAssetGql)
  @UseGuards(JwtAuthGuard)
  async createEmployeeAsset(
    @Args('input') input: CreateEmployeeAssetInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployeeAssetGql> {
    const asset = await this.service.create({ ...input, tenantId: user.tenantId });
    return { ...asset, value: Number(asset.value) };
  }

  @Mutation(() => EmployeeAssetGql)
  @UseGuards(JwtAuthGuard)
  async updateEmployeeAsset(
    @Args('id') id: string,
    @Args('input') input: UpdateEmployeeAssetInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployeeAssetGql> {
    const asset = await this.service.update(id, user.tenantId, input);
    return { ...asset, value: Number(asset.value) };
  }
}
```

**Nota:** `Decimal` de Prisma se convierte a `Number` antes de retornar al schema GraphQL (GraphQL `Float` no acepta `Decimal` directamente).

### Tests `employee-assets.resolver.spec.ts`

Mockear `EmployeeAssetsService`. Verificar:

- `tenantId` siempre del `@CurrentUser()`.
- `value` se convierte de Decimal a Number en respuesta.

---

## Acceptance criteria

- [ ] `EmployeeAssetGql` ObjectType con todos los campos.
- [ ] 1 Query (`employeeAssets`) y 2 Mutations (`createEmployeeAsset`, `updateEmployeeAsset`).
- [ ] Todos con `@UseGuards(JwtAuthGuard)`.
- [ ] `tenantId` extraído del JWT, nunca de args.
- [ ] `Decimal → Number` en todas las respuestas.
- [ ] Tests unitarios del resolver.
- [ ] `pnpm typecheck` exit 0.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-assets.resolver
pnpm --filter=@restopsiq/api typecheck
```
