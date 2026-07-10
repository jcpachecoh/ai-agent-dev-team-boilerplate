# NOM-14 Task 02 — Interfaces TypeScript

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 01](./task-01-schema-migration.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Definir contratos TypeScript para repository y service del módulo `payroll-novedades`, alineados con la estructura NestJS estándar del repo.

---

## Scope

### Archivos

- `apps/api/src/payroll-novedades/interfaces/payroll-novedades.interfaces.ts`
- `apps/api/src/payroll-novedades/interfaces/novedad-type-config.interfaces.ts`

### Tipos de dominio

```typescript
interface PayrollNovedadRecord {
  /* campos del modelo + relaciones mínimas */
}
interface NovedadTypeConfigRecord {
  /* ... */
}

interface SubmitNovedadInput {
  employeeId: string;
  type: NovedadType;
  startDate: Date;
  endDate: Date;
  isPaid?: boolean;
  notes?: string;
  supportStorageObjectId?: string;
  requestedBy: RequestSource;
  overlapWarningAck?: boolean;
  autoApprove?: boolean; // solo RRHH
}

interface RejectNovedadInput {
  novedadId: string;
  rejectionReason: string;
  comment?: string;
}

interface NovedadListFilters {
  status?: NovedadStatus[];
  employeeId?: string;
  locationId?: string;
  type?: NovedadType;
  startDateFrom?: Date;
  startDateTo?: Date;
  supervisorInbox?: boolean; // bandeja supervisor
  rrhhInbox?: boolean; // bandeja RRHH
}

interface OverlapCheckResult {
  hasOverlap: boolean;
  conflictingNovedadIds: string[];
}

interface SubmitNovedadResult {
  novedad: PayrollNovedadRecord;
  warnings?: string[]; // ej. NO_SUPERVISOR_ASSIGNED
}
```

### Interfaces repository

- `IPayrollNovedadesRepository` — CRUD, listados filtrados, overlap query, aprobadas por período.
- `INovedadTypeConfigRepository` — findByTenant, upsert, listAll.

### Interfaces service

- `IPayrollNovedadesService` — submit, approve/reject supervisor, approve/reject RRHH, list, findOne.
- `INovedadTypeConfigService` — getConfigForTenant, updateTypeConfig.

---

## Out of scope

- Implementación repository/service.
- DTOs Swagger (task 09).

---

## Files allowed

- `apps/api/src/payroll-novedades/interfaces/**` — create
- `apps/api/src/payroll-novedades/payroll-novedades.module.ts` — create (solo shell vacío con exports)

---

## Files forbidden

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Interfaces sin `any`.
- [ ] Tokens de inyección (`PAYROLL_NOVEDADES_REPOSITORY`, etc.) definidos.
- [ ] Tipos alineados con enums Prisma generados.

---

## Validation commands

```bash
pnpm --filter=api typecheck
node scripts/validate-structure.js
```
