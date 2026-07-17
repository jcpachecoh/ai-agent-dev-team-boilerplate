# CONN-04b — Solicitud administrativa de extensión de jornada

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[ATTENDANCE]` `[PAYROLL]` `[NOTIFICATIONS]`  
**Status:** `done` — implementación Tasks 01–10; validación local OK; CI remoto pendiente  
**Created:** 2026-07-16  
**Jira:** `CONN-04b` / `OS-606`  
**Módulo NestJS:** extensión de `apps/api/src/overtime/` (+ consumo en `reports/` / `payroll/`)  
**UI:** `apps/web-app/src/features/attendance/**` — bandeja `/asistencia/tiempo-extra` + Tarjeta OS-551  
**Ticket raíz:** [OS-606.md](../../OS-606.md)

---

## Historia de usuario

**Como** Administrador de sede,  
**quiero** solicitar de forma proactiva una extensión de jornada para uno o varios colaboradores (con fecha, horario propuesto y motivo),  
**para que** Gerencia de Operaciones y Gerencia General la aprueben u objeten antes de que ese tiempo adicional pueda liquidarse, reutilizando el flujo de horas extra de CONN-04a.

---

## Objetivo

1. Crear solicitudes `SOLICITUD_ADMINISTRATIVA` (1 por empleado) desde un payload multi-empleado.
2. Iniciar cascada en `PENDIENTE_GERENCIA_OPERACIONES` (sin nivel Administrador).
3. Modelar ventana propuesta sin contaminar campos de detección automática.
4. Motivos tenant-scoped vía `EmployeeCatalogOption` (`OVERTIME_REASON`).
5. Extender bandeja, tarjeta y liquidación NOM-07 sin pantallas/APIs paralelas.
6. Corregir riesgo `pending-salary` antes de datos reales.

---

## Contexto en el codebase (auditoría)

| Área                      | Estado                    | Gap OS-606                          |
| ------------------------- | ------------------------- | ----------------------------------- |
| `OvertimeRequest` / enums | Completo CONN-04a + admin | ✅ campos + unique parciales        |
| Cascada approve/object    | Completo                  | ✅ estado inicial Ops (sin Admin)   |
| Detección automática      | Completo (CONN-11)        | Intacta                             |
| API create                | ✅                        | `POST .../administrative`           |
| Motivos HE                | ✅                        | `OVERTIME_REASON` + FK + CRUD       |
| Bandeja FE                | ✅                        | Modal create + columna origen       |
| Tarjeta OS-551            | ✅                        | Origen/estado                       |
| NOM-07 gate               | ✅                        | Intersección + anti doble conteo    |
| Notify                    | Logger stub               | Reutilizado en create (deuda email) |
| Postman / seeds admin     | ✅                        | Carpeta OS-606 + seeds demo         |

**Base de rama:** `develop` ya contiene CONN-04a (#228) + amendment CONN-11. No basar en `origin/CONN-04a` (stale).

---

## Arquitectura

```
Admin (sede) ──POST create──► OvertimeService.createAdministrativeBatch
                                    │
                                    ▼ Prisma $transaction (all-or-nothing)
                         N × OvertimeRequest (SOLICITUD_ADMINISTRATIVA)
                         status = PENDIENTE_GERENCIA_OPERACIONES
                         batchId compartido (trazabilidad)
                                    │
                                    ▼ OvertimeNotificationService.notifyLevelPending
                         Gerencia Operaciones ──approve──► PENDIENTE_GERENCIA_GENERAL
                                           └──object──► OBJETADA (solo esa fila)
                         Gerencia General ──approve──► APROBADA
                                         └──object──► OBJETADA
                                    │
                                    ▼ NOM-07 (fase 8)
                         minutos liquidables = intersección(ventana, OVERTIME marcado)
```

### Componentes afectados

| Capa               | Componentes                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| Prisma             | `OvertimeRequest` (+ campos), `EmployeeCatalogType.OVERTIME_REASON`, unique/índices |
| BE overtime        | interfaces, repository, create service, controller/DTOs, constants (estado inicial) |
| BE payroll/reports | gate liquidación; `pending-salary.service.ts`                                       |
| FE attendance      | inbox, client, hooks, types, card                                                   |
| Seeds              | motivos + demo admin                                                                |
| Postman            | carpeta CONN-04b / OS-606                                                           |

---

## ⭐ Decisiones técnicas cerradas

### D1 — Una solicitud por empleado + batch

- Payload puede incluir varios `employeeIds`.
- Backend crea **N** `OvertimeRequest` en **una** `$transaction` (**all-or-nothing**).
- `batchId` (cuid) compartido solo para trazabilidad/UI; **no** es entidad de aprobación.
- Cada fila tiene `status` y `OvertimeApproval` independientes.
- Objeción en Ops/GG afecta **únicamente** esa solicitud.

### D2 — Flujo de estados (admin)

```
CREATE → PENDIENTE_GERENCIA_OPERACIONES
  → approve (Ger. Operaciones) → PENDIENTE_GERENCIA_GENERAL
  → approve (Ger. General)     → APROBADA

Cualquier nivel activo → object → OBJETADA (terminal)
```

- **No** hay aprobación de Administrador: es el solicitante.
- No se crea fila `OvertimeApproval` nivel `ADMINISTRADOR` en el flujo admin (o se omite por completo).
- Reutilizar `OvertimeApprovalService.approve/object` y `OVERTIME_NEXT_STATUS_AFTER_APPROVE` desde Ops.

### D3 — Representación temporal

| Campo               | Rol                                                                  |
| ------------------- | -------------------------------------------------------------------- |
| `workDate`          | Día laboral (DATE, zona `America/Bogota`) al que aplica la extensión |
| `proposedStartTime` | Inicio de ventana propuesta (DateTime absoluto)                      |
| `proposedEndTime`   | Fin de ventana propuesta (DateTime absoluto)                         |
| `proposedMinutes`   | Duración en minutos enteros; **calculada y validada** por backend    |

**Prohibido:** reasignar `shiftEndTime` / `actualEndTime` / `accumulatedMinutes` con semántica de “horario propuesto”.

Campos de detección (`shiftEndTime`, `actualEndTime`, `accumulatedMinutes`) permanecen con semántica CONN-04a; en schema se vuelven **nullable** para filas admin (null en `SOLICITUD_ADMINISTRATIVA`). Filas `DETECCION_AUTOMATICA` siguen poblándolos.

#### Cálculo de `proposedMinutes`

```
proposedMinutes = floor((proposedEndTime - proposedStartTime) / 60000)
```

Validaciones:

- `proposedEndTime > proposedStartTime` (instantes absolutos).
- `proposedMinutes >= 1`.
- `proposedStartTime`/`proposedEndTime` coherentes con `workDate` (inicio en `workDate` Bogotá; ver medianoche).

#### Ventanas que cruzan medianoche

- El cliente envía **instantes ISO** (`proposedStartTime`, `proposedEndTime`).
- Si la extensión termina al día siguiente (ej. 22:00 → 01:00), `proposedEndTime` debe ser el instante del día siguiente; `workDate` = día de inicio de la extensión (Bogotá).
- Backend **no** interpreta “HH:mm del mismo día” cuando `end <= start`; exige instantes ordenados.
- Test obligatorio: ventana 22:00–01:00 → minutos = 180, `workDate` = día de las 22:00.

### D4 — Motivos: `EmployeeCatalogOption` + `OVERTIME_REASON`

#### Evaluación concluyente

| Capacidad           | `EmployeeCatalogOption` hoy                            | ¿Suficiente?                                        |
| ------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Tenant scope        | `tenantId` obligatorio                                 | Sí                                                  |
| Discriminador       | `EmployeeCatalogType`                                  | Sí — agregar `OVERTIME_REASON`                      |
| Soft “delete”       | `isActive`                                             | Sí                                                  |
| Unicidad            | `@@unique([tenantId, type, name])`                     | Sí                                                  |
| Lectura API         | `GET /employee-catalogs?type=`                         | Sí (extender enum en DTO)                           |
| Escritura CRUD HTTP | Task-06A: create/update/deactivate + `includeInactive` | Reutiliza `employee-catalogs`; no catálogo paralelo |
| `pilaCode`          | Nullable (AREA/DEPARTMENT ya null)                     | Compatible — motivos HE con `pilaCode = null`       |

**Incompatibilidad arquitectónica demostrable:** ninguna.

**Decisión:** ampliar `EmployeeCatalogType` con `OVERTIME_REASON` y FK `OvertimeRequest.reasonOptionId → EmployeeCatalogOption.id`.

**Rechazado:**

- `reasonCode` String sin relación
- Modelo `OvertimeReasonCatalog` dedicado (innecesario)
- `cargosIdsAprovals String[]` (aprobadores = cargo D4 CONN-04a)

Motivos seed MVP (tenant demo `palos-de-lena`):

1. Inventario físico semana
2. Inventario físico mensual
3. Aseo

### D5 — Liquidación (regla objetivo)

La aprobación administrativa **autoriza una ventana**; **no** garantiza el pago de todos los `proposedMinutes`.

```
minutosLiquidablesAdmin =
  intersección(
    [proposedStartTime, proposedEndTime] de OvertimeRequest APROBADA,
    unión de intervalos de pares AttendanceLog markingScope=OVERTIME del empleado/sede
  ) en minutos enteros (floor)
```

#### Casos NOM-07 (task-08 — cerrados)

| Caso                                       | Comportamiento                                                                              | Estado              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------- |
| Sin marcación OVERTIME en la ventana       | 0 minutos liquidables de esa solicitud                                                      | **Cerrado (P1)**    |
| Marcación parcial dentro de ventana        | Solo minutos de intersección                                                                | **Cerrado (P2)**    |
| Marcación fuera de ventana                 | 0 de esa solicitud                                                                          | **Cerrado**         |
| Detección automática + admin mismo período | `liquidable = merge(autoAuth ∪ adminAuth)` sobre intervalos `[start,end)`; sin doble conteo | **Cerrado (P3)**    |
| Solicitud `OBJETADA` / no `APROBADA`       | 0                                                                                           | Cerrado             |
| Auto `APROBADA` sin pares OVERTIME         | Legacy CONN-04a (summary total−480)                                                         | Cerrado (regresión) |

**Implementación:** `findApprovedAdministrativeWindowsByEmployeeIdsForPeriod` + motor `liquidable-overtime-intervals.util` + `ReportsService.applyOvertimeApprovalGate`.

### D6 — Permisos y autorizaciones

| Código propuesto              | Uso                                             |
| ----------------------------- | ----------------------------------------------- |
| `attendance.overtime.request` | Crear solicitudes administrativas               |
| `attendance.overtime.read`    | Bandeja/detalle/summary — **no** implica create |

Creación:

- JWT válido, no token kiosko.
- Permiso `attendance.overtime.request`.
- Actor con cargo Administrador (`pos-pdl-001` / resolución D4) **y** `UserLocation` que incluya `locationId` de la solicitud.
- `NOMINA` / `OPERATOR` / solo-`attendance.overtime.read`: **no** crean (P4 cerrado: NOMINA no crea).
- OWNER/SUPER_ADMIN con `ALL` siguen sujetos al control efectivo de cargo Administrador + `UserLocation`.

Aprobación: sin cambio — cargo Ops/GG (o bypass `NOMINA`); OWNER/SUPER_ADMIN no aprueban.

**Deuda documentada (no resolver en OS-606):** `OVERTIME_APPROVER_POSITION_IDS` hardcodeados al seed PDL.

### D7 — Contrato API final

```http
POST /api/attendance/overtime-requests/administrative
```

**Request body:**

```json
{
  "employeeIds": ["emp_1", "emp_2"],
  "locationId": "loc_1",
  "workDate": "2026-07-20",
  "proposedStartTime": "2026-07-20T22:00:00.000-05:00",
  "proposedEndTime": "2026-07-21T01:00:00.000-05:00",
  "reasonOptionId": "opt_overtime_reason_aseo"
}
```

> `proposedMinutes` **no** se acepta del cliente; lo calcula el backend.

**Response 201:**

```json
{
  "batchId": "batch_cuid",
  "createdCount": 2,
  "items": [
    {
      "id": "...",
      "employeeId": "emp_1",
      "type": "SOLICITUD_ADMINISTRATIVA",
      "status": "PENDIENTE_GERENCIA_OPERACIONES",
      "workDate": "2026-07-20",
      "proposedStartTime": "...",
      "proposedEndTime": "...",
      "proposedMinutes": 180,
      "reasonOptionId": "...",
      "batchId": "batch_cuid",
      "payrollPeriod": "2026-07"
    }
  ]
}
```

**Transacción:** fallo en cualquier empleado → rollback total (409/400 según causa).

**Validaciones:**

- `tenantId` solo JWT.
- Empleados activos del tenant; sede activa; empleados asignables a la sede (regla a alinear con colaboradores/asistencia).
- `reasonOptionId` activo, `type=OVERTIME_REASON`, mismo tenant.
- Solicitante autorizado para `locationId`.
- Duplicado DB: misma ventana `(workDate, proposedStartTime, proposedEndTime)` con fila admin no eliminada y `status <> OBJETADA`.
- Solapamiento (task-03): otra admin pendiente/aprobada del mismo empleado/sede con ventana que intersecta (regla de aplicación).
- Ventana inválida / minutos &lt; 1.

List/detail/summary existentes deben **exponer `type`** (hoy el DTO no lo mapea).

### D8 — Integraciones

| Integración                        | Acción OS-606                                                     |
| ---------------------------------- | ----------------------------------------------------------------- |
| Bandeja `/asistencia/tiempo-extra` | CTA + modal create; columna origen/`type`                         |
| Tarjeta OS-551                     | Mostrar origen admin + estado                                     |
| NOM-07                             | Intersección; anti doble conteo (task-08)                         |
| Notificaciones                     | `OvertimeNotificationService.notifyLevelPending` al create (Ops)  |
| Postman                            | Carpeta CONN-04b (task-10)                                        |
| Seeds                              | Motivos + demo (task-05)                                          |
| Auditoría                          | MVP: `requestedByUserId` + approvals; sin `NovedadAuditLog` nuevo |

### D9 — Riesgo pending-salary — **cerrado Task-09**

**Causa raíz:** mapear `type === SOLICITUD_ADMINISTRATIVA` → `EXTRA_NOCTURNA_RATE` (0.75).

**Fix:** `computeApprovedOvertimeMoney` reutiliza NOM-07 (Task-08) + `classifyOvertimeSurcharge` + parámetros legales. `type` = origen únicamente. Admin sin marcación → 0. Variable average alineado. Sin tabla nueva de recargos.

### D10 — Migración (task-01) — implementada

**Nombre final:** `20260716235900_os606_admin_overtime_request`  
(renombrada desde `20260716250000…` — hora `25` inválida en `YYYYMMDDHHMMSS`)

#### Campos nuevos en `OvertimeRequest`

| Campo               | Tipo                   | Notas                         |
| ------------------- | ---------------------- | ----------------------------- |
| `workDate`          | `DateTime?` `@db.Date` | Obligatorio en app para admin |
| `proposedStartTime` | `DateTime?`            | Admin                         |
| `proposedEndTime`   | `DateTime?`            | Admin                         |
| `proposedMinutes`   | `Int?`                 | Admin                         |
| `reasonOptionId`    | `String?`              | FK `EmployeeCatalogOption`    |
| `requestedByUserId` | `String?`              | FK `User`                     |
| `batchId`           | `String?`              | Trazabilidad                  |

#### Campos detección nullable

- `shiftEndTime` → `DateTime?`
- `actualEndTime` → `DateTime?`
- `accumulatedMinutes` → `Int?`

Filas existentes `DETECCION_AUTOMATICA` conservan valores (backfill no null).

#### Enum

```prisma
enum EmployeeCatalogType {
  // ...existentes
  OVERTIME_REASON
}
```

#### Unique / índices parciales (solo SQL; Prisma no los declara)

1. **Detección** — `overtime_requests_auto_period_active_key`  
   `(tenantId, employeeId, locationId, payrollPeriod)`  
   `WHERE type = 'DETECCION_AUTOMATICA' AND deletedAt IS NULL`

2. **Admin** — `overtime_requests_admin_window_active_key`  
   `(tenantId, employeeId, locationId, workDate, proposedStartTime, proposedEndTime, type)`  
   `WHERE type = 'SOLICITUD_ADMINISTRATIVA' AND deletedAt IS NULL AND status <> 'OBJETADA'`

**Política OBJETADA (cerrada a nivel DB):** una fila `OBJETADA` **no** participa del unique → permite re-solicitud de la misma ventana sin soft-delete.  
`reasonOptionId` **no** entra en la identidad (cambiar motivo ≠ solicitud distinta si la ventana es igual).  
Varias ventanas distintas el mismo `workDate` están permitidas.

**Task-03 (aplicación) sigue validando:** solapes de ventanas entre pendientes/aprobadas; reglas de negocio adicionales de reenvío si producto las pide.

Índices adicionales: `(tenantId, batchId)`, `(tenantId, type, status)`, `(tenantId, workDate)`, FKs `reasonOptionId` / `requestedByUserId`.

#### Compatibilidad

- Detección sigue creando/actualizando solo `DETECCION_AUTOMATICA` con campos de turno/acumulado.
- Create admin escribe campos propuestos + null en campos de detección.
- Interfaces CONN-04a tipan `shiftEndTime` / `actualEndTime` / `accumulatedMinutes` como nullable y no coerción a 0.

---

## Backend (resumen — final)

- Módulo `overtime` extendido (`OvertimeAdminCreateService`).
- `POST /attendance/overtime-requests/administrative` + permiso create.
- Approve/object/list reutilizados; responses con `type` y campos admin.
- Multi-tenant: `tenantId` JWT.

---

## Frontend (resumen — final)

- `OvertimeInboxScreen` + `AdministrativeOvertimeRequestModal`.
- Columna origen; tarjeta OS-551 origen/estado.
- Catálogos en `/payroll/catalogs` (Task-06A).
- Sin ruta paralela de HE.

---

## Seeds (final)

- Upsert 3 motivos `OVERTIME_REASON` tenant demo.
- Demo `SOLICITUD_ADMINISTRATIVA` (APROBADA sin marcación → liquidación 0).
- Permiso `attendance.overtime.request` solo MANAGER (+ ALL roles con control cargo/sede).

---

## Postman (final)

- Carpeta **`OS-606 / CONN-04b — Solicitud administrativa de extensión`**.
- Create multi-empleado, cascada Ops→GG, object en Ops, card, NOM-07.
- Tokens `accessTokenOvertimeOps` / `accessTokenOvertimeGG` de CONN-04a.

---

## Dependencias

```
CONN-04a (en develop) ──► CONN-04b (este epic) ✅
OS-551 tarjeta ─────────► origen/estado ✅
NOM-07 / OS-586 ────────► intersección Task-08 ✅
```

---

## Limitaciones

- Notificaciones = stub Logger (igual CONN-04a).
- Position IDs hardcodeados PDL.
- Catálogo `OVERTIME_REASON` editable vía CRUD reutilizado de `EmployeeCatalogOption` (Task-06A / `/payroll/catalogs`).
- App móvil fuera de alcance.

---

## Pendientes de producto (bloqueos explícitos)

| ID  | Pregunta                                                                                                                                                                     | Bloquea                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| P1  | ~~Sin marcación → 0~~ **Cerrado Task-08**                                                                                                                                    | —                                                                       |
| P2  | ~~Parcial → intersección~~ **Cerrado Task-08**                                                                                                                               | —                                                                       |
| P3  | ~~Auto+admin sin doble conteo (unión de intervalos)~~ **Cerrado Task-08**                                                                                                    | —                                                                       |
| P4  | ¿`NOMINA` puede crear?                                                                                                                                                       | **Cerrado:** no — seed/matrix solo MANAGER; BE exige cargo Admin + sede |
| P5  | ~~Tras `OBJETADA`, re-solicitud~~ **Cerrado (DB):** unique admin excluye `OBJETADA` → re-solicitud misma ventana permitida. Task-03 valida solapes con pendientes/aprobadas. | —                                                                       |

---

## Riesgos

1. Unique mensual actual impide varias solicitudes admin en el mes → migración obligatoria.
2. ~~Gate NOM-07 ignora admin~~ mitigado Task-08 (intersección + unión).
3. ~~Doble conteo auto+admin~~ mitigado Task-08 (`merge` de intervalos autorizados).
4. ~~`pending-salary` 75% por tipo admin~~ mitigado Task-09 (NOM-07 + classifyOvertimeSurcharge).
5. UI/API paralelas si no se extiende la bandeja existente.
6. Aprobación agrupada por lote (prohibida) rompería objeción parcial.

---

## Relación con CONN-04a / OS-551 / NOM-07

| Epic     | Qué se reutiliza                                                  | Qué no se toca                                        |
| -------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| CONN-04a | Modelos, cascada Ops/GG, bandeja, notify stub, constants de cargo | Detección, umbral 30 min, estado inicial Admin        |
| OS-551   | Tarjeta + indicador                                               | Marcación manual                                      |
| NOM-07   | Reports gate / overtime entries                                   | Motor legal OS-586 tarifas (salvo pending-salary fix) |

---

## Criterios de aceptación (epic)

- [x] Payload multi-empleado crea N solicitudes `SOLICITUD_ADMINISTRATIVA` en tx atómica con `batchId` compartido.
- [x] Estado inicial `PENDIENTE_GERENCIA_OPERACIONES`; no requiere approve de Administrador.
- [x] Objeción en Ops deja otras solicitudes del mismo batch intactas.
- [x] Ventana modelada con `workDate` / `proposed*` (no abuso de `shiftEndTime`/`actualEndTime`).
- [x] Motivo vía FK a `EmployeeCatalogOption` `OVERTIME_REASON`.
- [x] Create exige permiso nuevo + cargo Admin + sede.
- [x] Bandeja existente permite crear y muestra origen.
- [x] Tarjeta muestra type/origen y estado.
- [x] NOM-07 no paga minutos no autorizados ni doble cuenta (Task-08 / P1–P3).
- [x] pending-salary no trata admin como nocturno 75% (Task-09).
- [x] Seeds motivos + Postman (Task-05 / Task-10).
- [x] Multi-tenant y soft-delete respetados.

---

## Subtareas (SDD)

| #   | Archivo                                                                                  | Descripción                                                     |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 01  | [task-01-schema-migration.md](./task-01-schema-migration.md)                             | Schema + migración propuesta                                    |
| 02  | [task-02-interfaces-repository.md](./task-02-interfaces-repository.md)                   | Contratos + repo create/batch                                   |
| 03  | [task-03-admin-create-service.md](./task-03-admin-create-service.md)                     | Servicio create + validaciones + notify                         |
| 04  | [task-04-api-permissions.md](./task-04-api-permissions.md)                               | POST endpoint, DTOs, permiso                                    |
| 05  | [task-05-seeds.md](./task-05-seeds.md)                                                   | Motivos + permiso + demo                                        |
| 06A | [task-06a-overtime-reason-catalog-admin.md](./task-06a-overtime-reason-catalog-admin.md) | CRUD editable OVERTIME_REASON (reutiliza EmployeeCatalogOption) |
| 06  | [task-06-frontend-admin-request.md](./task-06-frontend-admin-request.md)                 | Modal create en bandeja                                         |
| 07  | [task-07-attendance-card-origin.md](./task-07-attendance-card-origin.md)                 | Origen/estado en OS-551                                         |
| 08  | [task-08-payroll-liquidation.md](./task-08-payroll-liquidation.md)                       | Intersección NOM-07                                             |
| 09  | [task-09-pending-salary-fix.md](./task-09-pending-salary-fix.md)                         | Quitar mapa tipo→75%                                            |
| 10  | [task-10-tests-postman-validation.md](./task-10-tests-postman-validation.md)             | Tests + Postman                                                 |

---

## Fuera de alcance (epic)

- Reimplementar CONN-04a / detección.
- Resolver hardcode de position IDs.
- Email/push.
- App móvil.
- Tabla nueva de recargos.
- Generar migración en Fase 0.
