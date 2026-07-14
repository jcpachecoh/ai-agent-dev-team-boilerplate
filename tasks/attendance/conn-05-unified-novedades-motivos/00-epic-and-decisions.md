# CONN-05 — Catálogo único de novedades/motivos entre Asistencia y Nómina

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PACKAGES]` `[ATTENDANCE]` `[PAYROLL]`  
**Status:** `pending`  
**Created:** 2026-07-10  
**Jira:** `CONN-05` (asignar issue en Jira)  
**Módulo NestJS propuesto:** extensión de `apps/api/src/attendance/` + orquestación en nuevo servicio `apps/api/src/attendance/service/manual-marking-provision.service.ts` (o `payroll-bridge/`)  
**UI packages:** `packages/ui/src/components/asistencia/**` — modal OS-553 (`AsistenciaTarjetaMarkingModal`)  
**UI web-app:** `apps/web-app/src/features/attendance/screens/AttendanceCardScreen.tsx` — **solo wiring**; sin componentes visuales propios fuera de `@restopsiq/ui`

---

## Historia de usuario

**Como** RRHH,  
**quiero** que al registrar el **Motivo de Cambio** de una marcación manual en el panel de asistencia, si el motivo es una incapacidad o licencia, se genere automáticamente el registro correspondiente en Nómina,  
**para** no capturar la misma novedad dos veces.

---

## Contexto

| Área                   | Estado actual                                                     | Gap                                                                             |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| OS-553 modal marcación | `AsistenciaTarjetaMarkingModal` en `packages/ui`                  | Dropdown con catálogo fijo (`FORGOT`, `DEVICE_FAILURE`, …) duplicado en backend |
| Backend OS-553         | `ATTENDANCE_MANUAL_MARKING_REASONS` en `attendance.constants.ts`  | No alineado con `NovedadType` (NOM-14) ni con incapacidades (NOM-13)            |
| NOM-14                 | `PayrollNovedad` + enum `NovedadType`                             | Catálogo propio; sin enlace desde asistencia                                    |
| NOM-13                 | `MedicalLeave` + `LeaveOrigin`                                    | Catálogo propio; sin enlace desde asistencia                                    |
| Doble captura          | RRHH marca ausencia en tarjeta **y** vuelve a registrar en Nómina | Flujo redundante y propenso a inconsistencias                                   |

> **Lección CONN-04a:** toda UI de asistencia/nómina debe reutilizar componentes de **`@restopsiq/ui`** (`EmpleadoPage`, `EmpleadoTable`, `DatePicker`, `RecetaFilterSelect`, `AsistenciaTarjetaMarkingModal`, etc.). `web-app` solo orquesta datos, permisos y mutations.

---

## Objetivo

1. Unificar el **catálogo de motivos** del modal OS-553 con los tipos de nómina.
2. Al crear una marcación manual con motivo de **novedad de nómina**, provisionar automáticamente el registro en el módulo correcto.
3. Mantener **Corrección de marcación** como motivo que **solo** ajusta asistencia (sin side-effect en nómina).
4. Exponer el catálogo desde **una sola fuente** consumida por backend y `packages/ui`.

---

## ⭐ Puntos clave

### PC-1 — Catálogo unificado (fuente única)

El dropdown **Motivo de cambio** debe mostrar:

| Grupo                | Códigos                                    | Destino al guardar                                          |
| -------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| Ajuste de asistencia | `CORRECCION_MARCACION`                     | Solo `AttendanceLog` (sin novedad)                          |
| Novedades NOM-14     | Todos los valores de `NovedadType`         | `PayrollNovedad` (estado inicial según `NovedadTypeConfig`) |
| Incapacidades NOM-13 | `INCAPACIDAD_COMUN`, `INCAPACIDAD_LABORAL` | `MedicalLeave` con `LeaveOrigin` correspondiente            |

Etiquetas en español alineadas con NOM-14 / NOM-13 (no códigos técnicos en UI).

> **Nota:** `NovedadType` no incluye incapacidad; las opciones de incapacidad se agregan al catálogo unificado como extensión explícita hacia NOM-13 (ver D2).

### PC-2 — Provisionamiento automático

Al `POST /attendance/employees/:userId/manual-markings` con motivo de nómina:

1. Crear la marcación manual (flujo OS-551/OS-553 existente).
2. En la **misma transacción** (o compensación documentada), crear:
   - `PayrollNovedad` si el motivo ∈ `NovedadType`
   - `MedicalLeave` si el motivo ∈ `{ INCAPACIDAD_COMUN, INCAPACIDAD_LABORAL }`
3. Derivar `startDate` / `endDate` de la marcación (`workDate`; fin = mismo día salvo que el modal capture rango — ver D4).
4. `requestedBy: RRHH` en novedades; actor = usuario JWT.
5. Guardar vínculo trazable (`linkedAttendanceLogId` en novedad/incapacidad **o** campo inverso en log — ver D5).

### PC-3 — Corrección de marcación NO genera nómina

Motivo `CORRECCION_MARCACION` (reemplaza `SUPERVISOR_CORRECTION` / ajustes puros):

- Solo persiste `AttendanceLog.source = MANUAL`.
- **No** llama a `PayrollNovedadesService` ni `MedicalLeavesService`.
- Test obligatorio de regresión.

### PC-4 — UI solo en packages

- Actualizar `ASISTENCIA_TARJETA_MARK_REASONS` → catálogo dinámico `MANUAL_MARKING_REASON_CATALOG` en `packages/ui` (o `packages/shared`).
- `AsistenciaTarjetaMarkingModal` recibe opciones del catálogo unificado (prop con default desde packages).
- `web-app` **no** define labels/códigos locales; consume API `GET /attendance/manual-marking-reasons` o import estático compartido si el epic opta por build-time sync (ver D3).

### PC-5 — Permisos y roles

- Crear marcación manual: roles existentes `PAYROLL_WRITE_ROLES` (OS-551).
- Provisionar novedad/incapacidad: mismo actor debe poder escribir en NOM-14 / NOM-13 (`NOMINA`, `OWNER`, `SUPER_ADMIN`).
- Si el actor no tiene permiso de nómina pero elige motivo de nómina → `403` con mensaje claro.

---

## Decisiones de producto (propuestas — validar en implementación)

| #   | Pregunta                                  | Decisión propuesta                                                                                                                                             |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | ¿Catálogo exacto del dropdown?            | `NovedadType` + `INCAPACIDAD_COMUN` + `INCAPACIDAD_LABORAL` + `CORRECCION_MARCACION`                                                                           |
| D2  | ¿Incapacidad en el mismo dropdown?        | **Sí** — extensión del catálogo hacia NOM-13 (no agregar `INCAPACIDAD` a `NovedadType`)                                                                        |
| D3  | ¿Fuente del catálogo FE/BE?               | **`packages/shared`** (tipos + labels) importado por API y `packages/ui`; evitar tercera copia en `attendance.constants.ts`                                    |
| D4  | ¿Rango de fechas de la novedad?           | MVP: **un solo día** = `workDate` de la marcación; rango multi-día → fuera de alcance (RRHH usa bandeja Nómina)                                                |
| D5  | ¿Trazabilidad log ↔ novedad?              | Campo opcional `sourceAttendanceLogId` en `PayrollNovedad` / `MedicalLeave` (migración task 01) **o** tabla puente `AttendancePayrollLink` — elegir en task 01 |
| D6  | ¿Eliminar marcación manual borra novedad? | MVP: **no** auto-borrar; advertir en UI si existe vínculo (evitar hard delete en cascada)                                                                      |
| D7  | ¿Motivos legacy (`FORGOT`, `OTHER`, …)?   | **Deprecar** del dropdown; migración de datos históricos no requerida en MVP (logs existentes conservan `manualReason` legado)                                 |

---

## Criterios de aceptación (epic)

- [ ] Las opciones del dropdown OS-553 son exactamente los tipos de `NovedadType` (NOM-14) + incapacidades (COMUN/LABORAL) + **Corrección de marcación**.
- [ ] Marcar una ausencia como **Incapacidad** en el panel de asistencia crea el registro en NOM-13 sin doble captura.
- [ ] Marcar con un tipo `NovedadType` (ej. `PERMISO_REMUNERADO`) crea `PayrollNovedad` con estado inicial correcto.
- [ ] Motivo **Corrección de marcación** NO genera novedad de nómina ni incapacidad.
- [ ] Catálogo definido **una sola vez** (packages) — sin duplicar en `web-app`.
- [ ] UI del modal usa componentes `@restopsiq/ui` exclusivamente.
- [ ] Tests: happy path novedad, happy path incapacidad, corrección sin side-effect, permisos `403`.
- [ ] Multi-tenant: `tenantId` en toda provision.

---

## Subtareas (SDD)

| #   | Archivo                                                                          | Descripción                                                       |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 01  | [task-01-shared-catalog.md](./task-01-shared-catalog.md)                         | Catálogo único en `packages/shared` + labels ES                   |
| 02  | [task-02-schema-link-fields.md](./task-02-schema-link-fields.md)                 | Campos de vínculo log ↔ novedad/incapacidad (si aplica)           |
| 03  | [task-03-provision-service.md](./task-03-provision-service.md)                   | Servicio orquestador post-marcación manual                        |
| 04  | [task-04-attendance-api-integration.md](./task-04-attendance-api-integration.md) | DTO, validación, endpoint catálogo, hook en `createManualMarking` |
| 05  | [task-05-packages-ui-modal.md](./task-05-packages-ui-modal.md)                   | `AsistenciaTarjetaMarkingModal` + tipos en `packages/ui`          |
| 06  | [task-06-web-app-wiring.md](./task-06-web-app-wiring.md)                         | `AttendanceCardScreen` — fetch catálogo, mutations, permisos      |
| 07  | [task-07-tests-validation.md](./task-07-tests-validation.md)                     | Tests BE/FE, Postman, validación pipeline                         |

**Orden de implementación:**

```
01 → 02 → 03 → 04 → 05 → 06 → 07
```

---

## Fuera de alcance (epic)

- Rango multi-día de novedad desde el modal de marcación (D4).
- Auto-borrado de novedad al eliminar marcación manual (D6).
- Motivos configurables por tenant (sigue centralizado; no `NovedadTypeConfig` dinámico en el dropdown de asistencia).
- App móvil empleado (CONN-07).
- Notificaciones email/push al provisionar.
- Reemplazo del catálogo en bandejas NOM-14 / NOM-13 (solo consumen el mismo enum, no rediseño de pantallas).

---

## Dependencias

```
NOM-13 (MedicalLeave) ──┐
NOM-14 (PayrollNovedad) ├──► CONN-05
CONN-01 (AttendanceLog) ──┤
OS-553 (modal marcación) ─┘
```

- **Depende de:** NOM-13, NOM-14, CONN-01, OS-551/OS-553 (marcación manual).
- **Relacionado con:** OS-553 pendientes (historial `AuditLog`, `manualParentLogId` UI).
- **No depende de:** CONN-04a (tiempo extra).

---

## Referencias en codebase

| Recurso                        | Ruta                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| Catálogo actual (duplicado FE) | `packages/ui/src/components/asistencia/shared/asistencia-types.ts` |
| Catálogo actual (duplicado BE) | `apps/api/src/attendance/attendance.constants.ts`                  |
| Modal OS-553                   | `packages/ui/.../AsistenciaTarjetaMarkingModal.tsx`                |
| Pantalla tarjeta               | `apps/web-app/.../AttendanceCardScreen.tsx`                        |
| Enum NovedadType               | `apps/api/prisma/schema.prisma`                                    |
| Task OS-553                    | `tasks/attendance/OS-553-attendance-card-kebab-marking-modal.md`   |
