# OS-558 Task 04 — Service: `EmployeeAssetsService`

## Goal

Implementar `EmployeeAssetsService` con lógica de negocio: validación de duplicados activos, verificación de existencia, y método para integración con motor de nómina. Tests unitarios ≥ 80% cobertura.

**Depends on:** Task 02 (interfaces), Task 03 (repository).

---

## Scope

- `apps/api/src/payroll/service/employee-assets.service.ts`
- `apps/api/src/payroll/test/employee-assets.service.spec.ts`

---

## Out of scope

- Controller, resolver, DTOs.
- Lógica de cálculo de nómina (Task 08).

---

## Files allowed

- `apps/api/src/payroll/service/employee-assets.service.ts`
- `apps/api/src/payroll/test/employee-assets.service.spec.ts`

---

## Referencia: patrón existente

Ver `apps/api/src/payroll/service/employee-positions.service.ts`.

---

## Implementation

### `employee-assets.service.ts`

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { AssetStatus, EmployeeAsset } from '@prisma/client';
import { EmployeeAssetsRepository } from '../repository/employee-assets.repository';
import type {
  CreateEmployeeAssetPayload,
  IEmployeeAssetsService,
  UpdateEmployeeAssetPayload,
} from '../interfaces/employee-assets.interfaces';

@Injectable()
export class EmployeeAssetsService implements IEmployeeAssetsService {
  constructor(private readonly repo: EmployeeAssetsRepository) {}

  async create(payload: CreateEmployeeAssetPayload): Promise<EmployeeAsset> {
    const existing = await this.repo.findActiveByEmployeeAndName(
      payload.employeeId,
      payload.assetName,
      payload.tenantId,
    );
    if (existing) {
      throw new ConflictException(
        `El empleado ya tiene un activo "${payload.assetName}" en estado ACTIVO`,
      );
    }
    return this.repo.create(payload);
  }

  findByEmployee(
    employeeId: string,
    tenantId: string,
    statusFilter?: AssetStatus,
  ): Promise<EmployeeAsset[]> {
    return this.repo.findByEmployee(employeeId, tenantId, statusFilter);
  }

  async findById(id: string, tenantId: string): Promise<EmployeeAsset> {
    const asset = await this.repo.findById(id, tenantId);
    if (!asset) {
      throw new NotFoundException(`Activo ${id} no encontrado`);
    }
    return asset;
  }

  async update(
    id: string,
    tenantId: string,
    payload: UpdateEmployeeAssetPayload,
  ): Promise<EmployeeAsset> {
    await this.findById(id, tenantId); // lanza NotFoundException si no existe
    return this.repo.update(id, tenantId, payload);
  }

  getActiveAssetsForPayroll(employeeId: string, tenantId: string): Promise<EmployeeAsset[]> {
    return this.repo.findByEmployee(employeeId, tenantId, 'ACTIVO');
  }
}
```

### `employee-assets.service.spec.ts`

Patrón AAA. Mockear `EmployeeAssetsRepository` con `jest.fn()`.

Casos mínimos:

**`create`:**

- Happy path: `findActiveByEmployeeAndName` retorna `null` → llama `repo.create`.
- Duplicado activo: `findActiveByEmployeeAndName` retorna activo existente → lanza `ConflictException`.

**`findById`:**

- Happy path: retorna activo.
- No existe: lanza `NotFoundException`.

**`update`:**

- Happy path: `findById` existe → llama `repo.update`.
- No existe: lanza `NotFoundException` (desde `findById`).

**`getActiveAssetsForPayroll`:**

- Llama `repo.findByEmployee` con `status: 'ACTIVO'`.

---

## Acceptance criteria

- [ ] `EmployeeAssetsService` implementa `IEmployeeAssetsService`.
- [ ] `create` lanza `ConflictException` si hay activo ACTIVO con mismo nombre.
- [ ] `findById` lanza `NotFoundException` si no existe.
- [ ] `update` lanza `NotFoundException` si el activo no existe.
- [ ] `getActiveAssetsForPayroll` filtra solo `ACTIVO`.
- [ ] Tests cubren todos los casos de negocio.
- [ ] `pnpm --filter=@restopsiq/api test -- --coverage` ≥ 80% en service.
- [ ] `pnpm typecheck` exit 0.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-assets.service --coverage
pnpm --filter=@restopsiq/api typecheck
```
