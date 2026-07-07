# SHIFT-UNI — Modelo único de turnos asignados (asistencia + nómina)

**Domain:** `[BACKEND]` `[FRONTEND]` `[ATTENDANCE]` `[PAYROLL]`  
**Status:** `pending`  
**Tickets Jira:** OS-547, OS-551, OS-554, NOM-07, CONN-04a, CONN-04b  
**Módulo NestJS:** `apps/api/src/turnos/` (extender) + consumidores en `attendance/` y `payroll/`  
**Depends on:** OS-547 (panel de asistencia — menú Turnos, colaboradores, sedes)  
**Blocks:** NOM-07 (liquidación HObj / ordinarias vs. extra), CONN-04a, CONN-04b (app móvil — validación contra turno)

---

## Historia de usuario

**Como** sistema,  
**quiero** un único modelo de turnos asignados por empleado y sede,  
**para que** la asistencia (validar entrada/salida contra el turno) y la nómina (calcular horas ordinarias vs. extra) usen la misma definición.

---

## Objetivo

Definir **una sola fuente de verdad** para:

1. **Qué turno le corresponde a un empleado** en una sede y en un rango de fechas.
2. **Cuántas horas objetivo (HObj)** tiene ese día según el turno asignado.
3. **A qué hora termina la jornada ordinaria** y desde cuándo cuentan horas extra (HHEE).

Los consumidores dejan de asumir valores fijos (p. ej. `08:00:00` / `REGULAR_DAY_MINUTES = 480`) y consultan el mismo servicio de resolución de turno.

---

## Estado actual (codebase)

| Área                                | Hoy                                                                                                | Gap                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Catálogo `Turno`                    | Existe (`nombre`, `sigla`, `tipo`, `jornada`, `horaInicio`, `horaFin`, `estado`) — NOM-08 / OS-581 | **Sin** `locationId` ni `daysOfWeek`; turno es global al tenant, no por sede                    |
| Asignación diaria `TurnoAssignment` | Existe por `(employeeId, workDate)` — OS-582/OS-583                                                | Calendario operativo (ASSIGNED/REST/BASE); **no** modela vigencia `effectiveFrom`/`effectiveTo` |
| Menú Turnos OS-547                  | CRUD `/api/turnos` + vista semanal `/api/turnos/asignaciones`                                      | Gestiona `Turno`/`TurnoAssignment`, no el modelo unificado propuesto                            |
| Tarjeta OS-551 — HObj               | Hardcodeado `08:00:00` en `attendance-card.mapper.ts`                                              | No lee turno asignado                                                                           |
| Tarjeta OS-551 — HO/HNT/HHEE        | `REGULAR_DAY_MINUTES = 480` en mapper y `attendance-card-calculations.ts`                          | Ordinarias/extra calculadas con jornada fija de 8 h                                             |
| `AttendanceService.registerEvent()` | Valida secuencia ENTRY/EXIT; `shift` en log es enum `AttendanceShift` (MORNING/…)                  | No valida contra turno asignado del empleado (OS-554)                                           |
| NOM-07 liquidación                  | En construcción; depende de ASIS-UNI para marcaciones                                              | Aún sin resolver HObj / fin de jornada desde turno                                              |
| CONN-04a/04b (app móvil)            | Fuera de este repo                                                                                 | Necesitan API de resolución de turno del día                                                    |

### Archivos relevantes

- `apps/api/prisma/schema.prisma` — `Turno`, `TurnoAssignment`
- `apps/api/src/turnos/` — módulo REST turnos y asignaciones
- `apps/web-app/src/features/attendance/mappers/attendance-card.mapper.ts` — `targetHours: '08:00:00'`
- `apps/web-app/src/features/attendance/utils/attendance-card-calculations.ts` — `REGULAR_DAY_MINUTES = 480`
- `apps/api/src/attendance/service/attendance.service.ts` — `registerEvent()`
- `tasks/nom-08-turnos-backend/`, `tasks/attendance/OS-582-shift-assignment-calendar.md`

---

## Modelo objetivo (producto)

```prisma
model Shift {
  id          String    @id @default(cuid())
  tenantId    String
  locationId  String
  name        String    // "Turno mañana", "Turno noche"
  startTime   String    // "08:00"
  endTime     String    // "16:00"
  daysOfWeek  Int[]     // 0=domingo … 6=sábado
  deletedAt   DateTime?

  location    Location  @relation(...)
  assignments EmployeeShiftAssignment[]

  @@index([tenantId, locationId])
  @@index([tenantId, deletedAt])
  @@map("shifts")
}

model EmployeeShiftAssignment {
  id            String    @id @default(cuid())
  tenantId        String
  employeeId      String
  shiftId         String
  effectiveFrom   DateTime  @db.Date
  effectiveTo     DateTime? @db.Date

  shift    Shift           @relation(...)
  employee EmployeeDetails @relation(...)

  @@index([tenantId, employeeId, effectiveFrom])
  @@index([tenantId, shiftId])
  @@map("employee_shift_assignments")
}
```

> **Nota de naming:** el spec de producto usa `Shift` / `EmployeeShiftAssignment` en inglés. En implementación, evaluar **renombrar/evolucionar `Turno`** en lugar de crear tablas paralelas (ver decisión 1).

---

## Decisiones de diseño

### 1. Convergencia con `Turno` / `TurnoAssignment` existentes

**Opción recomendada (A): evolucionar `Turno`, no duplicar tablas.**

| Concepto producto                     | Implementación propuesta                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Shift`                               | Extender modelo `Turno`: agregar `locationId`, `daysOfWeek`; mantener campos ya usados por UI (`nombre`, `sigla`, `horaInicio`, `horaFin`, `estado`)                           |
| `EmployeeShiftAssignment`             | **Nueva** tabla de vigencia por empleado                                                                                                                                       |
| `TurnoAssignment` (calendario diario) | **Se mantiene** para programación semanal (OS-582/OS-583). Cuando exista asignación diaria explícita, **tiene prioridad** sobre el turno base del empleado para ese `workDate` |

**Regla de resolución unificada** (`ShiftResolutionService.resolveForDay`):

```
1. Si existe TurnoAssignment para (employeeId, workDate):
   - ASSIGNED → usar ese turno (horas del día)
   - REST     → HObj = 0; no se espera marcación
   - (no fila) → paso 2
2. Si existe EmployeeShiftAssignment vigente en workDate
   Y workDate cae en daysOfWeek del turno
   Y locationId coincide con la sede del contexto
   → usar ese turno
3. Si no → sin turno asignado (HObj = 0 o política documentada por tenant)
```

Esto evita romper OS-582/OS-583 y cumple el AC de que un cambio de turno del empleado impacte asistencia y nómina del período siguiente.

**Opción descartada (B):** crear `shifts` + `employee_shift_assignments` en paralelo a `turnos` — duplicaría catálogo y menú OS-547.

### 2. Multi-tenancy y sede

- Todo query filtra por `tenantId` del JWT.
- `locationId` en turno: un turno pertenece a **una sede**; el mismo nombre/horario en otra sede es otro registro.
- `EmployeeShiftAssignment` no repite `locationId` — se infiere del `shift.locationId`.
- Validar que el empleado tenga relación activa con la sede (`EmployeeDetails.locationId` o asignación vigente).

### 3. `daysOfWeek` y turnos nocturnos

- `daysOfWeek` indica en qué días de la semana **aplica** el turno cuando hay asignación vigente.
- Turno que cruza medianoche (`horaFin < horaInicio`): la jornada del `workDate` es el día del **inicio** programado (misma convención que `AttendanceLog.workDate` en NOM-03).
- Duración HObj = diferencia `horaInicio`–`horaFin` en minutos, con ajuste +24 h si es nocturno.

### 4. `ShiftService` (capa de dominio)

Responsabilidades:

| Operación                                                   | Descripción                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| CRUD turnos por sede                                        | Crear/editar/desactivar turnos con `locationId` + `daysOfWeek`          |
| CRUD asignación empleado                                    | Crear/cerrar `EmployeeShiftAssignment` (`effectiveTo` al cambiar turno) |
| `resolveForDay(tenantId, employeeId, locationId, workDate)` | Punto único para consumidores                                           |
| `getTargetMinutesForDay(...)`                               | Retorna minutos objetivo (HObj) para tarjeta y nómina                   |

Los controllers REST existentes (`/api/turnos`) se extienden; **no** crear módulo duplicado.

### 5. Consumidores

| Consumidor                        | Ticket     | Cambio                                                                               |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| Tarjeta asistencia — HObj         | OS-551     | `targetHours` desde `getTargetMinutesForDay`, no `08:00:00` fijo                     |
| Tarjeta — HO/HNT/HHEE             | OS-551     | Ordinarias/extra vs. minutos objetivo del turno resuelto                             |
| Registro manual / `registerEvent` | OS-554     | Validar entrada/salida contra ventana del turno (tolerancia configurable en Task 03) |
| Menú Turnos                       | OS-547     | Formularios y listados editan `Turno` extendido + asignación por empleado            |
| Colaboradores — turno de hoy      | OS-550     | Reutilizar `resolveForDay` (alinear con OS-582 cuando hay calendario diario)         |
| Liquidación nómina                | NOM-07     | Fin de jornada ordinaria y HObj desde mismo resolver                                 |
| App móvil                         | CONN-04a/b | Endpoint o GraphQL de resolución de turno del día (contrato en Task 04)              |

### 6. Soft delete

- `Turno` / `Shift`: `deletedAt` o mantener `estado: false` — **decidir en Task 01**. Si se agrega `deletedAt`, queries filtran `deletedAt: null` además de `estado`.
- `EmployeeShiftAssignment`: no hard delete; cerrar con `effectiveTo` para historial de nómina.
- `TurnoAssignment`: sin cambio (hard delete operativo, ver OS-582).

### 7. Auditoría

- CREATE/UPDATE de turnos y asignaciones de empleado en `AuditLog` (mismo patrón NOM-08).
- Cambio de turno con `effectiveFrom` futuro debe quedar auditado para trazabilidad en nómina.

---

## Criterios de aceptación (producto)

- [ ] Un cambio de turno de un empleado se refleja tanto en el panel de asistencia como en el cálculo de nómina del **siguiente período** (vigencia `effectiveFrom` / cierre `effectiveTo`).
- [ ] **HObj** en la Tarjeta de Asistencia (OS-551) coincide con las horas del turno asignado, no un valor fijo hardcodeado.
- [ ] El menú **Turnos** de OS-547 gestiona directamente este modelo (catálogo por sede + asignación por empleado).
- [ ] `registerEvent()` (OS-554) y CONN-04a/b consultan el mismo resolver que la tarjeta y NOM-07.
- [ ] Tests: empleado con turno 6 h → HObj `06:00:00`; con día REST en calendario → HObj `—` / 0.

---

## Desglose de tareas (SDD)

| #   | Archivo                                                                                      | Objetivo                                                                                                       |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 01  | [task-01-schema-employee-shift-assignment.md](./task-01-schema-employee-shift-assignment.md) | Extender `Turno` (`locationId`, `daysOfWeek`); crear `EmployeeShiftAssignment`; migración + permisos si aplica |
| 02  | [task-02-shift-service-and-resolution.md](./task-02-shift-service-and-resolution.md)         | `ShiftService`: CRUD asignación empleado + `resolveForDay` / `getTargetMinutesForDay`                          |
| 03  | [task-03-attendance-consumers.md](./task-03-attendance-consumers.md)                         | OS-551 (HObj/HO/HNT/HHEE), OS-554 (`registerEvent`), OS-547/OS-550 UI                                          |
| 04  | [task-04-payroll-and-mobile-consumers.md](./task-04-payroll-and-mobile-consumers.md)         | NOM-07 liquidación; contrato API para CONN-04a/04b                                                             |

**Orden:** 01 → 02 → 03 y 04 (03 y 04 pueden paralelizarse tras 02).

---

## Dependencias

```
OS-547 (panel + menú Turnos)
    │
    ▼
SHIFT-UNI (este epic)
    │
    ├──► NOM-07 (HObj / ordinarias vs. extra en liquidación)
    ├──► CONN-04a (marcación móvil — validación turno)
    └──► CONN-04b (marcación móvil — validación turno)
```

**Relación con otros epics:**

- **ASIS-UNI** (`unified-attendance-model`): fuente única de **marcaciones** (`AttendanceLog`). SHIFT-UNI es complementario — fuente única de **turnos**. Ambos deben completarse para NOM-07 end-to-end.
- **NOM-08 / OS-582**: prerequisito ya implementado; este epic **extiende** sin reemplazar el calendario diario.

---

## Validación global (post-epic)

```bash
pnpm --filter=@restopsiq/api exec prisma validate
pnpm --filter=@restopsiq/api test -- --testPathPattern="turnos|attendance-card|shift"
pnpm --filter=web-app test -- attendance
node scripts/validate-structure.js
```

---

## Riesgos

| Riesgo                                                          | Impacto | Mitigación                                                                                      |
| --------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| Dos fuentes de turno (calendario diario vs. asignación vigente) | Alto    | Regla de prioridad documentada en `resolveForDay`; tests de matriz ASSIGNED/REST/base/vigencia  |
| Turnos existentes sin `locationId`                              | Medio   | Migración: asignar sede default o backfill desde primer `EmployeeDetails.locationId` del tenant |
| Cálculos frontend vs. backend divergentes                       | Alto    | Mover HO/HNT/HHEE/HObj al API de tarjeta (Task 03); frontend solo formatea                      |
| NOM-07 implementado con 8 h fijas                               | Alto    | Task 04 audita payroll antes de habilitar liquidación automática                                |

---

## Out of scope (épica)

- Rediseño completo de la vista calendario OS-582 (solo alinear resolución).
- App móvil nativa (CONN-04a/b) — solo contrato API en Task 04.
- Cambios en `packages/` salvo tipos compartidos explícitamente requeridos en una task.
- GraphQL (salvo que una task futura lo exija para móvil).
