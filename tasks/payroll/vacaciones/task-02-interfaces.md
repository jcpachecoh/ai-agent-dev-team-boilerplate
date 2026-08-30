# OS-589 Task 02 — Interfaces TypeScript

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 01](./task-01-schema-migration.md) (`prisma generate`)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Definir contratos TypeScript del dominio de vacaciones (`IVacationsRepository`, `IVacationsService`, records e inputs) antes de implementar repository y service.

---

## Scope

Crear `apps/api/src/vacations/interfaces/vacations.interfaces.ts` con:

### Records (dominio)

- `VacationBalanceRecord` — saldo por empleado.
- `VacationRequestRecord` — solicitud con estados, niveles de aprobación y `letterStorageObjectId`.
- `VacationRequestSummary` — versión lista para UI (incluye nombre empleado, sede si aplica).

### Inputs

- `RequestVacationInput` — `employeeId`, `startDate`, `endDate`, `type` (`DISFRUTE` | `COMPENSACION`). **Sin** `tenantId` en input de dominio (lo inyecta el service).
- `ApproveVacationInput` — `requestId`.
- `RejectVacationInput` — `requestId`, `rejectionReason` (obligatorio).
- `ListVacationRequestsOptions` — filtros: `employeeId?`, `locationId?`, `status?`, `dateFrom?`, `dateTo?`, cursor/take para paginación.

### Queries de asistencia (contrato compartido)

- `ApprovedVacationRange` — `{ employeeId, startDate, endDate, type }` para consumo por módulo de asistencia (PC-1 / D6).

### Repository interface

```typescript
export interface IVacationsRepository {
  findBalanceByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<VacationBalanceRecord | null>;
  upsertBalance(
    tenantId: string,
    employeeId: string,
    data: Partial<VacationBalanceRecord>,
  ): Promise<VacationBalanceRecord>;
  createRequest(tenantId: string, data: CreateVacationRequestData): Promise<VacationRequestRecord>;
  findRequestById(tenantId: string, id: string): Promise<VacationRequestRecord | null>;
  updateRequest(
    tenantId: string,
    id: string,
    data: UpdateVacationRequestData,
  ): Promise<VacationRequestRecord>;
  listRequests(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Promise<VacationRequestRecord[]>;
  findApprovedDisfruteRanges(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ApprovedVacationRange[]>;
  findApprovedDisfruteByDate(
    tenantId: string,
    employeeId: string,
    date: Date,
  ): Promise<ApprovedVacationRange | null>;
}
```

### Service interface

```typescript
export interface IVacationsService {
  getBalance(tenantId: string, employeeId: string): Promise<VacationBalanceRecord>;
  requestVacation(
    tenantId: string,
    actorUserId: string,
    input: RequestVacationInput,
  ): Promise<VacationRequestRecord>;
  approveLevel1(
    tenantId: string,
    actorUserId: string,
    requestId: string,
  ): Promise<VacationRequestRecord>;
  approveLevel2(
    tenantId: string,
    actorUserId: string,
    requestId: string,
  ): Promise<VacationRequestRecord>;
  reject(
    tenantId: string,
    actorUserId: string,
    input: RejectVacationInput,
  ): Promise<VacationRequestRecord>;
  listRequests(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Promise<VacationRequestSummary[]>;
  getApprovedDisfruteRanges(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ApprovedVacationRange[]>;
}
```

### Constantes de dominio

- `MONTHLY_ACCRUAL_DAYS = 1.25`
- `MAX_COMPENSATION_RATIO = 0.5` (50% del derecho)

### Utilidad de acumulación (contrato compartido con task 04)

```typescript
/** Días a acreditar en un mes calendario, prorrateados por hireDate (ver D3 epic). */
export function calculateMonthlyAccrual(hireDate: Date, accrualMonth: Date): number;
```

### Accrual service (contrato para task 04 / 05)

```typescript
export interface IVacationAccrualService {
  accrueForTenant(tenantId: string): Promise<void>;
  syncEmployeeBalance(
    tenantId: string,
    employeeId: string,
    hireDate: Date,
  ): Promise<VacationBalanceRecord>;
}
```

---

## Out of scope

- Implementación repository/service.
- DTOs HTTP/GraphQL (task 08).
- Generación PDF (task 06).
- Tests (task 11, salvo typecheck).

---

## Files allowed

- `apps/api/src/vacations/interfaces/vacations.interfaces.ts` — create

---

## Files forbidden

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] `IVacationsRepository` e `IVacationsService` exportados con firmas alineadas al epic (doble aprobación PC-2).
- [ ] Tipos sin `any`; enums importados de `@prisma/client` donde aplique.
- [ ] `pnpm --filter=api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=api typecheck
```
