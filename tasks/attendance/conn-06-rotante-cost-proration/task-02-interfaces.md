# CONN-06 Task 02 — Interfaces repository/service

**Domain:** `[BACKEND]`  
**Status:** `completed`  
**Depends on:** [Task 01](./task-01-schema-migration.md)  
**Epic:** [CONN-06](./00-epic-and-decisions.md)

---

## Goal

Definir contratos TypeScript para repositorio y servicios de asignación diaria de sede y prorrateo, sin implementación Prisma aún.

---

## Scope

### Módulo propuesto

`apps/api/src/daily-cost-center/`

Estructura estándar NestJS:

```
daily-cost-center/
├── interfaces/
│   ├── daily-cost-center-assignment.interfaces.ts
│   └── rotante-proration.interfaces.ts
├── repository/
├── service/
├── controller/
├── controller/dto/
├── test/
└── daily-cost-center.module.ts
```

### `IDailyCostCenterAssignmentRepository`

Operaciones mínimas:

| Método                                                       | Descripción                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `upsertForDay(input)`                                        | Crear o actualizar asignación respetando prioridad de `source` |
| `findByEmployeeAndDateRange(tenantId, employeeId, from, to)` | Lista ordenada por `date`                                      |
| `findByTenantAndDateRange(tenantId, from, to, filters?)`     | Para bandeja manual / calendario                               |
| `findPendingDays(tenantId, employeeId, from, to)`            | Días laborables sin asignación (contrato explícito)            |
| `deleteManual(tenantId, id)`                                 | Solo si `source = MANUAL` o según reglas del epic              |

Tipos:

```typescript
interface UpsertDailyAssignmentInput {
  tenantId: string;
  employeeId: string;
  date: Date;
  locationId: string;
  shiftId?: string | null;
  source: AssignmentSource;
}

interface DailyAssignmentRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  date: Date;
  locationId: string;
  shiftId: string | null;
  source: AssignmentSource;
}
```

### `IDailyCostCenterAssignmentService`

| Método                         | Descripción                |
| ------------------------------ | -------------------------- |
| `resolveFromShift(...)`        | Llamado desde hook CONN-03 |
| `resolveFromAttendance(...)`   | Llamado desde hook CONN-01 |
| `assignManual(...)`            | Corrección manual con RBAC |
| `listForEmployeeCalendar(...)` | Vista calendario perfil    |
| `listPendingForTenant(...)`    | Pantalla corrección masiva |

### `IRotanteProrationService` (consumo NOM-24)

```typescript
interface RotanteProrationInput {
  tenantId: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  totalLaborCost: number; // Decimal como number en interfaz; service usa Decimal internamente
}

interface RotanteProrationResult {
  employeeId: string;
  totalDaysAssigned: number;
  pendingDaysCount: number;
  allocations: Array<{
    locationId: string;
    days: number;
    proportion: number;
    proratedCost: number;
  }>;
}
```

### Reglas documentadas en interfaces (comentarios)

- Solo empleados con `costCenter = ROTANTE` participan.
- Prioridad fuente: `TURNO_ASIGNADO` > `MARCACION_ASISTENCIA` > `MANUAL` (manual no se sobrescribe — D2).

---

## Out of scope

- Implementación Prisma (task 03).
- Hooks en attendance/turnos (task 04).
- Controller REST (task 06).

---

## Files allowed

- `apps/api/src/daily-cost-center/interfaces/**`
- `apps/api/src/daily-cost-center/daily-cost-center.module.ts` (shell vacío exportando providers pendientes)

---

## Files forbidden

- `schema.prisma`, migraciones
- `apps/web-app/**`
- Implementación repository/service con lógica

---

## Acceptance criteria

- [x] Interfaces exportadas y tipadas sin `any`.
- [x] Prioridad de fuentes documentada en comentarios JSDoc.
- [x] Módulo NestJS registrable (providers como tokens pendientes o stubs).

---

## Validation commands

```bash
pnpm --filter=api typecheck
node scripts/validate-structure.js
```
