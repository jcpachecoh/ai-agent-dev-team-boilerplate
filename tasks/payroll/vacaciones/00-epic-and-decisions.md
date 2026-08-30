# OS-589 — Vacaciones (CST Art. 186 y siguientes)

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[ATTENDANCE]` `[PDF]`
**Status:** `pending`
**Created:** 2026-07-08
**Jira:** `OS-589`
**Módulo NestJS propuesto:** `apps/api/src/vacations/` (nuevo, estructura estándar) + integraciones en `apps/api/src/payroll/` y `apps/api/src/attendance/`
**UI:** `apps/web-app/src/features/my-profile/**` (módulo **Mi perfil** — autoservicio: personal, vacaciones, dotación) + `apps/web-app/src/features/payroll/**` (bandeja de aprobación de vacaciones). **No** en Perfil de Empleado RRHH (OS-535).

---

## Objetivo

Permitir la gestión completa de **vacaciones** según el Código Sustantivo del Trabajo (CST):

- Que el empleado consulte sus **días acumulados, disfrutados y compensados**.
- Que el empleado **solicite** vacaciones (disfrute o compensación).
- Que la solicitud pase por un **doble filtro de aprobación** antes de quedar aprobada.
- Que RRHH registre el disfrute/compensación y el sistema **genere la carta formal en PDF** (aprobación o negación) con datos del empleado y membrete de la empresa.
- Que las vacaciones aprobadas se reflejen correctamente en **asistencia** (sin contarse como ausencia y bloqueando marcación) y en la **liquidación de nómina** (compensación en dinero).

---

## Historia de usuario

**Como** empleado, quiero ver mis días de vacaciones acumulados y disfrutados,
**y como** RRHH quiero registrar el disfrute/compensación y generar la carta formal correspondiente,
**para** cumplir el CST (Art. 186 y siguientes).

---

## Contexto legal

- **15 días hábiles** de vacaciones por año trabajado.
- **Acumulación proporcional: 1.25 días por mes calendario completo** trabajado (15 ÷ 12).
- El derecho **arranca en `EmployeeDetails.hireDate`** (fecha de ingreso): no se acumula antes de esa fecha.
- Mes **parcial** (ingreso a mitad de mes): prorrateo **proporcional por días calendario** trabajados en ese mes.
- Se puede **compensar en dinero hasta la mitad** (máx. 50%); el resto **debe disfrutarse**.

---

## ⭐ Puntos clave (requisitos destacados)

> Estos dos puntos son requisitos explícitos y no negociables de este epic.

### PC-1 — Los días de vacaciones NO se cuentan como ausencia

Los días cubiertos por una solicitud de **DISFRUTE aprobada** **no deben computarse como ausencia** en:

- El monitor y reportes de asistencia (KPIs de asistentes/ausentes/tarde).
- La tabla de colaboradores del módulo de asistencia.
- Cualquier cálculo de asistencia que alimente nómina.

En el rango aprobado, el día debe representarse con un estado propio (p. ej. **`VACACIONES`**) tratado como **ausencia justificada / no computable**, nunca como `AUSENTE`.

### PC-2 — Doble filtro de aprobación

La solicitud de vacaciones atraviesa **dos filtros** antes de quedar `APROBADA`:

1. **El empleado solicita** las vacaciones (`SOLICITADA`).
2. **Primer filtro:** aprobación por cargo de **Supervisor**.
3. **Segundo filtro:** aprobación por **Recursos Humanos** (rol `NOMINA` / permiso `vacations.approve.level2`).

Solo cuando **ambos** filtros aprueban, la solicitud pasa a `APROBADA` y se genera la carta de aprobación. Un rechazo en **cualquiera** de los dos niveles la manda a `RECHAZADA` y genera la carta de negación.

**Nivel 1 (Supervisor)** valida **sede + jerarquía de cargo** (OS-550): el aprobador debe tener rol `SUPERVISOR`/`MANAGER`, compartir sede con el solicitante vía `UserLocation`, y el cargo del solicitante debe estar en el subárbol de cargos subordinados al cargo del supervisor (`EmployeePositionSupervisor`). Ver decisión **D9**.

**Nivel 2 (RRHH)** valida solo rol `NOMINA` — no usa jerarquía de cargo.

---

## Decisiones de diseño

### D1 — Flujo de estados con doble aprobación (PC-2)

El enum `VacationStatus` provisto (`SOLICITADA`, `APROBADA`, `RECHAZADA`) es insuficiente para representar la aprobación intermedia. Se propone:

```
SOLICITADA
  → APROBADA_NIVEL_1   (aprobó Supervisor; falta segundo filtro)
      → APROBADA        (aprobó segundo cargo → carta de aprobación)
      → RECHAZADA       (rechazó segundo cargo → carta de negación)
  → RECHAZADA           (rechazó Supervisor → carta de negación)
```

Y campos de trazabilidad por nivel en `VacationRequest`:

- `level1ApprovedBy` / `level1ActedAt`
- `level2ApprovedBy` / `level2ActedAt`
- `rejectionReason` (obligatorio al rechazar)

> Alternativa: tabla `VacationApproval` (una fila por nivel). Para el MVP se prefiere columnas por nivel; documentar en subtarea de schema.

### D9 — Aprobación nivel 1: sede + jerarquía de cargo (OS-550)

Reutilizar el organigrama ya existente (`EmployeePositionSupervisor`). **No** usar `EmployeeDetails.supervisorId` (no existe por decisión de producto).

| Validación         | Fuente en codebase                                       | Regla                                                                                    |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Rol supervisor     | `User.role` → `SUPERVISOR` o `MANAGER`                   | `ForbiddenException` si no                                                               |
| Misma sede         | `UserLocation` del actor ∩ sede del empleado solicitante | Debe haber intersección                                                                  |
| Jerarquía de cargo | `EmployeePositionSupervisor` + BFS transitivo            | El `positionId` del solicitante debe estar en el subárbol del `positionId` del aprobador |

**Fallback jerarquía:** si el supervisor **no tiene** `positionId`, o su cargo **no tiene** filas en `EmployeePositionSupervisor`, solo se valida **sede + rol** (mismo fallback que OS-550 en colaboradores — no bloquear aprobación por falta de organigrama configurado).

**Referencia de implementación:** `AttendanceCollaboratorsService.resolveEffectiveScope` + `AttendanceCollaboratorsRepository.findSubordinatePositionIds` (copiar patrón al módulo `vacations`, no acoplar imports desde `attendance` si genera dependencia circular — extraer query al `VacationsRepository`).

**Nivel 2 (RRHH):** solo rol `NOMINA` / `vacations.approve.level2`. Sin validación de sede ni jerarquía.

### D10 — Mi perfil vs Perfil de Empleado (OS-535)

| Superficie                      | Ruta                             | Audiencia                            | Contenido vacaciones                                                  |
| ------------------------------- | -------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| **Mi perfil** (nuevo)           | `/mi-perfil`                     | Empleado autenticado (autoservicio)  | Saldo, solicitar, historial propio, dotación propia, datos personales |
| **Perfil de Empleado** (OS-535) | `/payroll/employees/:id/profile` | RRHH / supervisores (administrativo) | **Sin** vacaciones — solo gestión administrativa del colaborador      |
| **Aprobación vacaciones**       | `/payroll/vacations`             | Supervisor (L1) + RRHH (L2)          | Bandeja, calendario por sede, aprobar/rechazar                        |

**Convención visual:** reutilizar componentes `EmpleadoPage`, `EmpleadoListToolbar`, `EmpleadoTable` de `@restopsiq/ui`; filtros y botones `size="md"` **fuera** de las tablas (mismo patrón que Empleados y Colaboradores).

### D2 — Vacaciones no cuentan como ausencia (PC-1)

- El módulo de asistencia consulta los **rangos de DISFRUTE aprobado** por empleado/fecha.
- Se introduce/usa un estado de asistencia **`VACACIONES`** (justificada, no computable como ausencia).
- El cálculo de asistencia debe excluir esos días del conteo de ausencias y no penalizar KPIs.
- **Dependencia inversa:** requiere que asistencia pueda "leer" vacaciones aprobadas (servicio compartido o consulta directa por rango + tenant).

### D3 — Acumulación mensual automática (1.25 días, proporcional a `hireDate`)

- **Fuente de verdad:** `EmployeeDetails.hireDate`. El saldo acumulado refleja **meses calendario trabajados** desde el ingreso, no meses desde que existe el módulo.
- **Job mensual (BullMQ + Redis)** — día 1, 02:00 `America/Bogota` — que, por cada empleado **activo** del tenant, acredita el **mes calendario anterior** (y meses pendientes si el job estuvo caído).
- **Fórmula por mes de acumulación `M`** (helper puro, testeable):

  ```
  daysInMonth     = días calendario del mes M
  workStart       = max(hireDate (solo fecha), inicio de M)
  workEnd         = fin de M
  daysWorked      = días inclusivos entre workStart y workEnd
  monthAccrual    = 0 si workStart > workEnd (aún no ingresó en M)
                  = MONTHLY_ACCRUAL_DAYS × (daysWorked / daysInMonth) en otro caso
  ```

  - Ejemplo: ingreso 15-mar en mes de 31 días → `(17/31) × 1.25 ≈ 0.69` días.
  - Mes completo trabajado → `1.25` días exactos.
  - Redondeo: **2 decimales** (`Decimal(6,2)`), half-up.

- **`lastAccrualDate`:** guarda el **primer día del último mes calendario acreditado** (`YYYY-MM-01`), no `now()`. Idempotencia: no volver a acreditar un mes ya procesado.
- **Catch-up automático:** en cada corrida, procesar todos los meses desde `max(mes de hireDate, mes siguiente a lastAccrualDate)` hasta el **mes anterior al actual** (nunca el mes en curso, aún parcial).
- **Alta de empleado nuevo:** el primer job (o sync bajo demanda en `getBalance`, ver task 05) acumula desde `hireDate` sin backfill manual.
- Registrar log/auditoría de cada corrida (meses procesados, días acreditados por empleado).

### D4 — Validación de saldo y regla de compensación

- `requestVacation()` valida que `daysRequested <= saldoDisponible` (`accruedDays - takenDays - compensatedDays`) **antes** de permitir aprobación.
- **No se aprueba** una solicitud que exceda el saldo disponible.
- `COMPENSACION`: validar que la compensación acumulada **no supere el 50%** del derecho; el resto debe ser `DISFRUTE`.

### D5 — Carta PDF en aprobación y negación (obligatorio)

- Al **aprobar** o **rechazar** se genera **automáticamente** una **carta PDF** (dos plantillas: aprobación / negación) con:
  - Datos del empleado (nombre, cédula, cargo, sede, fechas del rango, días).
  - **Membrete / logo** de la empresa (tenant).
  - Espacio para firma.
- **Reutilizar patrón existente** de PDF: `ReportPdfService` (pdfkit) en `apps/api/src/reports/`.
- **Almacenamiento:** guardar el PDF vía **módulo de storage** existente y referenciar por `letterStorageObjectId`; servir por **URL prefirmada** (patrón usado en `MobileAttendanceService.misDatosFaciales`). Ajustar el campo `letterUrl` del schema provisto a `letterStorageObjectId` (ver subtarea de schema).

### D6 — DISFRUTE aprobado bloquea marcación de asistencia

- En el rango de un `DISFRUTE` **APROBADO**, la marcación (kiosko / app móvil) debe **rechazarse/bloquearse** con mensaje claro.
- Complementa PC-1: además de no contar como ausencia, no permite registrar entradas/salidas.

### D7 — Multi-tenant, soft delete y convenciones Prisma

- Todos los modelos con `tenantId` + índices (`@@index([tenantId, ...])`), `@@map` en snake_case, `Decimal` para días.
- **Soft delete:** alinear con la convención del repo (regla: entidades de negocio usan `isActive: false`; solo `User` usa `deletedAt`). El schema provisto usa `deletedAt` en `VacationRequest` → **decidir en subtarea de schema** (recomendado `isActive` salvo requerimiento de auditoría explícito).
- Agregar `createdAt` / `updatedAt` faltantes.

### D8 — Integración con liquidación de nómina

La **compensación en dinero** aprobada debe reflejarse en la **siguiente liquidación** de nómina del empleado.

**Motor de liquidación actual (codebase):** no existe un módulo aparte que “corra” y guarde liquidaciones en BD. Hoy la liquidación es **on-the-fly** al generar el reporte de nómina:

1. `ReportsService.getPayrollReport()` — orquesta el periodo (`YYYY-MM`).
2. Por cada empleado activo: arma asistencia del mes y llama a `PayrollCalculationService.calculateEmployeePeriod()`.
3. El cálculo produce devengos: `salaryBase + transportSubsidy + overtimePay` → `grossPay` → deducciones → `netPay`.

**Punto de integración propuesto (task 10):**

- Al aprobar `COMPENSACION`, registrar un ítem pendiente (tabla o flag en vacaciones).
- En `getPayrollReport` / `calculateEmployeePeriod`, sumar `vacationCompensationPay` al `grossPay` del periodo siguiente a la aprobación.
- Archivos clave: `apps/api/src/reports/service/reports.service.ts`, `apps/api/src/payroll/service/payroll-calculation.service.ts`, `apps/api/src/payroll/interfaces/payroll-report.interfaces.ts`.

---

## Modelo de datos (base provista + refinamientos)

> El schema entregado es el punto de partida. Los refinamientos derivan de D1, D2, D5 y D7.

```prisma
model VacationBalance {
  id              String   @id @default(cuid())
  tenantId        String
  employeeId      String   @unique
  accruedDays     Decimal  @db.Decimal(6, 2)
  takenDays       Decimal  @db.Decimal(6, 2)
  compensatedDays Decimal  @db.Decimal(6, 2)
  lastAccrualDate DateTime   // primer día del último mes calendario acreditado (YYYY-MM-01)
  createdAt       DateTime @default(now())   // + refinamiento
  updatedAt       DateTime @updatedAt        // + refinamiento

  @@index([tenantId])                        // + refinamiento
  @@map("vacation_balances")                 // + refinamiento
}

model VacationRequest {
  id            String         @id @default(cuid())
  tenantId      String
  employeeId    String
  startDate     DateTime
  endDate       DateTime
  daysRequested Decimal        @db.Decimal(6, 2)
  type          VacationType   // DISFRUTE, COMPENSACION
  status        VacationStatus // ver D1 (con niveles)

  // Doble filtro de aprobación (PC-2 / D1)
  level1ApprovedBy String?
  level1ActedAt    DateTime?
  level2ApprovedBy String?
  level2ActedAt    DateTime?
  rejectionReason  String?

  // Carta PDF (D5) — preferir storage + presigned URL sobre URL cruda
  letterStorageObjectId String?

  createdAt DateTime @default(now())          // + refinamiento
  updatedAt DateTime @updatedAt               // + refinamiento
  deletedAt DateTime?                          // ver D7 (decidir isActive vs deletedAt)

  @@index([tenantId, employeeId])
  @@index([tenantId, status])
  @@map("vacation_requests")
}

enum VacationType {
  DISFRUTE
  COMPENSACION
}

enum VacationStatus {
  SOLICITADA
  APROBADA_NIVEL_1
  APROBADA
  RECHAZADA
}
```

---

## Backend (resumen)

- **Job mensual** (BullMQ): acredita días proporcionales a `hireDate` por mes calendario (D3, idempotente, catch-up desde ingreso).
- **`VacationService`:**
  - `requestVacation()` — crea `SOLICITADA`, valida saldo (D4) y regla de compensación.
  - `approveLevel1()` / `approveLevel2()` / `reject(level, reason)` — máquina de estados D1.
  - Al pasar a `APROBADA` o `RECHAZADA`: **genera la carta PDF** (D5) y la guarda en storage.
- **Carta PDF:** dos plantillas (aprobación / negación) con datos del empleado + membrete; reutiliza `ReportPdfService`.
- **Asistencia (D2 + D6):** exponer/consultar rangos de DISFRUTE aprobado para (a) no contar como ausencia y (b) bloquear marcación.
- **Nómina (D8):** reflejar compensación en la siguiente liquidación.
- Reglas transversales: `tenantId` en toda query, soft delete, sin `any`, excepciones NestJS tipadas.

---

## Frontend (resumen)

- **Módulo nuevo "Mi perfil"** (`/mi-perfil`): autoservicio del empleado — información personal, **vacaciones** (saldo + solicitud + historial), **dotación** (consulta propia). Misma estructura visual que listados de empleados (`EmpleadoPage`, toolbar con filtros/botones `md` fuera de tabla, `EmpleadoTable`).
- **Bandeja de aprobación** (`/payroll/vacations`): doble filtro Supervisor + RRHH, calendario por sede, descarga de carta.
- **No** incluir vacaciones en Perfil de Empleado RRHH (OS-535).
- Estados obligatorios: loading (skeleton), error (retry), empty.
- Apollo/hooks para queries/mutations (según convención del módulo).

---

## Criterios de aceptación (epic)

- [ ] **Acumulación mensual automática** proporcional a `hireDate` (1.25 × días trabajados / días del mes; idempotente; catch-up desde ingreso).
- [ ] **No se aprueba** una solicitud que exceda el **saldo disponible**.
- [ ] **PC-2:** la solicitud requiere **aprobación de Supervisor + un segundo cargo** antes de quedar `APROBADA`; un rechazo en cualquier nivel la manda a `RECHAZADA`.
- [ ] Al **aprobar o rechazar** se genera la **carta PDF** correspondiente (plantilla de aprobación / negación) lista para firma, con datos del empleado y membrete.
- [ ] **PC-1:** las vacaciones (DISFRUTE) aprobadas **no se cuentan como ausencia** en asistencia (KPIs/reportes/tabla).
- [ ] Las **vacaciones aprobadas bloquean la marcación** de asistencia en el rango.
- [ ] La **compensación en dinero** aprobada se refleja en la **siguiente liquidación** de nómina.
- [ ] El empleado puede **ver su saldo** y gestionar solicitudes en **Mi perfil** (`/mi-perfil`).
- [ ] Todo respeta **multi-tenant** (nunca `tenantId` desde el body/JWT del empleado para escalar privilegios).

---

## Subtareas (SDD)

> Se implementan **una a la vez**. Cada archivo incluye Goal / Scope / Out of scope / Files allowed / Files forbidden / Acceptance / Validation.

| #   | Archivo                                                                      | Descripción                                                                  |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 01  | [task-01-schema-migration.md](./task-01-schema-migration.md)                 | Modelos `VacationBalance`/`VacationRequest`, enums, refinamientos, migración |
| 02  | [task-02-interfaces.md](./task-02-interfaces.md)                             | Contratos TS (repository/service, DTOs de dominio)                           |
| 03  | [task-03-repository.md](./task-03-repository.md)                             | Acceso Prisma (saldo, solicitudes, rangos aprobados por fecha)               |
| 04  | [task-04-accrual-job.md](./task-04-accrual-job.md)                           | Job mensual BullMQ: acumulación proporcional a `hireDate` (idempotente)      |
| 05  | [task-05-request-approval-service.md](./task-05-request-approval-service.md) | `requestVacation` + máquina de estados de **doble aprobación** + saldo       |
| 06  | [task-06-letter-pdf.md](./task-06-letter-pdf.md)                             | Generación de carta PDF (aprobación/negación) + storage + presigned URL      |
| 07  | [task-07-attendance-integration.md](./task-07-attendance-integration.md)     | **No contar como ausencia** + **bloqueo de marcación** en rango DISFRUTE     |
| 08  | [task-08-api-endpoints-dtos.md](./task-08-api-endpoints-dtos.md)             | Controller/Resolver + DTOs (solicitud, aprobación por nivel, rechazo)        |
| 09  | [task-09-frontend-vacations.md](./task-09-frontend-vacations.md)             | **Mi perfil** (vacaciones + dotación + personal) + bandeja aprobación RRHH   |
| 10  | [task-10-payroll-compensation.md](./task-10-payroll-compensation.md)         | Reflejar compensación en la siguiente liquidación de nómina                  |
| 11  | [task-11-tests-validation.md](./task-11-tests-validation.md)                 | Tests BE/FE + criterios de aceptación + validación final                     |

**Orden de implementación:**

```
01 → 02 → 03 → 04
              ↓
05 → 06 → 07 → 08 → 09 → 10 → 11
```

---

## Fuera de alcance (epic)

- Políticas de vacaciones distintas al CST colombiano (otros países LATAM) — fase posterior.
- Backfill manual o importación CSV de saldos históricos (el catch-up automático desde `hireDate` **sí** está en alcance vía D3).
- Firma electrónica de la carta (solo se genera el PDF listo para firma manual).
- Aprobaciones vía email o notificaciones push (solo in-app en MVP).

---

## Preguntas abiertas

- ~~**Q1 (PC-2):** ¿Cuál es el **segundo cargo** que aprueba en el segundo filtro?~~ **Resuelto:** Recursos Humanos (rol `NOMINA`, permiso `vacations.approve.level2`).
- ~~**Q3 (D8):** ¿Punto exacto de integración con el motor de liquidación?~~ **Resuelto:** ver decisión **D8** — `getPayrollReport` + `calculateEmployeePeriod`; agregar línea `vacationCompensationPay` al `grossPay`.
- **Q2 (D7):** ¿`VacationRequest` usa `isActive` (convención del repo) o `deletedAt` (por auditoría)?
- **Q4 (D5):** ¿La plantilla/membrete es por tenant (multi-tenant branding) o único de Palos de Leña?
- **Q5:** ¿"días hábiles" excluye festivos colombianos y domingos en el cálculo de `daysRequested`? (calendario de días hábiles por sede).

---

## Dependencias

- **Depende de:** OS-377, OS-379.
- **Relacionado con:** OS-535 (perfil empleado RRHH — **sin** vacaciones; Mi perfil es módulo aparte).
- **Bloquea:** NOM-12, NOM-14, NOM-18.
