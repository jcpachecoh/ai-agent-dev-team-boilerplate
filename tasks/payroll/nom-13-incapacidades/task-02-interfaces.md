# NOM-13 Task 02 — Interfaces TypeScript

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 01](./task-01-schema-migration.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Definir contratos TypeScript (`IMedicalLeavesRepository`, `IMedicalLeavesService`, records e inputs) antes de repository y service.

---

## Scope

Crear `apps/api/src/medical-leaves/interfaces/medical-leaves.interfaces.ts` con:

### Records

- `MedicalLeaveRecord` — entidad completa con montos `Decimal`.
- `MedicalLeaveSummary` — para listados (nombre empleado, sede).

### Inputs

- `CreateMedicalLeaveInput` — `employeeId`, `origin`, `startDate`, `endDate` (sin montos: los calcula el service).
- `UpdateMedicalLeaveStatusInput` — `status`, `rejectionReason?`.
- `ListMedicalLeavesOptions` — `employeeId?`, `locationId?`, `status?`, `origin?`, `month?` / `dateFrom?`/`dateTo?`, cursor/take.

### Payment split (dominio puro)

```typescript
export interface PaymentSplitResult {
  totalDays: number;
  employerPaidDays: number;
  epsArlPaidDays: number;
  employerAmount: Decimal;
  epsArlAmount: Decimal;
  warnings?: string[];
}

export function calculatePaymentSplit(
  origin: LeaveOrigin,
  startDate: Date,
  endDate: Date,
  dailySalary: Decimal,
): PaymentSplitResult;
```

> La implementación de `calculatePaymentSplit` vive en task 04; aquí solo el contrato/export.

### Repository interface

- `findById`, `create`, `update`, `softDelete`
- `listSummaries(tenantId, options)`
- `sumActiveDaysInCalendarYear(tenantId, employeeId, year)`
- `findOverlappingForPayrollPeriod(tenantId, employeeId, periodStart, periodEnd)`

### Service interface

- `register(tenantId, actorUserId, input)` — calcula split y persiste
- `updateStatus(tenantId, actorUserId, id, input)`
- `list(tenantId, options)`
- `getAnnualAccumulatedDays(tenantId, employeeId, year)` — para alerta 180
- `getSupportDocumentUrl(tenantId, id)` — presigned

---

## Out of scope

- Implementación de repository/service.
- Controller/DTOs HTTP.

---

## Files allowed

- `apps/api/src/medical-leaves/interfaces/**` — create
- `apps/api/src/medical-leaves/medical-leaves.module.ts` — scaffold vacío (solo exports de interfaces si aplica)

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Interfaces sin `any`.
- [ ] Inputs sin `tenantId` en body de dominio (lo inyecta el service).
- [ ] `PaymentSplitResult` documentado con reglas COMUN/LABORAL del epic.

---

## Validation commands

```bash
pnpm --filter api typecheck
node scripts/validate-structure.js
```
