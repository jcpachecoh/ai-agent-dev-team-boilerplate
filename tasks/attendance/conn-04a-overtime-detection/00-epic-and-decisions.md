# CONN-04a — Detección automática de tiempo extra por marcación tardía y aprobación en cascada

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[ATTENDANCE]` `[PAYROLL]` `[NOTIFICATIONS]`  
**Status:** `pending`  
**Created:** 2026-07-10  
**Jira:** `CONN-04a` / `OS-605` (asignar issue en Jira)  
**Módulo NestJS propuesto:** `apps/api/src/overtime/` (nuevo, estructura estándar) + hooks en `attendance/` y consumo en `payroll/` / `reports/`  
**UI:** `apps/web-app/src/features/attendance/**` — bandejas en panel de asistencia (OS-547/548) e indicador en Tarjeta de Asistencia (OS-551)

---

## Flujo de negocio (Flujo 1 — QA/producto)

El empleado registra su **salida** algunos minutos después de terminado el turno (ej.: turno termina a las 6:00pm, registra salida a las 6:05pm). Ese tiempo debe empezar a contar como tiempo extra cuando se **acumulen más de 30 minutos** (no cada marcación tardía aislada).

En el momento en que se vaya a **liquidar nómina**, ese tiempo extra acumulado debe pasar por una **cascada de aprobación** de 3 niveles:

1. **Administrador**
2. **Gerente de Operaciones**
3. **Gerente General**

Cada nivel debe recibir una **alerta** para realizar su aprobación. Cualquier nivel puede **objetar** (`OBJETADA`), deteniendo la cascada. Solo lo **aprobado** llega a liquidación (NOM-07).

---

## Historia de usuario

**Como** sistema,  
**quiero** detectar automáticamente el tiempo extra por marcaciones de salida posteriores al fin de turno, acumularlo, y someterlo a una cascada de aprobación de 3 niveles antes del cierre de nómina,  
**para que** solo se pague tiempo extra autorizado.

---

## Contexto en el codebase

| Área                | Estado actual                                            | Gap                                                                   |
| ------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Marcación de salida | `AttendanceService.registerEvent()` (CONN-01 / ASIS-UNI) | No dispara detección de exceso post-turno                             |
| Fin de turno        | `ShiftResolutionService` (CONN-03 / SHIFT-UNI)           | No consumido al comparar `actualEndTime` vs `shiftEndTime`            |
| Motor legal HE      | OS-586 — `overtimeEntries` en reporte nómina             | `GAP(OS-586)`: liquida **toda** HE detectada sin filtro de aprobación |
| Modelo de solicitud | No existe                                                | Crear `OvertimeRequest` + `OvertimeApproval`                          |
| UI asistencia       | OS-547/548/551 implementados                             | Sin bandeja de aprobación HE ni indicador por nivel                   |

> **Relación con CONN-04b:** CONN-04b cubre solicitudes **administrativas** de tiempo extra (`SOLICITUD_ADMINISTRATIVA`). Este epic cubre solo `DETECCION_AUTOMATICA`. Comparten modelo y cascada; diferir implementación de 04b a epic hermano.

---

## Objetivo

1. Al registrar una **salida** (`EXIT`), calcular minutos de exceso sobre `shiftEndTime` del día.
2. **Acumular** exceso por empleado + sede + período de nómina abierto.
3. Crear o actualizar `OvertimeRequest` tipo `DETECCION_AUTOMATICA` solo cuando el acumulado **supere 30 minutos**.
4. Exponer cascada de aprobación Admin → Gerencia Operaciones → Gerencia General.
5. Notificar al aprobador activo en cada transición.
6. En cierre/liquidación (OS-380 / NOM-07), liquidar **solo** minutos de solicitudes `APROBADA`.

---

## ⭐ Puntos clave

### PC-1 — Umbral de 30 minutos (acumulado, no por marcación)

- Una salida tardía de **10 minutos** **no** genera solicitud.
- La solicitud se crea/actualiza cuando `accumulatedMinutes > 30` en el período.
- Tests obligatorios en el límite: `30` → no solicitud; `31` → solicitud.

### PC-2 — Solo salidas posteriores al fin de turno

- Comparar `actualEndTime` (timestamp del `EXIT`) contra `shiftEndTime` resuelto para `(tenantId, employeeId, locationId, workDate)`.
- Si `actualEndTime <= shiftEndTime` → no suma al acumulado.
- Si no hay turno resoluble → **no** detectar automáticamente (log + skip; no inventar `shiftEndTime`).

### PC-3 — Cascada estricta de 3 niveles

```
DETECCIÓN (>30 min) → PENDIENTE_ADMIN
  → approve (Admin)           → PENDIENTE_GERENCIA_OPERACIONES
  → approve (Ger. Operaciones)→ PENDIENTE_GERENCIA_GENERAL
  → approve (Ger. General)    → APROBADA

Cualquier nivel → object (motivo) → OBJETADA (terminal)
```

### PC-4 — Integración liquidación (NOM-07 / OS-586)

- `ReportsService` / `PayrollCalculationService` deben filtrar `overtimeEntries` (o minutos equivalentes) contra solicitudes `APROBADA` del mismo `payrollPeriod`.
- Cerrar `GAP(OS-586)` documentado en `tasks/payroll/OS-586-extra-time-legal-engine.md`.

### PC-5 — Presentación al cierre de nómina

- Al iniciar cierre/liquidación del período (OS-380), el Administrador ve solicitudes `PENDIENTE_ADMIN` (y estados posteriores según rol) asociadas a ese `payrollPeriod`.
- `payrollPeriod` se asigna al crear/actualizar la solicitud (formato alineado con OS-380, ej. `YYYY-MM`).

---

## Modelo de datos (propuesto)

```prisma
enum OvertimeRequestType {
  DETECCION_AUTOMATICA
  SOLICITUD_ADMINISTRATIVA // reservado para CONN-04b — no implementar flujo en este epic
}

enum OvertimeStatus {
  PENDIENTE_ADMIN
  PENDIENTE_GERENCIA_OPERACIONES
  PENDIENTE_GERENCIA_GENERAL
  APROBADA
  OBJETADA
}

enum OvertimeApprovalLevel {
  ADMINISTRADOR
  GERENCIA_OPERACIONES
  GERENCIA_GENERAL
}

enum OvertimeApprovalDecision {
  APROBADO
  OBJETADO
}

model OvertimeRequest {
  id                 String              @id @default(cuid())
  tenantId           String
  employeeId         String
  locationId         String
  type               OvertimeRequestType
  shiftEndTime       DateTime
  actualEndTime      DateTime            // última salida que actualizó el acumulado (MVP)
  accumulatedMinutes Int
  status             OvertimeStatus      @default(PENDIENTE_ADMIN)
  payrollPeriod      String?             // ej. "2026-07"
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  deletedAt          DateTime?

  employee  EmployeeDetails @relation(fields: [employeeId], references: [id])
  location  Location        @relation(fields: [locationId], references: [id])
  approvals OvertimeApproval[]

  @@index([tenantId])
  @@index([tenantId, employeeId])
  @@index([tenantId, locationId])
  @@index([tenantId, status])
  @@index([tenantId, payrollPeriod])
  @@index([tenantId, deletedAt])
  @@unique([tenantId, employeeId, locationId, payrollPeriod, type]) // una solicitud automática por empleado/sede/período
  @@map("overtime_requests")
}

model OvertimeApproval {
  id                String                    @id @default(cuid())
  tenantId          String
  overtimeRequestId String
  level             OvertimeApprovalLevel
  approverId        String?
  decision          OvertimeApprovalDecision?
  decidedAt         DateTime?
  comment           String?
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt

  overtimeRequest OvertimeRequest @relation(fields: [overtimeRequestId], references: [id])

  @@index([tenantId])
  @@index([tenantId, overtimeRequestId])
  @@unique([overtimeRequestId, level])
  @@map("overtime_approvals")
}
```

> **Nota:** `tenantId` en `OvertimeApproval` es obligatorio por convención multi-tenant del repo aunque no aparezca en el spec original de producto.

---

## Decisiones de diseño

### D1 — Período de acumulación ✅ (decidido)

**Período de nómina** alineado con NOM-07 / OS-380: string `YYYY-MM` derivado de `workDate` de la marcación (zona `America/Bogota`).

- Una solicitud `DETECCION_AUTOMATICA` por `(tenantId, employeeId, locationId, payrollPeriod)`.
- Cada `EXIT` tardío **suma** minutos al mismo registro si ya existe y no está `APROBADA`/`OBJETADA`.
- El `payrollPeriod` se asigna al crear la solicitud y no cambia durante la cascada.

### D1b — Tras objeción en el mismo período ✅ (decisión técnica)

Si una solicitud queda `OBJETADA`:

- **No** se crea automáticamente otra solicitud `DETECCION_AUTOMATICA` para el mismo `(tenantId, employeeId, locationId, payrollPeriod)`.
- Los `EXIT` tardíos posteriores en ese período se ignoran para detección automática (log debug).
- Reapertura o nuevo registro solo vía **CONN-04b** (`SOLICITUD_ADMINISTRATIVA`) o acción manual RRHH (fuera de alcance CONN-04a).

> Evita cascadas duplicadas y disputas de pago en el mismo corte.

### D2 — Cálculo de minutos de exceso

```
excessMinutes = max(0, floor((actualEndTime - shiftEndTime) / 60000))
```

- Usar `shiftEndTime` como `DateTime` del día laboral (fecha `workDate` + hora del turno resuelto).
- Turnos nocturnos que cruzan medianoche: seguir reglas de `ShiftResolutionService` (CONN-03).

### D3 — Hook en registro de asistencia

Tras persistir un `EXIT` exitoso en `AttendanceService.registerEvent()`:

```typescript
await this.overtimeDetectionService.onExitRegistered({
  tenantId,
  employeeId,
  locationId,
  workDate,
  actualEndTime: timestamp,
});
```

- **No** bloquear la marcación si falla la detección (try/catch + log).
- Inyección vía módulo `OvertimeModule` exportando `OvertimeDetectionService`.

### D4 — Aprobadores por cargo (`EmployeePosition`) ✅ (decidido)

La cascada **no** usa `roleCode` (`MANAGER`, `OWNER`, etc.). Los aprobadores se resuelven por **cargo** del usuario vinculado (`EmployeeDetails.positionId` → `EmployeePosition.title`).

| Nivel enum             | Cargo en catálogo (UI)    | `positionId` seed PDL | Alcance                                                                                       |
| ---------------------- | ------------------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| `ADMINISTRADOR`        | `ADMINISTRADOR`           | `pos-pdl-001`         | Misma **sede** que la solicitud (`UserLocation` del aprobador ∩ `locationId` de la solicitud) |
| `GERENCIA_OPERACIONES` | `DIRECTOR DE OPERACIONES` | `pos-pdl-003`         | Tenant-wide (producto: "Gerente de Operaciones")                                              |
| `GERENCIA_GENERAL`     | `GERENTE GENERAL`         | `pos-pdl-007`         | Tenant-wide                                                                                   |

**Resolución de aprobadores:**

```typescript
// Pseudocódigo — task 05
findApprovers(tenantId, level, locationId?) {
  const positionIds = OVERTIME_APPROVAL_POSITION_IDS[level];
  // Usuarios activos con EmployeeDetails.positionId ∈ positionIds
  // Nivel ADMINISTRADOR: además filtrar UserLocation.locationId === locationId
}
```

**Validación al aprobar/objetar:** el `actorUserId` debe tener `positionId` del nivel activo y cumplir alcance de sede (nivel 1).

> **Nota organigrama:** en operación diaria, muchos empleados reportan vía `GERENTE DE PUNTO DE VENTA` (`pos-pdl-006`) → `DIRECTOR DE OPERACIONES`. Los **aprobadores** de la cascada siguen siendo los 3 cargos de gerencia arriba, no los cargos operativos intermedios.

Constantes sugeridas: `apps/api/src/overtime/overtime-approval.constants.ts` con títulos e IDs por tenant (MVP: IDs fijos del seed PDL; futuro: lookup por `title`).

### D4b — Permisos RBAC (complemento)

Solo control de **acceso a la bandeja** (lectura), no quién puede aprobar:

| Permiso                    | Uso                                                                       |
| -------------------------- | ------------------------------------------------------------------------- |
| `attendance.overtime.read` | Ver bandeja e historial (NOMINA, OWNER, SUPER_ADMIN + cargos aprobadores) |

La acción de aprobar/objetar se valida por **cargo** (D4), no por permiso RBAC separado por nivel.

### D5 — Objeción

- Cualquier nivel puede `object` con `comment` obligatorio.
- Transición inmediata a `OBJETADA`; registra `OvertimeApproval` con `decision: OBJETADO`.
- No avanza a liquidación; minutos quedan excluidos de NOM-07.

### D6 — Notificaciones MVP

Reutilizar patrón de NOM-14 (`Logger` stub → in-app cuando exista módulo):

| Evento                                  | Destinatario                                                  |
| --------------------------------------- | ------------------------------------------------------------- |
| Solicitud creada / `PENDIENTE_ADMIN`    | Usuarios con cargo `ADMINISTRADOR` en la sede de la solicitud |
| Pasa a `PENDIENTE_GERENCIA_OPERACIONES` | Usuarios con cargo `DIRECTOR DE OPERACIONES`                  |
| Pasa a `PENDIENTE_GERENCIA_GENERAL`     | Usuarios con cargo `GERENTE GENERAL`                          |
| `APROBADA` / `OBJETADA`                 | Empleado afectado (opcional MVP)                              |

Email/push → fuera de alcance MVP.

### D7 — UI

- **Bandeja** por rol en `/asistencia` (subruta propuesta: `/asistencia/tiempo-extra` o pestaña en panel OS-548).
- Columnas: empleado, sede, minutos acumulados, fin de turno, última salida, estado, período.
- Acciones: Aprobar / Objetar (modal con comentario obligatorio en objeción).
- **Tarjeta OS-551:** badge/ícono en el día con solicitud pendiente/aprobada/objetada (color por estado).

### D8 — Relación con OS-380 ✅ (decidido: solo advertencia)

Al abrir wizard de cierre/liquidación del período (OS-380):

- Endpoint `GET /attendance/overtime-requests/summary?payrollPeriod=...` retorna `{ pendingCount, objectedCount, approvedCount }`.
- Si `pendingCount > 0` → UI muestra **advertencia** visible ("Hay X solicitudes de tiempo extra pendientes de aprobación").
- **No bloquea** el cierre de nómina en MVP.
- Minutos no aprobados se excluyen de liquidación aunque el cierre continúe (task 07).

---

## Criterios de aceptación (epic)

- [ ] Una marcación tardía aislada de **10 minutos** NO genera solicitud hasta acumular **más de 30 minutos** en el período.
- [ ] La solicitud pasa correctamente por los 3 niveles en orden (`ADMINISTRADOR` → `DIRECTOR DE OPERACIONES` → `GERENTE GENERAL`).
- [ ] Cada aprobador recibe una alerta cuando la solicitud llega a su nivel.
- [ ] Una objeción en **cualquier** nivel detiene la cascada y la solicitud **no** se paga.
- [ ] Solo el tiempo extra con estado `APROBADA` llega a la liquidación de nómina (NOM-07).
- [ ] Tests: acumulación exacta en el límite de 30 minutos; objeción en cada uno de los 3 niveles.
- [ ] Multi-tenant: todas las queries con `tenantId`; soft delete con `deletedAt`.

---

## Subtareas (SDD)

> Implementar **una a la vez**. Cada archivo incluye Goal / Scope / Out of scope / Files allowed / Forbidden / Acceptance / Validation.

| #   | Archivo                                                                                    | Descripción                                                 |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 01  | [task-01-schema-migration.md](./task-01-schema-migration.md)                               | Enums, `OvertimeRequest`, `OvertimeApproval`, migración     |
| 02  | [task-02-interfaces.md](./task-02-interfaces.md)                                           | Contratos TS repository/service                             |
| 03  | [task-03-repository.md](./task-03-repository.md)                                           | Prisma: CRUD, acumulado, bandejas por estado/período        |
| 04  | [task-04-detection-service.md](./task-04-detection-service.md)                             | `OvertimeDetectionService` + hook en `registerEvent` EXIT   |
| 05  | [task-05-approval-cascade-service.md](./task-05-approval-cascade-service.md)               | Aprobar/objetar por nivel, máquina de estados               |
| 06  | [task-06-notifications.md](./task-06-notifications.md)                                     | Alertas por nivel de aprobación                             |
| 07  | [task-07-payroll-liquidation-integration.md](./task-07-payroll-liquidation-integration.md) | Filtrar `overtimeEntries` por `APROBADA`; cerrar GAP OS-586 |
| 08  | [task-08-api-endpoints-dtos.md](./task-08-api-endpoints-dtos.md)                           | REST controller, DTOs, permisos RBAC                        |
| 09  | [task-09-frontend-approval-inbox.md](./task-09-frontend-approval-inbox.md)                 | Bandeja por rol + indicador tarjeta OS-551                  |
| 10  | [task-10-tests-validation.md](./task-10-tests-validation.md)                               | Tests umbral 30 min, cascada, objeciones, validación final  |

**Orden de implementación:**

```
01 → 02 → 03
         ↓
04 → 05 → 06 → 07 → 08 → 09 → 10
```

---

## Fuera de alcance (epic)

- `SOLICITUD_ADMINISTRATIVA` (CONN-04b).
- App móvil empleado (CONN-01 app nativa — solo hook server-side).
- Email / push notifications.
- Reapertura automática de solicitud `OBJETADA` en el mismo período (ver D1b — solo CONN-04b).
- Dispositivos biométricos / kiosko.
- Cambios al motor legal de recargos OS-586 (solo consumo del estado de aprobación).

---

## Dependencias

```
CONN-01 (registerEvent EXIT) ──┐
CONN-03 (shiftEndTime)        ──┼──► CONN-04a ──► NOM-07 (liquidación HE aprobada)
ASIS-UNI (AttendanceLog único)  ──┘
SHIFT-UNI (resolución turno)  ──┘
```

- **Depende de:** CONN-01, CONN-03, ASIS-UNI (task 02 `registerEvent`), SHIFT-UNI (`ShiftResolutionService`).
- **Relacionado con:** OS-380 (cierre período), OS-586 (motor legal HE), OS-547/548/551 (UI asistencia).
- **Bloquea:** NOM-07 liquidación de horas extra con trazabilidad de aprobación.

---

## Decisiones de producto (cerradas 2026-07-10)

| #   | Pregunta                                    | Decisión                                                                                        |
| --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Q1  | ¿Quién aprueba en cada nivel?               | **Cargos** del catálogo: `ADMINISTRADOR`, `DIRECTOR DE OPERACIONES`, `GERENTE GENERAL` (ver D4) |
| Q2  | ¿Bloquear cierre de nómina con pendientes?  | **Solo advertir** — no bloquear (D8)                                                            |
| Q3  | ¿Período de acumulación?                    | **Período de nómina** `YYYY-MM` alineado con NOM-07/OS-380 (D1)                                 |
| Q4  | ¿Reabrir tras objeción en el mismo período? | **No** automático — ignorar nuevos EXIT tardíos; reapertura vía CONN-04b (D1b)                  |
