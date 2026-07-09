# NOM-13 — Incapacidades médicas (comunes y laborales)

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[STORAGE]`  
**Status:** `pending`  
**Created:** 2026-07-09  
**Jira:** `NOM-13` (asignar issue en Jira)  
**Módulo NestJS propuesto:** `apps/api/src/medical-leaves/` (nuevo, estructura estándar) + integración en `apps/api/src/reports/` y `apps/api/src/payroll/`  
**UI:** `apps/web-app/src/features/payroll/**` — módulo **Novedades** (NOM-13), audiencia RRHH (`NOMINA`)

---

## Objetivo

Permitir que RRHH registre **incapacidades médicas** de los empleados (origen **común** o **laboral**), con:

- Cálculo automático de la **división de días y montos** entre empleador, EPS (común) o ARL (laboral).
- **Adjunto** del documento médico (bucket R2).
- **Seguimiento de estado** de radicación/cobro ante EPS/ARL.
- **Integración con la liquidación** del período para no pagar salario ordinario en días cubiertos por EPS/ARL.
- **Alerta** cuando un empleado supera **180 días acumulados** de incapacidad en el año calendario.

---

## Historia de usuario

**Como** RRHH,  
**quiero** registrar las incapacidades médicas de los empleados (comunes y laborales)  
**y que** el sistema calcule automáticamente quién paga cada tramo (empleador, EPS o ARL),  
**para** cumplir la normativa colombiana y reflejar correctamente la liquidación de nómina del período.

---

## Contexto legal (MVP Colombia)

### Origen común (`COMUN`)

| Tramo (día calendario de la incapacidad) | Responsable | Porcentaje sobre base                           |
| ---------------------------------------- | ----------- | ----------------------------------------------- |
| Días 1–2                                 | Empleador   | 100%                                            |
| Días 3–90                                | EPS         | 66.67%                                          |
| Días 91–180                              | EPS         | 50%                                             |
| Después del día 180                      | —           | Fuera de alcance MVP (alerta + revisión manual) |

### Origen laboral (`LABORAL`)

| Tramo       | Responsable | Porcentaje |
| ----------- | ----------- | ---------- |
| Desde día 1 | ARL         | 100%       |

> **Base salarial MVP:** `EmployeeDetails.salaryAmount / 30` por día calendario (misma convención que vacaciones COMPENSACION en OS-589). Documentar en PR si el tenant usa otra base.

> **Días:** calendario inclusivo entre `startDate` y `endDate` (misma convención que vacaciones hasta definir calendario hábil).

---

## ⭐ Puntos clave

### PC-1 — División automática empleador / EPS / ARL

Al registrar o actualizar una incapacidad, `MedicalLeaveService.calculatePaymentSplit()` debe calcular y persistir:

- `totalDays`
- `employerPaidDays` / `epsArlPaidDays`
- `employerAmount` / `epsArlAmount?`

Sin intervención manual de RRHH en el reparto (RRHH solo ingresa origen, fechas y soporte).

### PC-2 — Liquidación del período (NOM-13)

Los días cubiertos por EPS/ARL **no deben recibir salario ordinario completo** en la liquidación del período:

- Días pagados por empleador → incluir en devengo ordinario según reglas del motor (`PayrollCalculationService`).
- Días EPS/ARL → **excluir** salario base ordinario; el monto EPS/ARL se refleja como concepto informativo / ajuste (no doble pago).

Integrar en el mismo punto que OS-589 task 10: `ReportsService.getPayrollReport` + `calculateEmployeePeriod`.

### PC-3 — Alerta 180 días acumulados

Si un empleado acumula **más de 180 días** de incapacidad (suma de `totalDays` de registros activos) en el **año calendario** de `startDate`, mostrar alerta en UI al registrar/consultar y exponer flag en API para consumo futuro.

### PC-4 — Soporte médico obligatorio en registro

Toda incapacidad nueva debe permitir adjuntar documento escaneado (PDF/imagen) almacenado en R2 vía `StorageObject` (patrón OS-562 / vacaciones carta PDF). **No** URL libre en texto sin storage auditado.

---

## Modelo de datos (propuesto)

```prisma
enum LeaveOrigin {
  COMUN
  LABORAL
}

enum LeaveStatus {
  REGISTRADA
  RADICADA_EPS
  RECOBRADA
  RECHAZADA
}

model MedicalLeave {
  id                    String       @id @default(cuid())
  tenantId              String
  employeeId            String
  origin                LeaveOrigin
  startDate             DateTime     @db.Date
  endDate               DateTime     @db.Date
  totalDays             Int
  employerPaidDays      Int
  epsArlPaidDays        Int
  epsArlAmount          Decimal?     @db.Decimal(12, 2)
  employerAmount        Decimal      @db.Decimal(12, 2)
  supportStorageObjectId String?     // FK StorageObject — preferido sobre supportDocUrl plano
  status                LeaveStatus  @default(REGISTRADA)
  radicatedAt           DateTime?
  recoveredAt           DateTime?
  rejectedAt            DateTime?
  rejectionReason       String?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
  deletedAt             DateTime?

  employee              EmployeeDetails @relation(fields: [employeeId], references: [id])
  supportDocument       StorageObject?  @relation(fields: [supportStorageObjectId], references: [id])

  @@index([tenantId])
  @@index([tenantId, employeeId])
  @@index([tenantId, status])
  @@index([tenantId, deletedAt])
  @@index([tenantId, startDate, endDate])
  @@map("medical_leaves")
}
```

> **Decisión D1:** usar `supportStorageObjectId` en lugar de `supportDocUrl` string suelto (alineado con `letterStorageObjectId` en vacaciones). La URL se obtiene vía presigned al vistar/descargar.

---

## Decisiones de diseño

### D2 — `calculatePaymentSplit(origin, startDate, endDate, dailySalary)`

Función pura en `medical-leave-payment.utils.ts`:

**COMUN** — para cada día `d` (1..totalDays) del evento:

- `d <= 2` → empleador 100%
- `3 <= d <= 90` → EPS 66.67%
- `91 <= d <= 180` → EPS 50%
- `d > 180` → no asignar a EPS en MVP; marcar en respuesta de validación/warning

**LABORAL** — todos los días → ARL 100%, empleador 0 días / 0 monto.

Retorno:

```typescript
interface PaymentSplitResult {
  totalDays: number;
  employerPaidDays: number;
  epsArlPaidDays: number;
  employerAmount: Decimal;
  epsArlAmount: Decimal;
  warnings?: string[]; // ej. supera 180 días en el evento
}
```

### D3 — Incapacidad que cruza dos períodos de nómina

Un mismo registro puede abarcar dos meses (`2026-07-28` → `2026-08-05`). La liquidación:

- Prorratea días por mes calendario al aplicar ajustes en `getPayrollReport(period)`.
- Query: incapacidades activas donde `startDate <= finMes` AND `endDate >= inicioMes`.
- Por cada día del mes, aplicar split y ajustar devengo.

### D4 — Estados y transiciones

```
REGISTRADA → RADICADA_EPS → RECOBRADA
REGISTRADA → RECHAZADA
RADICADA_EPS → RECHAZADA
```

- `RADICADA_EPS`: RRHH marcó radicación ante EPS/ARL (`radicatedAt`).
- `RECOBRADA`: cobro confirmado (`recoveredAt`).
- `RECHAZADA`: requiere `rejectionReason`.

### D5 — Multi-tenancy y permisos

- Todo query con `tenantId` del JWT.
- Crear/editar/radicar: rol `NOMINA` (o permiso `medical-leaves.write`).
- Consulta: `NOMINA`, `SUPERVISOR`, `MANAGER` (solo lectura en su sede — opcional MVP: solo `NOMINA`).

### D6 — Ubicación en frontend

Registro dentro del módulo **Novedades** de Nómina:

- Ruta propuesta: `/payroll/novedades/incapacidades` (o tab dentro de `/payroll/novedades` si ya existe shell).
- Reutilizar `EmpleadoPage`, tablas y modales del kit payroll.

---

## Criterios de aceptación (epic)

- [ ] División automática correcta de días entre empleador y EPS/ARL según origen **COMUN** vs **LABORAL**.
- [ ] La liquidación del período refleja el ajuste (sin salario ordinario en días EPS/ARL).
- [ ] Se puede adjuntar y descargar el soporte médico (storage R2).
- [ ] Estados `REGISTRADA` → `RADICADA_EPS` → `RECOBRADA` / `RECHAZADA` operables por RRHH.
- [ ] Alerta al superar **180 días acumulados** de incapacidad en el año calendario del empleado.
- [ ] Tests: incapacidad que cruza dos períodos, común vs laboral, evento > 180 días.
- [ ] Multi-tenant: nunca filtrar sin `tenantId`; soft delete con `deletedAt`.

---

## Subtareas (SDD)

> Implementar **una a la vez**. Cada archivo incluye Goal / Scope / Out of scope / Files allowed / Forbidden / Acceptance / Validation.

| #   | Archivo                                                                                    | Descripción                                             |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 01  | [task-01-schema-migration.md](./task-01-schema-migration.md)                               | Enums, modelo `MedicalLeave`, migración                 |
| 02  | [task-02-interfaces.md](./task-02-interfaces.md)                                           | Contratos TS repository/service                         |
| 03  | [task-03-repository.md](./task-03-repository.md)                                           | Prisma: CRUD, listados, acumulado anual                 |
| 04  | [task-04-payment-split.md](./task-04-payment-split.md)                                     | `calculatePaymentSplit` + utils puros + tests unitarios |
| 05  | [task-05-medical-leave-service.md](./task-05-medical-leave-service.md)                     | Service: registro, estados, validaciones tenant         |
| 06  | [task-06-storage-support-doc.md](./task-06-storage-support-doc.md)                         | Upload/descarga soporte médico (R2 / StorageObject)     |
| 07  | [task-07-payroll-liquidation-integration.md](./task-07-payroll-liquidation-integration.md) | Integración NOM-13 con liquidación del período          |
| 08  | [task-08-api-endpoints-dtos.md](./task-08-api-endpoints-dtos.md)                           | Controller REST + DTOs Swagger                          |
| 09  | [task-09-frontend-novedades.md](./task-09-frontend-novedades.md)                           | UI Novedades: registro, lista, estados, adjunto         |
| 10  | [task-10-alert-180-days.md](./task-10-alert-180-days.md)                                   | Alerta 180 días (BE flag + FE banner)                   |
| 11  | [task-11-tests-validation.md](./task-11-tests-validation.md)                               | Tests integración, casos legales, validación final      |

**Orden de implementación:**

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11
```

---

## Fuera de alcance (epic)

- Incapacidades de origen distinto (maternidad/paternidad, licencia remunerada) — epics separados.
- Radicación automática ante EPS/ARL (solo seguimiento manual de estado en MVP).
- Cálculo con IBCP / SMMLV histórico distinto a `salaryAmount/30`.
- Autoservicio del empleado (solo RRHH registra en MVP).
- Backfill/importación CSV de incapacidades históricas.

---

## Dependencias

- **Depende de:** OS-377 (empleados), OS-379 (nómina base), storage R2 (`StorageObject`).
- **Relacionado con:** OS-589 (vacaciones — convenciones de días calendario y liquidación), NOM-04 (motor de cálculo).
- **Bloquea:** cierre legal completo de NOM-13 (novedades de nómina).

---

## Preguntas abiertas

- **Q1:** ¿La alerta de 180 días es por **año calendario** o **año rolling** desde primera incapacidad?
- **Q2:** ¿Supervisor puede **ver** incapacidades de su sede o solo RRHH?
- **Q3:** ¿Incapacidad `RECHAZADA` revierte ajustes ya aplicados en liquidación del período?
