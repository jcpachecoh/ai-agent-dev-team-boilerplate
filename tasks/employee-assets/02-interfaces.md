# OS-558 Task 02 — Interfaces: contratos repository + service

## Goal

Definir las interfaces TypeScript que describen el contrato del `EmployeeAssetsRepository` y `EmployeeAssetsService`. Estas interfaces son el contrato que guía la implementación en Tasks 03 y 04.

**Depends on:** Task 01 (tipos Prisma generados — `EmployeeAsset`, `AssetStatus`).

---

## Scope

- Crear `apps/api/src/payroll/interfaces/employee-assets.interfaces.ts`.

---

## Out of scope

- Implementaciones de repository o service.
- DTOs REST / GraphQL InputTypes.

---

## Files allowed

- `apps/api/src/payroll/interfaces/employee-assets.interfaces.ts`

---

## Implementation

```typescript
import type { EmployeeAsset, AssetStatus, AssetType } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

// ─── Payloads de entrada ────────────────────────────────────────────────────

export interface CreateEmployeeAssetPayload {
  tenantId: string;
  employeeId: string;
  assetName: string;
  type: AssetType;
  value: Decimal | number;
  assignmentDate?: Date;
  notes?: string;
}

export interface UpdateEmployeeAssetPayload {
  status?: AssetStatus;
  value?: Decimal | number;
  notes?: string;
}

// ─── Contrato Repository ────────────────────────────────────────────────────

export interface IEmployeeAssetsRepository {
  create(payload: CreateEmployeeAssetPayload): Promise<EmployeeAsset>;

  findById(id: string, tenantId: string): Promise<EmployeeAsset | null>;

  findByEmployee(
    employeeId: string,
    tenantId: string,
    statusFilter?: AssetStatus,
  ): Promise<EmployeeAsset[]>;

  findActiveByEmployeeAndName(
    employeeId: string,
    assetName: string,
    tenantId: string,
  ): Promise<EmployeeAsset | null>;

  update(id: string, tenantId: string, payload: UpdateEmployeeAssetPayload): Promise<EmployeeAsset>;
}

// ─── Contrato Service ───────────────────────────────────────────────────────

export interface IEmployeeAssetsService {
  create(payload: CreateEmployeeAssetPayload): Promise<EmployeeAsset>;

  findByEmployee(
    employeeId: string,
    tenantId: string,
    statusFilter?: AssetStatus,
  ): Promise<EmployeeAsset[]>;

  findById(id: string, tenantId: string): Promise<EmployeeAsset>;

  update(id: string, tenantId: string, payload: UpdateEmployeeAssetPayload): Promise<EmployeeAsset>;

  /** Motor de nómina: retorna activos ACTIVOS para calcular deducciones/beneficios */
  getActiveAssetsForPayroll(employeeId: string, tenantId: string): Promise<EmployeeAsset[]>;
}
```

---

## Acceptance criteria

- [ ] Archivo `employee-assets.interfaces.ts` creado.
- [ ] `IEmployeeAssetsRepository` define los 5 métodos.
- [ ] `IEmployeeAssetsService` define los 5 métodos incluyendo `getActiveAssetsForPayroll`.
- [ ] `CreateEmployeeAssetPayload` y `UpdateEmployeeAssetPayload` exportados.
- [ ] `pnpm typecheck` exit 0 tras crear el archivo.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
