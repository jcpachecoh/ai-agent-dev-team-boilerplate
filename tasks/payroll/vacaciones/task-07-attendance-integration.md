# OS-589 Task 07 — Integración con asistencia (PC-1 + bloqueo marcación)

**Domain:** `[BACKEND]` `[ATTENDANCE]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-request-approval-service.md), [Task 03](./task-03-repository.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Integrar vacaciones aprobadas con el módulo de **asistencia** para cumplir:

- **PC-1:** los días de DISFRUTE aprobado **no se cuentan como ausencia**.
- **D6:** bloquear marcación (kiosko / app móvil) en el rango de vacaciones aprobadas.

---

## Estado actual en codebase (referencia)

| Área                                              | Estado             | Notas                                                  |
| ------------------------------------------------- | ------------------ | ------------------------------------------------------ |
| Monitor (`attendance-monitor-summary.service.ts`) | ✅ Implementado    | Excluye vacaciones del bucket `absent` (PC-1)          |
| Kiosko (`attendance.service.ts`)                  | ✅ Implementado    | `assertNotOnApprovedVacation` en entry/exit (D6)       |
| Guard compartido                                  | ✅                 | `vacation-attendance.guard.ts`                         |
| App móvil                                         | Verificar / cerrar | Si ya rechaza marcación en prod, solo asegurar test    |
| Tarjeta de asistencia                             | ❌ Pendiente       | Días en vacación muestran `unworkedMinutes` como falta |
| Reportes asistencia                               | ❌ Pendiente       | `absentDays` no resta días de vacación                 |
| Listado colaboradores                             | ⏭️ Opcional UX     | No calcula ausencias hoy — ver §2.3                    |

---

## Scope

### 1. Servicio compartido de consulta

Exponer desde vacaciones (o facade inyectable) los métodos ya definidos en interfaces:

```typescript
getApprovedDisfruteRanges(tenantId, employeeId, dateFrom, dateTo): ApprovedVacationRange[]
findApprovedDisfruteByDate(tenantId, employeeId, date): ApprovedVacationRange | null
```

El módulo de asistencia **consume** este servicio (inyección `VacationsService` vía `VacationsModule` importado en `AttendanceModule` — el wiring del módulo se hace en [task 08](./task-08-api-endpoints-dtos.md) al registrar `VacationsModule` en `app.module.ts`; en esta task usar `@Optional()` solo si el módulo aún no está cableado).

Reutilizar `vacation-attendance.guard.ts` (`assertNotOnApprovedVacation`, `hasApprovedVacationInRange`).

### 2. No contar como ausencia (PC-1)

**Regla:** si el empleado tiene DISFRUTE `APROBADA` que cubre la fecha → estado **`VACACIONES`** (derivado en runtime), **excluido** del conteo de ausencias. Documentar en código: `VACACIONES` ≠ `AUSENTE`.

#### 2.1 Obligatorio — Monitor (ya hecho; mantener tests)

| Archivo                                                                 | Acción                                                                             |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/api/src/attendance/service/attendance-monitor-summary.service.ts` | Verificar que sigue excluyendo vacaciones de `metrics.absent` / `employees.absent` |

#### 2.2 Obligatorio — Tarjeta de asistencia

El flujo **Colaboradores → Ver tarjeta** (`GET /attendance/employees/:userId/card`) es donde el usuario ve el detalle día a día.

| Archivo                                                             | Acción                                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/attendance/service/attendance-card.service.ts`        | Consultar rangos de vacación del empleado en el rango `dateFrom`–`dateTo`                                                        |
| `apps/api/src/attendance/utils/attendance-card-day-summary.util.ts` | Si el día está cubierto por DISFRUTE `APROBADA`: marcar día como vacaciones, **no** contar `unworkedMinutes` como ausencia/falta |
| `apps/api/src/attendance/interfaces/attendance.interfaces.ts`       | Extender `AttendanceCardDaySummary` con flag o `resolvedKind` equivalente (`VACACIONES`)                                         |

Comportamiento esperado en días de vacación:

- Sin marcación ENTRY/EXIT → **no** mostrar minutos no trabajados como si fuera ausencia.
- Turno del día puede mostrarse como **"Vacaciones"** (o `shiftName: 'Vacaciones'`).
- La marcación manual en esos días sigue bloqueada por D6 (vía `AttendanceService`).

#### 2.3 Obligatorio — Reportes de asistencia

| Archivo                                             | Acción                                                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/reports/service/reports.service.ts`   | Al calcular `absentDays` / días sin asistencia, **restar** (o no contar) días cubiertos por DISFRUTE `APROBADA` en el periodo |
| `apps/api/src/reports/test/reports.service.spec.ts` | Caso: empleado con N días de vacación aprobada → `absentDays` no incluye esos días                                            |

#### 2.4 Opcional (UX) — Listado de colaboradores

> **Decisión de producto (OS-550):** `/asistencia/colaboradores` **no** calcula ni muestra ausencias. Solo muestra `todayShift` (turno asignado), supervisor y portal. **No es obligatorio** para PC-1.

Si se implementa (nice-to-have, no bloqueante):

| Archivo                                                                     | Acción                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `apps/api/src/attendance/service/attendance-collaborators.service.ts`       | Si el empleado tiene vacación aprobada **hoy**, mostrar `"Vacaciones"` en `turnoLabel` / campo derivado |
| `apps/api/src/attendance/interfaces/attendance-collaborators.interfaces.ts` | Campo opcional `onVacationToday?: boolean`                                                              |

**Fuera de alcance de esta task:** cambios en `apps/web-app/**` para la columna Turno (task 09 o follow-up de asistencia).

### 3. Bloqueo de marcación (D6)

Puntos de entrada de marcación:

| Flujo                      | Archivo                                                               | Prioridad                                 |
| -------------------------- | --------------------------------------------------------------------- | ----------------------------------------- |
| Kiosko REST                | `apps/api/src/attendance/service/attendance.service.ts`               | ✅ Hecho — verificar tests                |
| App móvil                  | `apps/api/src/attendance/mobile/service/mobile-attendance.service.ts` | Obligatorio si aún no usa el guard        |
| Marcación manual (tarjeta) | `attendance-card.service.ts` → delega a `AttendanceService`           | Cubierto si kiosko/manual comparten guard |

Antes de registrar evento:

1. Resolver `employeeId` del usuario.
2. Consultar `findApprovedDisfruteByDate(tenantId, employeeId, workDate)`.
3. Si hay vacación aprobada → `ConflictException` o `ForbiddenException` con mensaje: _"No puede marcar asistencia: tiene vacaciones aprobadas en esta fecha."_

### Tests

| Caso                                                                                 | Obligatorio |
| ------------------------------------------------------------------------------------ | ----------- |
| Empleado en vacaciones → no aparece como `absent` en monitor                         | ✅          |
| Empleado en vacaciones → marcación rechazada (kiosko)                                | ✅          |
| Empleado en vacaciones → marcación rechazada (móvil, si aplica)                      | ✅          |
| Día de vacación en tarjeta → no `unworkedMinutes` como ausencia; estado `VACACIONES` | ✅          |
| Reporte mensual → `absentDays` excluye días de vacación                              | ✅          |
| Empleado sin vacaciones → comportamiento existente sin cambios                       | ✅          |
| Colaboradores muestra "Vacaciones" en turno                                          | Opcional    |

---

## Out of scope

- Cambios al schema de `AttendanceLog` (salvo que sea estrictamente necesario — si lo es, escalar a task separada de schema).
- Frontend de asistencia (web-app).
- Vacaciones `COMPENSACION` (no bloquean marcación — solo DISFRUTE).
- Solicitudes pendientes (`SOLICITADA`, `APROBADA_NIVEL_1`) — no afectan asistencia hasta `APROBADA`.
- Listado colaboradores como requisito bloqueante de PC-1 (solo UX opcional §2.4).

---

## Files allowed

- `apps/api/src/vacations/service/vacations.service.ts` — modify (export query methods)
- `apps/api/src/attendance/service/attendance.service.ts` — modify (verificar guard D6)
- `apps/api/src/attendance/service/attendance-monitor-summary.service.ts` — modify (solo si ajustes)
- `apps/api/src/attendance/service/attendance-card.service.ts` — modify
- `apps/api/src/attendance/utils/attendance-card-day-summary.util.ts` — modify
- `apps/api/src/attendance/interfaces/attendance.interfaces.ts` — modify
- `apps/api/src/attendance/service/vacation-attendance.guard.ts` — modify
- `apps/api/src/attendance/mobile/service/mobile-attendance.service.ts` — modify (si falta D6)
- `apps/api/src/attendance/service/attendance-collaborators.service.ts` — modify (**solo** si se implementa §2.4 opcional)
- `apps/api/src/attendance/interfaces/attendance-collaborators.interfaces.ts` — modify (opcional §2.4)
- `apps/api/src/reports/service/reports.service.ts` — modify
- `apps/api/src/reports/test/reports.service.spec.ts` — modify
- `apps/api/src/attendance/test/**` — modify/create tests relacionados
- `apps/api/src/attendance/mobile/service/mobile-attendance.service.spec.ts` — modify

---

## Files forbidden

- `prisma/schema.prisma` (salvo bloqueo explícito del usuario)
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts` (wiring `VacationsModule` → task 08)
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] **PC-1 monitor:** días con DISFRUTE aprobado no incrementan `metrics.absent` ni `employees.absent`.
- [ ] **PC-1 tarjeta:** días de vacación no se tratan como ausencia / minutos no trabajados por falta de marcación.
- [ ] **PC-1 reportes:** `absentDays` (u equivalente) excluye días cubiertos por vacaciones aprobadas.
- [ ] **D6:** kiosko rechaza marcación en rango de vacaciones aprobadas.
- [ ] **D6:** app móvil rechaza marcación (o documentado como ya cubierto con test).
- [ ] Solo `status: APROBADA` y `type: DISFRUTE` aplican las reglas.
- [ ] Tests unitarios de monitor, tarjeta, reportes y marcación pasan.
- [ ] No regresión en flujos de asistencia sin vacaciones.
- [ ] _(Opcional)_ Listado colaboradores muestra indicador de vacación hoy.

---

## Validation commands

```bash
pnpm --filter=api test -- attendance-monitor-summary.service.spec
pnpm --filter=api test -- attendance.service.spec
pnpm --filter=api test -- attendance-card
pnpm --filter=api test -- mobile-attendance.service.spec
pnpm --filter=api test -- reports.service.spec
```
