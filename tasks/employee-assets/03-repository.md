# OS-558 Task 03 — Repository: `EmployeeAssetsRepository`

## Goal

Implementar `EmployeeAssetsRepository` que encapsula todo acceso Prisma a `employee_assets`. Escribir tests unitarios con mocks de Prisma.

**Depends on:** Task 01 (schema + generate), Task 02 (interfaces).

---

## Scope

- `apps/api/src/payroll/repository/employee-assets.repository.ts`
- `apps/api/src/payroll/test/employee-assets.repository.spec.ts`

---

## Out of scope

- Service, controller, resolver.
- Lógica de negocio (ej. validación de duplicados) — eso va en el service.

---

## Files allowed

- `apps/api/src/payroll/repository/employee-assets.repository.ts`
- `apps/api/src/payroll/test/employee-assets.repository.spec.ts`

---

## Referencia: patrón existente

Ver `apps/api/src/payroll/repository/employee-positions.repository.ts` para seguir el mismo patrón con `PrismaService`.

---

## Implementation

### `employee-assets.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AssetStatus, EmployeeAsset } from '@prisma/client';
import type {
  CreateEmployeeAssetPayload,
  IEmployeeAssetsRepository,
  UpdateEmployeeAssetPayload,
} from '../interfaces/employee-assets.interfaces';

@Injectable()
export class EmployeeAssetsRepository implements IEmployeeAssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreateEmployeeAssetPayload): Promise<EmployeeAsset> {
    return this.prisma.employeeAsset.create({
      data: {
        tenantId: payload.tenantId,
        employeeId: payload.employeeId,
        assetName: payload.assetName,
        value: payload.value,
        assignmentDate: payload.assignmentDate ?? new Date(),
        notes: payload.notes,
      },
    });
  }

  findById(id: string, tenantId: string): Promise<EmployeeAsset | null> {
    return this.prisma.employeeAsset.findFirst({
      where: { id, tenantId },
    });
  }

  findByEmployee(
    employeeId: string,
    tenantId: string,
    statusFilter?: AssetStatus,
  ): Promise<EmployeeAsset[]> {
    return this.prisma.employeeAsset.findMany({
      where: {
        employeeId,
        tenantId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { assignmentDate: 'desc' },
    });
  }

  findActiveByEmployeeAndName(
    employeeId: string,
    assetName: string,
    tenantId: string,
  ): Promise<EmployeeAsset | null> {
    return this.prisma.employeeAsset.findFirst({
      where: {
        employeeId,
        assetName,
        tenantId,
        status: 'ACTIVO',
      },
    });
  }

  update(
    id: string,
    tenantId: string,
    payload: UpdateEmployeeAssetPayload,
  ): Promise<EmployeeAsset> {
    return this.prisma.employeeAsset.update({
      where: { id, tenantId },
      data: payload,
    });
  }
}
```

### `employee-assets.repository.spec.ts`

Seguir patrón AAA. Mockear `PrismaService.employeeAsset.*` con `jest.fn()`.

Casos mínimos:

- `create` → llama `prisma.employeeAsset.create` con `tenantId` correcto.
- `findByEmployee` → pasa `employeeId` + `tenantId` en `where`.
- `findByEmployee` con `statusFilter` → incluye `status` en `where`.
- `findActiveByEmployeeAndName` → `status: 'ACTIVO'` siempre presente.
- `update` → llama con `{ id, tenantId }` en `where`.

---

## Acceptance criteria

- [ ] `EmployeeAssetsRepository` implementa `IEmployeeAssetsRepository`.
- [ ] Todos los métodos filtran por `tenantId`.
- [ ] `findActiveByEmployeeAndName` siempre incluye `status: 'ACTIVO'`.
- [ ] Tests unitarios cubren los 5 métodos.
- [ ] `pnpm --filter=@restopsiq/api test` pasa.
- [ ] `pnpm typecheck` exit 0.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-assets.repository
pnpm --filter=@restopsiq/api typecheck
```
