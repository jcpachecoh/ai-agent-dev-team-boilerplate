# CONN-06 — Prorrateo de costo por sede real para empleados con Centro de Costos "Rotante"

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[ATTENDANCE]` `[PAYROLL]` `[REPORTS]`  
**Status:** `completed`  
**Created:** 2026-07-15  
**Jira:** `CONN-06` (asignar issue en Jira)  
**Módulo NestJS propuesto:** `apps/api/src/daily-cost-center/` (nuevo, estructura estándar) + hooks en `turnos/`, `attendance/` y consumo en `reports/` (NOM-24)  
**UI:** ficha empleado OS-531/OS-563, perfil rotante (calendario), pantalla de corrección manual

---

## Contexto

La aplicación ya tiene tres campos separados en la ficha de empleado:

| Campo UI                   | Campo BD / enum              | Rol                              |
| -------------------------- | ---------------------------- | -------------------------------- |
| Centro de Costos           | `EmployeeDetails.costCenter` | Bucket de atribución de costo    |
| Áreas                      | `EmployeeDetails.locationId` | Sede física / punto de venta     |
| Clasificación mano de obra | `laborClassification`        | Cocina, Servicio, Administrativo |

`INCAPACIDADES` ya existe como valor de Centro de Costos **sin** ser una sede física, lo que confirma que `costCenter` es un bucket de atribución, no necesariamente geográfico.

**Rotante** se agrega como sexto valor del enum `CostCenter` existente — **no** se requiere un campo nuevo en la ficha.

El personal con `costCenter = ROTANTE` no tiene una única sede fija. Mientras no se sepa en qué sede trabajó cada día, el costo laboral queda agrupado genéricamente y distorsiona comparaciones por punto de venta. Esto también aplica a traslados o reclasificaciones entre sedes dentro del mismo período.

---

## Historia de usuario

**Como** sistema,  
**quiero** registrar en qué sede trabajó realmente cada colaborador con Centro de Costos "Rotante" cada día,  
**para** prorratear su costo laboral entre las sedes reales del período consultado en vez de dejarlo agrupado en un bloque único.

---

## Contexto en el codebase

| Área                         | Estado actual                                 | Gap                                                             |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Centro de Costos             | `CostCenter` enum (5 valores, OS-563)         | Falta `ROTANTE`                                                 |
| Áreas / sede fija            | `EmployeeDetails.locationId` obligatorio      | Debe poder quedar vacío/bloqueado cuando `costCenter = ROTANTE` |
| Malla de turnos              | CONN-03 / `ShiftResolutionService`            | No genera asignación diaria de sede para rotantes               |
| Marcación asistencia         | CONN-01 / `AttendanceService.registerEvent()` | No genera asignación diaria de sede para rotantes               |
| Informe comparativo por sede | NOM-24 (no implementado)                      | Atribuye costo a sede fija del empleado; sin prorrateo rotante  |
| Integración contable         | NOM-18 (futuro)                               | Fuera de alcance; prorrateo debe ser reutilizable como base     |

---

## Objetivo

1. Agregar `ROTANTE` al enum `CostCenter` y bloquear Áreas en la ficha cuando aplique.
2. Persistir `DailyCostCenterAssignment` — una fila por `(employeeId, date)` con la sede real trabajada.
3. Resolver automáticamente la sede desde CONN-03 (turno) o CONN-01 (marcación); fallback manual.
4. Al generar NOM-24, prorratear el costo del período del empleado rotante entre sedes según días trabajados.
5. Exponer UI de calendario y corrección manual para días sin resolución automática.

---

## ⭐ Puntos clave

### PC-1 — Rotante bloquea Áreas en ficha (OS-531)

- Al seleccionar Centro de Costos = **Rotante**, el campo **Áreas** se bloquea por completo.
- No se selecciona sede en creación ni edición (ni única ni lista).
- Para los demás valores de Centro de Costos (incluido `INCAPACIDADES`), Áreas se comporta **exactamente igual que hoy**.

### PC-2 — Sede real = operacional, nunca estática

- Para empleados `ROTANTE`, la sede de cada día se determina **solo** desde:
  1. Malla de turnos (CONN-03) — prioridad 1
  2. Marcación de asistencia (CONN-01) — prioridad 2
  3. Asignación manual — fallback
- **Nunca** desde un valor estático en la ficha del empleado.

### PC-3 — Prorrateo en informe, no en liquidación

El prorrateo se calcula al **generar el informe NOM-24**, no al liquidar nómina:

```
días_totales = COUNT(DailyCostCenterAssignment) en el período consultado

Para cada sede S donde trabajó:
  proporción_S = días_en_S / días_totales
  costo_prorrateado_S = costo_total_empleado_período × proporción_S
```

- Alcance actual: informes gerenciales (NOM-24).
- El mismo cálculo debe quedar disponible como servicio reutilizable para NOM-18 (contabilidad) — **sin** implementar integración contable en este epic.

### PC-4 — Solo rotantes generan asignación diaria

- `DailyCostCenterAssignment` se crea/actualiza **únicamente** para empleados con `costCenter = ROTANTE`.
- Para los demás centros de costo, el costo se atribuye directo a `locationId` fijo — sin registro diario.

### PC-5 — Días pendientes no se pierden

- Si un rotante no tiene turno ni marcación con sede identificable en un día laborable del período, el día queda **pendiente de asignación manual** (estado explícito o ausencia de fila con flag consultable).
- NOM-24 debe advertir costo no prorrateable / pendiente — no omitir silenciosamente.

### PC-6 — Prioridad de fuentes

```
TURNO_ASIGNADO > MARCACION_ASISTENCIA > MANUAL
```

- Una asignación `MANUAL` no debe ser sobrescrita automáticamente por turno/marcación posterior (decisión D2).
- Turno y marcación pueden actualizar días sin asignación o con fuente de menor prioridad según reglas del servicio.

---

## Modelo de datos (propuesto)

```prisma
enum CostCenter {
  ADMINISTRATIVO
  OPERACIONES
  PLANTA
  GERENCIA
  INCAPACIDADES
  ROTANTE          // nuevo
}

enum AssignmentSource {
  TURNO_ASIGNADO
  MARCACION_ASISTENCIA
  MANUAL
}

model DailyCostCenterAssignment {
  id         String           @id @default(cuid())
  tenantId   String
  employeeId String
  date       DateTime         @db.Date
  locationId String
  shiftId    String?          // referencia turno CONN-03, si aplica
  source     AssignmentSource
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  employee EmployeeDetails @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  location Location        @relation(fields: [locationId], references: [id], onDelete: Restrict)

  @@unique([tenantId, employeeId, date])
  @@index([tenantId, employeeId, date])
  @@index([tenantId, locationId, date])
}
```

### Cambio en `EmployeeDetails`

- `locationId` pasa a **nullable** cuando `costCenter = ROTANTE` (validación en service/DTO).
- Empleados no rotantes: `locationId` sigue siendo obligatorio.

> **Nota de naming:** en producto se dice "Centro de Costos"; en código el enum es `CostCenter` (OS-563).

---

## Fórmula de prorrateo (NOM-24)

Para cada empleado con `costCenter = ROTANTE` en el rango `[periodStart, periodEnd]`:

| Paso | Cálculo                                                                                               |
| ---- | ----------------------------------------------------------------------------------------------------- |
| 1    | `costo_total` = costo laboral del empleado en el período (misma base que NOM-24 usa hoy por empleado) |
| 2    | `asignaciones` = `DailyCostCenterAssignment` del empleado en el rango                                 |
| 3    | `días_totales` = `COUNT(asignaciones)`                                                                |
| 4    | Por cada `locationId` distinto: `proporción = días_en_sede / días_totales`                            |
| 5    | `costo_sede = costo_total × proporción`                                                               |

Días del período **sin** asignación → bucket "Pendiente / Sin sede" en el informe (no prorratear a sedes inventadas).

---

## Criterios de aceptación (epic)

- [x] El campo Centro de Costos incluye la opción "Rotante" junto a las 5 ya existentes.
- [x] Al seleccionar Rotante, el campo Áreas se bloquea; para los demás valores no cambia.
- [x] Un empleado Rotante con turno asignado en una sede específica genera automáticamente su `DailyCostCenterAssignment`.
- [x] Un empleado Rotante con marcación en sede identificable genera asignación cuando no hay turno.
- [x] Días sin turno ni marcación quedan pendientes de asignación manual (no se pierden).
- [x] El costo laboral por punto de venta (NOM-24) se prorratea entre sedes reales según `días_sede / días_totales`.
- [x] Tests: rotante sin turno ni marcación → pendiente manual; rotante en 2 sedes con proporciones distintas en el mismo período.
- [x] Multi-tenant: todas las queries con `tenantId`.

---

## Subtareas (SDD)

> Implementar **una a la vez**. Cada archivo incluye Goal / Scope / Out of scope / Files allowed / Forbidden / Acceptance / Validation.

| #   | Archivo                                                                                          | Descripción                                          |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 01  | [task-01-schema-migration.md](./task-01-schema-migration.md)                                     | `ROTANTE`, `DailyCostCenterAssignment`, migración    |
| 02  | [task-02-interfaces.md](./task-02-interfaces.md)                                                 | Contratos TS repository/service                      |
| 03  | [task-03-repository.md](./task-03-repository.md)                                                 | Prisma: CRUD, upsert por día, consultas por período  |
| 04  | [task-04-assignment-resolution-service.md](./task-04-assignment-resolution-service.md)           | Resolución automática + hooks CONN-03/CONN-01        |
| 05  | [task-05-employee-form-rotante.md](./task-05-employee-form-rotante.md)                           | OS-531: bloqueo Áreas, validación create/update      |
| 06  | [task-06-manual-assignment-api-frontend.md](./task-06-manual-assignment-api-frontend.md)         | API manual + calendario perfil + pantalla corrección |
| 07  | [task-07-nom24-comparative-report-proration.md](./task-07-nom24-comparative-report-proration.md) | `PayrollComparativeReportService` prorrateo rotante  |
| 08  | [task-08-tests-validation.md](./task-08-tests-validation.md)                                     | Tests proporciones, pendientes, validación pipeline  |

**Orden de implementación:**

```
01 → 02 → 03
         ↓
04 → 05 → 06 → 07 → 08
```

---

## Fuera de alcance (epic)

- Integración contable NOM-18 (solo dejar servicio de prorrateo reutilizable).
- Prorrateo en liquidación de nómina (NOM-07) — solo en informe NOM-24.
- Empleados no rotantes con traslado temporal entre sedes (solo rotantes + manual).
- App móvil nativa (hooks server-side en CONN-01 son suficientes).
- Cambios al catálogo de Centros de Costos más allá de agregar `ROTANTE`.

---

## Dependencias

```
OS-531 / OS-563 (ficha empleado, costCenter, locationId)
CONN-01 (marcación asistencia, locationId en evento) ──┐
CONN-03 (malla turnos, shift → locationId)            ──┼──► CONN-06 ──► NOM-24 (informe comparativo)
                                                        ──┘
NOM-18 (contabilidad) ← base reutilizable, no bloqueante
```

- **Depende de:** OS-531/OS-563, CONN-01, CONN-03.
- **Bloquea:** NOM-24 (prorrateo por sede real para rotantes).

---

## Decisiones de producto (cerradas 2026-07-15)

| #   | Pregunta                                    | Decisión                                                                                             |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| D1  | ¿Nuevo campo en ficha para sede rotante?    | **No** — solo enum `ROTANTE`; sede diaria vía `DailyCostCenterAssignment`                            |
| D2  | ¿Manual sobrescrito por turno/marcación?    | **No** — `MANUAL` tiene prioridad final; automático solo si no hay manual                            |
| D3  | ¿`locationId` nullable en BD para rotantes? | **Sí** — nullable con validación: obligatorio si `costCenter ≠ ROTANTE`                              |
| D4  | ¿Prorrateo en liquidación o informe?        | **Solo informe NOM-24** al generar reporte                                                           |
| D5  | ¿Qué pasa con días sin sede en el período?  | **Pendiente manual** + línea/advertencia en NOM-24; costo no se reparte a sedes arbitrarias          |
| D6  | ¿Granularidad de `date` en asignación?      | **Un registro por empleado por día calendario** (`@@unique([tenantId, employeeId, date])`)           |
| D7  | ¿Rotante con múltiples sedes el mismo día?  | **Una sede por día** — prioridad turno > marcación; si conflicto, turno gana (documentar en task 04) |
