# Task 03 — Backend: resumen de monitor por sede y periodo (día/semana/mes/año)

**Domain:** `[BACKEND]` `[ATTENDANCE]`  
**Status:** `pending`  
**Depends on:** [task-02-sede-detail-operators.md](./task-02-sede-detail-operators.md), NOM-03  
**Epic:** NOM-06  
**Blocks:** [task-04-frontend-period-filter.md](./task-04-frontend-period-filter.md)

---

## Goal

Exponer un endpoint REST que resuelva el **rango temporal** (día, semana, mes, año) en `America/Bogota` y devuelva el **resumen agregado de asistencia por sede**: KPIs + operarios clasificados (en turno, ausentes, llegadas tarde, horas extra).

El frontend **no** debe agregar logs ni calcular métricas de periodo; solo envía `period` + `anchorDate` y renderiza la respuesta.

---

## Scope

### Nuevo endpoint

```
GET /api/attendance/locations/:locationId/monitor-summary
```

**Auth:** JWT + `RolesGuard` (`PAYROLL_MODULE_ROLES`), mismo patrón que `GET /attendance`.

**Query params:**

| Param        | Tipo                                 | Requerido | Descripción                  |
| ------------ | ------------------------------------ | --------- | ---------------------------- |
| `period`     | `day` \| `week` \| `month` \| `year` | sí        | Preset temporal              |
| `anchorDate` | ISO date `YYYY-MM-DD`                | sí        | Fecha ancla en zona Colombia |

**Resolución de rango (servidor, `America/Bogota`):**

| `period` | `dateFrom`                                       | `dateTo`              |
| -------- | ------------------------------------------------ | --------------------- |
| `day`    | `anchorDate`                                     | `anchorDate`          |
| `week`   | Lunes de la semana ISO que contiene `anchorDate` | Domingo de esa semana |
| `month`  | Día 1 del mes                                    | Último día del mes    |
| `year`   | 1 ene                                            | 31 dic del año        |

Implementar util pura `resolveAttendancePeriodRange(period, anchorDate, tz)` en `apps/api/src/attendance/utils/period-range.util.ts` con tests unitarios.

### Respuesta (`AttendanceMonitorSummaryDto`)

```typescript
{
  locationId: string;
  period: 'day' | 'week' | 'month' | 'year';
  anchorDate: string;       // YYYY-MM-DD
  dateFrom: string;
  dateTo: string;
  isLive: boolean;          // true solo si period=day y anchorDate=hoy Bogotá
  metrics: {
    total: number;
    onShift: number;
    absent: number;
    lateArrivals: number;
    overtime: number;
    offSchedule: number;
    legalAlerts: number;
  };
  employees: {
    onShift: AttendanceMonitorEmployeeDto[];
    absent: AttendanceMonitorEmployeeDto[];
    late: AttendanceMonitorEmployeeDto[];
    overtime: AttendanceMonitorEmployeeDto[];
  };
}
```

`AttendanceMonitorEmployeeDto` (mínimo):

- `employeeId`, `userId`, `name`, `role` (position), `status`
- `entryLabel?`, `workedMinutes?`, `overtimeMinutes?`, `lateMinutes?`, `daysPresent?` (para rangos > 1 día)
- `lastEntryAt?` (ISO)

### Reglas de clasificación (servicio)

Todas en `AttendanceMonitorSummaryService` (o método dedicado en `AttendanceService`):

| Categoría         | Regla                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **En turno**      | `period=day` + `anchorDate=hoy`: empleados en `listActiveAtLocation`. Otros casos: empleados con al menos un par ENTRY/EXIT o ENTRY abierto en el rango |
| **Ausente**       | Empleados de la sede (`EmployeeDetails.locationId`) sin ningún ENTRY en el rango                                                                        |
| **Llegada tarde** | ENTRY cuyo timestamp local supera inicio de `AttendanceShift` del log + **5 min** tolerancia (`SHIFT_*_START` en `attendance.constants.ts`)             |
| **Horas extra**   | Suma de `overtimeMinutes` del rango > 0 (reutilizar `calculateDaySummary` por `workDate`)                                                               |

- Fuente de empleados de la sede: `EmployeeDetails` con `locationId` + `tenantId` + `deletedAt: null`.
- Tenant safety obligatorio en repository.
- Para rangos semana/mes/año: iterar `workDate` en rango; acumular por `employeeId`.

### Archivos a crear/modificar

```
apps/api/src/attendance/
  utils/
    period-range.util.ts
    period-range.util.spec.ts
  service/
    attendance-monitor-summary.service.ts   ← nuevo
  controller/
    dto/
      monitor-summary-query.dto.ts
      monitor-summary.response.ts
    attendance.controller.ts                  ← nuevo GET
  interfaces/
    attendance.interfaces.ts                  ← tipos + contrato
  test/
    attendance-monitor-summary.service.spec.ts
    attendance.controller.spec.ts             ← caso nuevo endpoint
  attendance.module.ts                        ← registrar servicio
```

### DTOs y validación

- `period`: enum validado con `class-validator`
- `anchorDate`: `@IsISO8601()` solo fecha
- `locationId`: validar que pertenece al `tenantId` del JWT; si no existe → `NotFoundException`

---

## Out of scope

- Cambios en `schema.prisma` o migraciones.
- Calendario de festivos / recargos monetarios (NOM-04).
- Endpoint de hub multi-sede (Task 01 puede seguir con queries separadas o follow-up `GET /attendance/monitor-summary` sin `locationId`).
- GraphQL.

---

## Files allowed

- `apps/api/src/attendance/**`
- `postman/**` (colección attendance — agregar request del nuevo endpoint)

## Files forbidden

- `schema.prisma`, migraciones Prisma
- `package.json`, `pnpm-lock.yaml`
- `apps/api/src/app.module.ts` (wiring vía `attendance.module.ts` únicamente)
- `apps/web-app/**`, `packages/**`

---

## Acceptance criteria

- [ ] `GET .../monitor-summary?period=day&anchorDate=YYYY-MM-DD` devuelve KPIs y 4 listas de empleados.
- [ ] Rangos semana/mes/año se resuelven en servidor con zona `America/Bogota`.
- [ ] `isLive: true` solo cuando `period=day` y `anchorDate` es hoy en Bogotá.
- [ ] Clasificación tarde usa tolerancia 5 min documentada en constante.
- [ ] `tenantId` siempre filtrado; `locationId` de otro tenant → 404.
- [ ] Tests unitarios: `period-range.util` + `attendance-monitor-summary.service` (happy path, ausente, tarde, HE, rango mensual).
- [ ] Test controller mock del nuevo endpoint.
- [ ] Cobertura del nuevo service ≥ 80%.

---

## Validation commands

```bash
pnpm --filter api test -- attendance-monitor-summary
pnpm --filter api test -- period-range.util
pnpm --filter api test -- attendance.controller.spec
node scripts/validate-structure.js
pnpm typecheck
```

Manual (Postman/curl): mismo `locationId`, cambiar `period` y `anchorDate`; verificar que totales cambian sin que el cliente calcule rangos.
