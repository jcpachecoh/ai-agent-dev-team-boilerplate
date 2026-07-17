# CONN-04b Task 01 — Schema Prisma y migración

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `completed`  
**Depends on:** —  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)  
**Implemented:** `20260716235900_os606_admin_overtime_request`

---

## Goal

Extender el schema para solicitudes administrativas: campos de ventana propuesta, FK de motivo (`OVERTIME_REASON`), solicitante, `batchId`, nullability de campos de detección, y unique parciales compatibles con `DETECCION_AUTOMATICA`.

---

## Scope

### Enum

Agregar a `EmployeeCatalogType`:

```prisma
OVERTIME_REASON
```

### `OvertimeRequest` — campos nuevos

| Campo               | Tipo                   | Notas                        |
| ------------------- | ---------------------- | ---------------------------- |
| `workDate`          | `DateTime?` `@db.Date` | Día laboral (Bogotá)         |
| `proposedStartTime` | `DateTime?`            | Inicio ventana               |
| `proposedEndTime`   | `DateTime?`            | Fin ventana                  |
| `proposedMinutes`   | `Int?`                 | Calculado en app             |
| `reasonOptionId`    | `String?`              | FK → `EmployeeCatalogOption` |
| `requestedByUserId` | `String?`              | FK → `User`                  |
| `batchId`           | `String?`              | Trazabilidad multi-empleado  |

### Nullability detección

- `shiftEndTime` → `DateTime?`
- `actualEndTime` → `DateTime?`
- `accumulatedMinutes` → `Int?`

Filas existentes de detección conservan valores no nulos.

### Uniques (SQL parcial) — definitivos

1. Drop `@@unique([tenantId, employeeId, locationId, payrollPeriod, type])`.
2. **Detección** `overtime_requests_auto_period_active_key`:  
   `(tenantId, employeeId, locationId, payrollPeriod)`  
   `WHERE type = 'DETECCION_AUTOMATICA' AND deletedAt IS NULL`
3. **Admin** `overtime_requests_admin_window_active_key`:  
   `(tenantId, employeeId, locationId, workDate, proposedStartTime, proposedEndTime, type)`  
   `WHERE type = 'SOLICITUD_ADMINISTRATIVA' AND deletedAt IS NULL AND status <> 'OBJETADA'`

Política `OBJETADA`: no bloquea re-solicitud de la misma ventana (sin soft-delete obligatorio).  
`reasonOptionId` fuera de la identidad. Varias ventanas el mismo día OK.  
Solapes parciales entre ventanas distintas → **task-03**.

### Índices

- `tenantId + batchId`
- `tenantId + type + status`
- `tenantId + workDate`
- FKs `reasonOptionId`, `requestedByUserId`

### Migración

- Nombre final: `os606_admin_overtime_request` / timestamp `20260716235900`.
- SQL solo de esta task.
- Validada con `prisma migrate deploy` en Postgres temporal aislado (puerto 55432).

### Compatibilidad TypeScript CONN-04a

Interfaces/mappers tipan los tres campos de detección como `Date | null` / `number | null` sin coerción a 0.  
Consumidores payroll (`pending-salary`, `variable-average`) omiten filas con nulls explícitamente.

---

## Out of scope

- Repository create admin / service create / controller POST.
- Seeds.
- Cambiar lógica de detección.

---

## Files allowed

- `apps/api/prisma/schema.prisma` — modify
- `apps/api/prisma/migrations/**` — create (SQL de esta task)
- `apps/api/src/overtime/interfaces/**` — nullability
- `apps/api/src/overtime/repository/overtime.repository.ts` — mapper nullability
- `apps/api/src/overtime/controller/dto/overtime.dto.ts` — response nullability
- `apps/api/src/payroll/service/pending-salary.service.ts` — skip null minutes
- `apps/api/src/payroll/service/variable-average.service.ts` — skip null detection fields

---

## Files forbidden

- Create service / POST endpoint / seeds / frontend
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] Schema refleja D3/D4/D10 del epic.
- [x] `DETECCION_AUTOMATICA` unique por período (índice parcial).
- [x] Admin permite múltiples ventanas el mismo mes/día.
- [x] `OBJETADA` no bloquea re-solicitud misma ventana (DB).
- [x] `prisma format` + `validate` + `generate` OK.
- [x] Migración aplicada en DB temporal limpia.
- [x] `pnpm typecheck` verde.
- [x] Tests overtime + pending-salary + variable-average OK.

---

## Validation commands

```bash
cd apps/api && pnpm exec prisma format && pnpm exec prisma validate && pnpm exec prisma generate
cd apps/api && pnpm typecheck
cd apps/api && pnpm exec jest src/overtime/test src/payroll/test/pending-salary.service.spec.ts src/payroll/test/variable-average.service.spec.ts --runInBand
node scripts/validate-structure.js
```
