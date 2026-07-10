# NOM-14 — Novedades de nómina (ausencias, permisos y licencias)

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[STORAGE]` `[NOTIFICATIONS]`  
**Status:** `pending`  
**Created:** 2026-07-10  
**Jira:** `NOM-14` (asignar issue en Jira)  
**Módulo NestJS propuesto:** `apps/api/src/payroll-novedades/` (nuevo, estructura estándar) + integración en `apps/api/src/reports/` y `apps/api/src/payroll/`  
**UI:** `apps/web-app/src/features/payroll/**` — opción de menú **Novedades** (NOM-14), audiencia RRHH (`NOMINA`) y supervisores (`SUPERVISOR` / `MANAGER`)

---

## Nota de alcance

Esta historia es una **opción independiente** dentro del menú del módulo de Nómina, con su propio listado de novedades, campos de fecha y soporte digitalizado. **No depende ni reabre** otras historias de Reportes/Asistencia previamente cerradas.

El registro de la novedad vive aquí, pero la **solicitud se origina desde la app del empleado** (ver **CONN-07**). RRHH pasa a tener un rol de **aprobación**, no de captura desde cero, salvo cuando registra una novedad en nombre del empleado.

> **Separación de dominios:** NOM-13 cubre **incapacidades médicas** (EPS/ARL). NOM-14 cubre **ausencias, permisos y licencias legales/discrecionales**. No mezclar modelos ni pantallas.

---

## Objetivo

Permitir el ciclo completo de **novedades de nómina** (ausencia injustificada, permisos, licencias remuneradas y no remuneradas, licencias legales obligatorias) con:

- Flujo de aprobación **configurable por tipo** (`requiresSupervisorApproval` por tenant).
- Bandeja de RRHH para resolver solicitudes ya validadas (o que van directo a RRHH).
- Soporte digitalizado obligatorio cuando el tipo lo exige.
- Integración con el **motor de liquidación** (OS-380): novedades `APROBADA` afectan devengos/descuentos del período.
- Notificaciones al supervisor y al empleado ante cambios de estado.

---

## Historia de usuario

**Como** empleado, quiero solicitar una novedad (ausencia, licencia, permiso) y que pase por la validación de mi supervisor cuando corresponda antes de llegar a RRHH, para no depender de gestionarlo por fuera del sistema.

**Como** RRHH, quiero una bandeja de aprobación con el listado de novedades, fechas y soporte digitalizado, para resolver solicitudes ya validadas en vez de capturarlas desde cero.

---

## Contexto legal (MVP Colombia)

Existen licencias remuneradas obligatorias además de vacaciones (NOM-10 / OS-589) e incapacidad (NOM-13):

| Tipo (enum)              | Naturaleza MVP                                      |
| ------------------------ | --------------------------------------------------- |
| `LICENCIA_LUTO`          | Derecho legal — directo a RRHH                      |
| `LICENCIA_PATERNIDAD`    | Derecho legal — directo a RRHH                      |
| `LICENCIA_MATERNIDAD`    | Derecho legal — directo a RRHH                      |
| `CALAMIDAD_DOMESTICA`    | Derecho legal — directo a RRHH                      |
| `DIA_FAMILIA`            | Derecho legal — directo a RRHH                      |
| `PERMISO_REMUNERADO`     | Discrecional — supervisor → RRHH                    |
| `LICENCIA_NO_REMUNERADA` | Discrecional — supervisor → RRHH                    |
| `AUSENCIA_INJUSTIFICADA` | Registro RRHH (descuento); no autoservicio empleado |

> Los defaults de `requiresSupervisorApproval` se **siembran por tenant** en `NovedadTypeConfig`, pero son **editables** — no hardcodear rutas de aprobación en código.

---

## ⭐ Puntos clave

### PC-1 — Ruta de aprobación configurable por tipo

Cada tipo tiene `NovedadTypeConfig.requiresSupervisorApproval` (por tenant):

- `PERMISO_REMUNERADO`, `LICENCIA_NO_REMUNERADA` → default `true` (supervisor → RRHH).
- Licencias legales (`LICENCIA_*`, `CALAMIDAD_DOMESTICA`, `DIA_FAMILIA`) → default `false` (directo a RRHH).
- `AUSENCIA_INJUSTIFICADA` → default `false`; solo RRHH registra (`requestedBy: RRHH`).

`NovedadesService.submit()` resuelve el estado inicial:

```
requiresSupervisorApproval && supervisor resoluble
  → PENDIENTE_SUPERVISOR
else
  → PENDIENTE_RRHH (+ warning si faltaba supervisor esperado)
```

### PC-2 — RRHH crea en nombre del empleado

Cuando `requestedBy === RRHH`, la novedad puede **saltarse** el paso de supervisor y quedar en `PENDIENTE_RRHH` o `APROBADA` según regla documentada en task 05 (MVP: `PENDIENTE_RRHH` para trazabilidad, o `APROBADA` si RRHH confirma en un solo paso — ver D4).

### PC-3 — Soporte obligatorio por configuración

`NovedadTypeConfig.requiresSupportDocument === true` → `BadRequestException` si no hay adjunto al guardar.

Reutilizar patrón storage R2 (`StorageObject`) de NOM-13 / vacaciones — **no** URL libre en texto.

### PC-4 — Liquidación del período (OS-380)

`PayrollLiquidationService` (extiende OS-380) consulta novedades en estado `APROBADA` que intersectan el período:

- `AUSENCIA_INJUSTIFICADA` → descuenta días/monto proporcional.
- Licencias/permisos **remunerados** (`isPaid === true`) → no descuenta salario ordinario.
- Licencias no remuneradas → descuento proporcional.

Prorrateo cuando la novedad **cruza dos períodos** (mismo patrón que NOM-13 D3).

### PC-5 — Solapamiento de fechas

No permitir guardar sin advertencia si existe otra novedad `APROBADA` o en curso (`PENDIENTE_*`, `SOLICITADA`) para el mismo empleado con fechas solapadas. MVP: **warning confirmable** en UI + flag `hasOverlapWarning` en API; bloqueo duro opcional en fase posterior.

---

## Modelo de datos (propuesto)

```prisma
enum NovedadType {
  AUSENCIA_INJUSTIFICADA
  LICENCIA_LUTO
  LICENCIA_PATERNIDAD
  LICENCIA_MATERNIDAD
  LICENCIA_NO_REMUNERADA
  PERMISO_REMUNERADO
  CALAMIDAD_DOMESTICA
  DIA_FAMILIA
}

enum RequestSource {
  EMPLEADO
  RRHH
}

enum NovedadStatus {
  SOLICITADA
  PENDIENTE_SUPERVISOR
  PENDIENTE_RRHH
  APROBADA
  RECHAZADA
}

model PayrollNovedad {
  id                     String         @id @default(cuid())
  tenantId               String
  employeeId             String
  type                   NovedadType
  startDate              DateTime       @db.Date
  endDate                DateTime       @db.Date
  isPaid                 Boolean
  linkedLeaveId          String?        // FK opcional a MedicalLeave u otro epic futuro
  supportStorageObjectId String?        // preferido sobre supportDocUrl plano (D3)
  notes                  String?
  requestedBy            RequestSource
  status                 NovedadStatus  @default(SOLICITADA)
  supervisorApproverId   String?        // User.id del supervisor que actuó
  supervisorDecisionAt   DateTime?
  supervisorComment      String?
  rrhhApproverId         String?
  rrhhDecisionAt         DateTime?
  rejectionReason        String?
  overlapWarningAck      Boolean        @default(false)
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @updatedAt
  deletedAt              DateTime?

  employee         EmployeeDetails @relation(fields: [employeeId], references: [id])
  supportDocument  StorageObject?  @relation(fields: [supportStorageObjectId], references: [id])

  @@index([tenantId])
  @@index([tenantId, employeeId])
  @@index([tenantId, status])
  @@index([tenantId, deletedAt])
  @@index([tenantId, startDate, endDate])
  @@index([tenantId, type])
  @@map("payroll_novedades")
}

model NovedadTypeConfig {
  id                         String      @id @default(cuid())
  tenantId                   String
  type                       NovedadType
  requiresSupervisorApproval Boolean     @default(false)
  requiresSupportDocument    Boolean     @default(false)
  isPaidDefault              Boolean     @default(true)  // default para isPaid al crear
  createdAt                  DateTime    @default(now())
  updatedAt                  DateTime    @updatedAt

  @@unique([tenantId, type])
  @@index([tenantId])
  @@map("novedad_type_configs")
}
```

---

## Decisiones de diseño

### D1 — Resolución del supervisor (⚠️ conflicto con spec original)

La spec de producto menciona `EmployeeDetails.supervisorId`. **En el codebase actual ese campo no existe** — decisión OS-550 / OS-589: la jerarquía es **Cargo → Cargo supervisor** (`EmployeePositionSupervisor`) + scoping de **sede** (`UserLocation`).

**Decisión MVP NOM-14:** reutilizar el mismo algoritmo que `VacationsService.approveLevel1` (OS-589 D9):

1. Resolver supervisores candidatos: usuarios con rol `SUPERVISOR`/`MANAGER` en la sede del empleado.
2. Filtrar por jerarquía de cargo: el cargo del solicitante debe estar en el subárbol del cargo del supervisor.
3. Si hay **exactamente un** supervisor resoluble → asignar notificación a ese usuario.
4. Si hay **cero** supervisores → estado inicial `PENDIENTE_RRHH` + `warnings: ['NO_SUPERVISOR_ASSIGNED']` (no bloquear).
5. Si hay **múltiples** → notificar a todos los candidatos; el primero que apruebe/rechace cierra el paso supervisor (documentar en task 05).

> Si producto confirma `EmployeeDetails.supervisorId` persona-a-persona, abrir subtarea de schema aparte — **fuera de alcance** de task 01 salvo decisión explícita.

### D2 — Máquina de estados

```
submit (EMPLEADO)
  → PENDIENTE_SUPERVISOR | PENDIENTE_RRHH

submit (RRHH) — puede omitir supervisor
  → PENDIENTE_RRHH | APROBADA (ver D4)

PENDIENTE_SUPERVISOR
  → approveBySupervisor → PENDIENTE_RRHH
  → rejectBySupervisor → RECHAZADA (+ rejectionReason)

PENDIENTE_RRHH
  → approveByRRHH → APROBADA
  → rejectByRRHH → RECHAZADA (+ rejectionReason)

RECHAZADA / APROBADA → terminales
```

`SOLICITADA` se usa solo como default transitorio al persistir antes de resolver ruta; el service debe normalizar al estado operativo en la misma transacción.

### D3 — Storage del soporte

Usar `supportStorageObjectId` FK a `StorageObject` (alineado con NOM-13 D1 y vacaciones). Presigned URL al ver/descargar.

### D4 — Registro directo RRHH

Cuando RRHH crea la novedad:

- Si `input.autoApprove === true` (solo RRHH) → `APROBADA` con `rrhhApproverId` = actor.
- Si no → `PENDIENTE_RRHH` sin paso supervisor (ignora `requiresSupervisorApproval`).

`AUSENCIA_INJUSTIFICADA` solo permitida con `requestedBy: RRHH`.

### D5 — Permisos y visibilidad

| Actor        | Ve / actúa                                                                  |
| ------------ | --------------------------------------------------------------------------- |
| `NOMINA`     | Bandeja `PENDIENTE_RRHH`, histórico completo, crear en nombre del empleado  |
| `SUPERVISOR` | Solo solicitudes `PENDIENTE_SUPERVISOR` de empleados que puede aprobar (D1) |
| `MANAGER`    | Igual que supervisor                                                        |
| Empleado     | CONN-07 — fuera de alcance web-app RRHH en este epic                        |

Permisos sugeridos: `payroll-novedades.read`, `payroll-novedades.approve.supervisor`, `payroll-novedades.approve.rrhh`, `payroll-novedades.write`.

### D6 — Ubicación en frontend

- Ruta: `/payroll/novedades` (NOM-14).
- NOM-13 permanece en `/payroll/novedades/incapacidades` (hermano, no tab).
- Pantalla con **dos pestañas**:
  1. **Bandeja de aprobación** — `PENDIENTE_RRHH` (+ supervisor ve su bandeja en la misma ruta con filtro por rol).
  2. **Listado histórico** — todos los estados; filtros: empleado, tipo, sede, rango de fechas.
- Entrada en `navigation.ts` bajo Nómina → **Novedades** (icono `ClipboardList` o similar).

### D7 — Configuración por tenant

`NovedadTypeConfig` editable vía API REST (task 09). UI de edición en MVP: modal simple en pantalla Novedades o enlace desde Parámetros legales — implementar en task 10 mínimo (lectura + edición básica).

Seed idempotente en migración o script: defaults según tabla de contexto legal.

### D8 — Notificaciones MVP

In-app (tabla `Notification` existente si aplica) o evento interno:

- Supervisor: nueva solicitud `PENDIENTE_SUPERVISOR`.
- Empleado: transición a `APROBADA`, `RECHAZADA`, o `PENDIENTE_RRHH` (supervisor aprobó).

Email/push → fuera de alcance MVP (igual que vacaciones).

### D9 — Integración asistencia

Las novedades `APROBADA` de tipos justificados **no deben contarse como ausencia** en reportes de asistencia — integración en epic separado o follow-up. Documentar hook en repository para rangos aprobados (patrón vacaciones task 07).

---

## Criterios de aceptación (epic)

- [ ] Existe opción de menú **Novedades** visible dentro del módulo de Nómina, como sección independiente.
- [ ] Una solicitud `PERMISO_REMUNERADO` **no llega** a la bandeja de RRHH hasta que el supervisor la aprueba.
- [ ] Una solicitud `LICENCIA_MATERNIDAD` llega **directo a RRHH** sin pasar por supervisor (con config default).
- [ ] El supervisor solo ve solicitudes de empleados que puede aprobar (D1 / D5).
- [ ] Un rechazo (supervisor o RRHH) detiene el flujo y notifica al empleado con el **motivo obligatorio**.
- [ ] `NovedadTypeConfig` es editable por tenant, no lista fija en código.
- [ ] Los tipos que requieren soporte **bloquean** el guardado si no se adjunta documento.
- [ ] Todas las novedades `APROBADA` quedan disponibles para el motor de liquidación OS-380.
- [ ] No se permiten novedades con fechas solapadas para el mismo empleado **sin advertencia** (PC-5).
- [ ] Tests: tipo configurado para supervisor pero empleado sin supervisor resoluble → cae a RRHH con alerta, **no bloquea**.
- [ ] Tests: novedad que empieza en un período y termina en el siguiente (prorrateo liquidación).
- [ ] Multi-tenant: nunca filtrar sin `tenantId`; soft delete con `deletedAt`.

---

## Subtareas (SDD)

> Implementar **una a la vez**. Cada archivo incluye Goal / Scope / Out of scope / Files allowed / Forbidden / Acceptance / Validation.

| #   | Archivo                                                                                    | Descripción                                                        |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 01  | [task-01-schema-migration.md](./task-01-schema-migration.md)                               | Enums, `PayrollNovedad`, `NovedadTypeConfig`, migración, seed      |
| 02  | [task-02-interfaces.md](./task-02-interfaces.md)                                           | Contratos TS repository/service                                    |
| 03  | [task-03-repository.md](./task-03-repository.md)                                           | Prisma: CRUD, listados, overlap query, período liquidación         |
| 04  | [task-04-type-config-service.md](./task-04-type-config-service.md)                         | Seed defaults + `NovedadTypeConfigService` (lectura/actualización) |
| 05  | [task-05-novedades-service.md](./task-05-novedades-service.md)                             | Submit, aprobaciones supervisor/RRHH, máquina de estados           |
| 06  | [task-06-storage-support-doc.md](./task-06-storage-support-doc.md)                         | Upload/descarga soporte (R2 / StorageObject)                       |
| 07  | [task-07-payroll-liquidation-integration.md](./task-07-payroll-liquidation-integration.md) | Integración OS-380: descuentos y días pagados/no pagados           |
| 08  | [task-08-notifications.md](./task-08-notifications.md)                                     | Notificaciones supervisor y empleado                               |
| 09  | [task-09-api-endpoints-dtos.md](./task-09-api-endpoints-dtos.md)                           | Controller REST + DTOs Swagger                                     |
| 10  | [task-10-frontend-novedades.md](./task-10-frontend-novedades.md)                           | Menú, pestañas bandeja/histórico, formularios, RBAC                |
| 11  | [task-11-tests-validation.md](./task-11-tests-validation.md)                               | Tests integración, casos legales, validación final                 |

**Orden de implementación:**

```
01 → 02 → 03 → 04
              ↓
05 → 06 → 07 → 08 → 09 → 10 → 11
```

---

## Fuera de alcance (epic)

- UI de solicitud en **app empleado** (CONN-07) — solo contrato API `requestedBy: EMPLEADO`.
- Incapacidades médicas (NOM-13).
- Vacaciones (OS-589 / NOM-10).
- Integración asistencia en tiempo real (D9 — hook documentado, implementación follow-up).
- `EmployeeDetails.supervisorId` nuevo campo (salvo decisión producto explícita).
- Firma electrónica del soporte.
- Backfill/importación CSV de novedades históricas.
- Notificaciones email/push.

---

## Dependencias

- **Depende de:** OS-380 (motor liquidación), NOM-13 (convenciones storage/soporte), NOM-10 / OS-589 (vacaciones — no solapar dominio), OS-377 (empleados), OS-379 (nómina base), storage R2 (`StorageObject`).
- **Relacionado con:** CONN-07 (origen solicitud empleado), OS-550 (jerarquía supervisor).
- **Bloquea:** cierre legal completo del módulo Novedades de nómina.

---

## Preguntas abiertas

- **Q1:** ¿Confirmar jerarquía por **cargo** (D1) o agregar `EmployeeDetails.supervisorId` persona-a-persona?
- **Q2:** ¿Múltiples supervisores candidatos — primer respondiente gana o asignación explícita?
- **Q3:** ¿Solapamiento con **vacaciones** e **incapacidades** aprobadas debe bloquear o solo advertir?
- **Q4:** ¿RRHH al crear en nombre del empleado queda `APROBADA` automáticamente o pasa por `PENDIENTE_RRHH`?
- **Q5:** ¿`isPaid` lo define el tipo en config, el usuario al crear, o ambos (default + override RRHH)?
