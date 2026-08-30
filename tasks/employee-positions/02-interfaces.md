# EMP-POS-01 Task 02 — Interfaces

## Goal

Definir contratos TypeScript para catálogo de cargos e historial antes de implementar repository/service.

**Depends on:** Task 01 (`prisma generate`).

---

## Scope

- Crear `apps/api/src/payroll/interfaces/employee-positions.interfaces.ts`.

---

## Out of scope

- Implementación repository/service.
- Cambios a `payroll.interfaces.ts` (Task 08).

---

## Files allowed

- `apps/api/src/payroll/interfaces/employee-positions.interfaces.ts` — create

---

## Files forbidden

- `schema.prisma`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
export interface EmployeePositionRecord {
  id: string;
  tenantId: string;
  title: string;
  area: string;
  baseSalaryRange: string; // Decimal serializado en service layer
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeePositionHistoryRecord {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  positionId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  changedBy: string | null;
  createdAt: Date;
}

export interface CreateEmployeePositionData {
  title: string;
  area: string;
  baseSalaryRange: string;
}

export interface UpdateEmployeePositionData {
  title?: string;
  area?: string;
  baseSalaryRange?: string;
  isActive?: boolean;
}

export interface ListEmployeePositionsOptions {
  includeInactive?: boolean;
  area?: string;
  search?: string;
}

export interface IEmployeePositionsRepository {
  findAll(
    tenantId: string,
    options?: ListEmployeePositionsOptions,
  ): Promise<EmployeePositionRecord[]>;
  findById(tenantId: string, id: string): Promise<EmployeePositionRecord | null>;
  findByTitle(tenantId: string, title: string): Promise<EmployeePositionRecord | null>;
  countActiveEmployeesByPosition(tenantId: string, positionId: string): Promise<number>;
  create(tenantId: string, data: CreateEmployeePositionData): Promise<EmployeePositionRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateEmployeePositionData,
  ): Promise<EmployeePositionRecord>;
  deactivate(tenantId: string, id: string): Promise<EmployeePositionRecord>;
  findHistoryByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryRecord[]>;
  closeOpenHistory(tenantId: string, employeeDetailsId: string, effectiveTo: Date): Promise<void>;
  createHistoryEntry(data: {
    tenantId: string;
    employeeDetailsId: string;
    positionId: string;
    effectiveFrom: Date;
    changedBy?: string;
  }): Promise<EmployeePositionHistoryRecord>;
}

export interface IEmployeePositionsService {
  findAll(
    tenantId: string,
    options?: ListEmployeePositionsOptions,
  ): Promise<EmployeePositionRecord[]>;
  findById(tenantId: string, id: string): Promise<EmployeePositionRecord>;
  create(tenantId: string, data: CreateEmployeePositionData): Promise<EmployeePositionRecord>;
  update(
    tenantId: string,
    id: string,
    data: UpdateEmployeePositionData,
  ): Promise<EmployeePositionRecord>;
  deactivate(tenantId: string, id: string): Promise<EmployeePositionRecord>;
  getEmployeePositionHistory(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryRecord[]>;
  assignPositionToEmployee(
    tenantId: string,
    employeeDetailsId: string,
    positionId: string,
    changedBy: string,
  ): Promise<void>;
}
```

---

## Acceptance criteria

- [ ] `IEmployeePositionsRepository` exportado con métodos de catálogo + historial.
- [ ] `IEmployeePositionsService` exportado.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
