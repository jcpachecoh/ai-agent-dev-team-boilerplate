# OS-551 — Tarjeta de Asistencia (persistencia real de marcaciones manuales y observaciones)

**Domain:** `[BACKEND]` `[FRONTEND]` `[RBAC]` `[AUDIT]`
**Status:** `implemented`
**Rutas REST:** `/api/attendance/employees/:userId/card`, `/api/attendance/employees/:userId/observations`, `/api/attendance/employees/:userId/manual-markings`
**Ruta frontend:** `/asistencia/asistencias/:locationId/employees/:userId/card`
**Depends on:** NOM-03 (`AttendanceLog`, kiosko de marcaciones), USR-05 (`AuditLog`), RBAC `PAYROLL_MODULE_ROLES`/`PAYROLL_WRITE_ROLES`
**Precede a:** OS-553 (historial de cambios visible, aprobación de marcas, exportaciones)

---

## Alcance

La pantalla `AttendanceCardScreen` (header del empleado, KPIs, filtros Desde/Hasta con límite de 3 meses, tabla con kebab menu, modal de observación, modal de crear/editar marcación) ya existía con toda la UI construida, pero observaciones y marcaciones editadas se guardaban únicamente en `localStorage` del navegador — sin persistencia real, sin `AuditLog`, y con un límite fijo `limit: 100` en la query que podía truncar silenciosamente el historial en rangos cercanos a 3 meses.

Esta implementación:

- Persiste observaciones y marcaciones manuales en el backend (Postgres vía Prisma).
- Registra toda creación/edición en `AuditLog`.
- Elimina el límite fijo de 100 registros.
- Mantiene la UI existente sin cambios visuales (solo se reconectó a datos reales).

### Fuera de alcance (queda para OS-553)

- Exportación a Excel/PDF/envío por correo (botones siguen mostrando "estará disponible próximamente").
- `DELETE` de marcación manual (instrucción explícita: no implementar todavía).
- Pantalla/endpoint de historial visible de cambios (hoy solo queda en `AuditLog`, sin UI de consulta).
- Motivos de cambio configurables (hoy es una lista estática `ASISTENCIA_TARJETA_MARK_REASONS` en `packages/ui`).
- Flujo de aprobación de marcas (mencionado en el propio modal como mensaje informativo, nunca implementado).

---

## Decisión: `AttendanceLog` inmutable

Las marcaciones automáticas de dispositivo/kiosko (`source=DEVICE`) **nunca se editan**. Toda marcación manual se inserta como una **fila nueva** de `AttendanceLog` con `source=MANUAL`, opcionalmente referenciando (`manualParentLogId`) la fila que corrige, sin modificarla. No se agregó `deletedAt` a `AttendanceLog` — sigue sin soft delete, igual que antes de este ticket (precedente: `TurnoAssignment`, ver OS-582).

## Decisión: `AttendanceObservation` como entidad separada

Una observación por `(tenantId, employeeId, workDate)` — `@@unique` — persistida y auditada. No se creó una tabla `AttendanceLogChange`: la trazabilidad de creación/edición de observaciones y marcaciones manuales vive enteramente en el `AuditLog` genérico ya existente (`AuditModule`/`AuditService`, reutilizado sin cambios, mismo patrón que `employee-personal-data` y `payroll`).

---

## Modelo de datos

Migración `20260705120000_os_551_attendance_manual_marking_observations`:

```prisma
enum AttendanceLogSource {
  DEVICE
  MANUAL
}

model AttendanceLog {
  // ...campos existentes (sin cambios)...
  source            AttendanceLogSource @default(DEVICE)
  createdByUserId   String?
  manualReason      String?
  manualParentLogId String?

  createdBy       User?           @relation("AttendanceLogCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
  manualParentLog AttendanceLog?  @relation("AttendanceLogManualParent", fields: [manualParentLogId], references: [id], onDelete: SetNull)
  manualChildLogs AttendanceLog[] @relation("AttendanceLogManualParent")

  @@index([manualParentLogId])
}

model AttendanceObservation {
  id         String   @id @default(cuid())
  tenantId   String
  employeeId String
  workDate   DateTime @db.Date
  note       String   @db.VarChar(500)

  createdByUserId String?
  updatedByUserId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  employee  EmployeeDetails @relation(fields: [employeeId], references: [id])
  createdBy User?           @relation("AttendanceObservationCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)
  updatedBy User?           @relation("AttendanceObservationUpdatedBy", fields: [updatedByUserId], references: [id], onDelete: SetNull)

  @@unique([tenantId, employeeId, workDate])
  @@index([tenantId, employeeId, workDate])
  @@map("attendance_observations")
}
```

Sin relación explícita a `Tenant` (mismo patrón que `AttendanceLog`/`EmployeeDetails`/`User`: `tenantId` como campo plano, sin FK).

**Nota de entorno:** al generar la migración se detectó _drift_ preexistente en la base de datos de desarrollo, no relacionado con este ticket (una tabla huérfana `attendance_alert_dismissals` sin modelo Prisma correspondiente, y un par de FKs de `turno_assignments`/`employee_details` desincronizadas). La migración de este ticket se escribió a mano para incluir **solo** los cambios de OS-551, evitando arrastrar ese drift.

---

## Backend

Extiende el módulo existente `apps/api/src/attendance/` (no se creó un módulo nuevo):

- `repository/attendance.repository.ts` — `findLogById`, `createManualLog`, `listObservationsInRange`, `findObservation`, `upsertObservation`.
- `service/attendance-card.service.ts` (nuevo) — `getCard`, `upsertObservation`, `createManualMarking`. Sigue el patrón de servicios ya separados por responsabilidad del módulo (`attendance-monitor-summary.service.ts`, `attendance-control-panel.service.ts`).
- `utils/attendance-calculation.util.ts` — `isCardDateRangeWithinLimit` (espeja `validateAttendanceDateRange` del frontend, exige el límite de 3 meses también en el servidor) y `parseCalendarDate` (parsea fechas de calendario "YYYY-MM-DD" sin reinterpretarlas por zona horaria — distinto de `normalizeWorkDate`, que convierte un _instante_ real a su día calendario en Bogotá).
- `attendance.module.ts` — importa `AuditModule` y registra `AttendanceCardService`.

### Endpoints nuevos

| Método | Ruta                                            | Roles                  | Uso                                                       |
| ------ | ----------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| GET    | `/attendance/employees/:userId/card`            | `PAYROLL_MODULE_ROLES` | Historial + observaciones del rango en una sola respuesta |
| GET    | `/attendance/employees/:userId/observations`    | `PAYROLL_MODULE_ROLES` | Observaciones sueltas (reutilizable para OS-553)          |
| PUT    | `/attendance/employees/:userId/observations`    | `PAYROLL_WRITE_ROLES`  | Crear/editar observación (upsert)                         |
| POST   | `/attendance/employees/:userId/manual-markings` | `PAYROLL_WRITE_ROLES`  | Marcación manual (`source=MANUAL`)                        |

`PAYROLL_WRITE_ROLES` (`rbac.config.ts`) ya era exactamente `[OWNER, SUPER_ADMIN, SUPERVISOR, MANAGER]` — se reutilizó tal cual, sin crear una constante nueva.

### Scoping de sede

- `OWNER` / `SUPER_ADMIN`: sin restricción, pueden operar sobre cualquier sede del tenant.
- `SUPERVISOR` / `MANAGER`: solo pueden crear/editar observaciones y marcaciones de empleados cuya `locationId` coincide con `user.locationId` del JWT (`ForbiddenException` si no coincide).
- `NOMINA`: solo lectura (no está en `PAYROLL_WRITE_ROLES`).

Validado server-side en `AttendanceCardService.assertLocationScope` — no depende del gate `MARKING_ROLES` del frontend, que es solo UX.

### Validaciones de marcación manual

- `reason` obligatorio.
- Si viene `parentLogId`: debe existir, pertenecer al mismo `tenantId` y al mismo `employeeId` (`BadRequestException` si no).
- `timestamp` debe caer en `workDate` (ENTRY) o en `workDate`/`workDate+1` (EXIT, para permitir turno nocturno que cruza medianoche — mismo criterio documentado en el comentario de `workDate` en `AttendanceLog`).
- Nunca modifica el log original: solo `INSERT`, jamás `UPDATE`/`DELETE` sobre `AttendanceLog`.

### AuditLog

Cada `upsertObservation` y `createManualMarking` escribe una entrada en `AuditLog` (reutilizando `AuditService.log`, sin tocar su implementación):

- Observación: `action=CREATE` si no existía antes, `UPDATE` si existía; `entityType='AttendanceObservation'`.
- Marcación manual: `action=CREATE`; `entityType='AttendanceLog'`; `oldValue` = log padre si aplica, `newValue` = log creado, `payload` = `{ reason, parentLogId }`.

---

## Frontend

Todo dentro de `apps/web-app/src/features/attendance/`:

- **Eliminado:** `utils/attendance-card-storage.ts` (localStorage) y `types/attendance-card.types.ts` (tipos que solo servían a ese storage) — código muerto tras la migración a backend real.
- **Nuevo:** `utils/attendance-card-drafts.ts` — quedaron solo los helpers puros de UI para construir/rotar drafts del modal (`createMarkDraft`, `nextMarkType`), sin persistencia.
- `api/attendance.client.ts` — `getAttendanceCard`, `upsertAttendanceObservation`, `createManualMarking` (mismo patrón `fetch` + `x-tenant-id` + `Authorization` ya usado por el resto del módulo).
- `hooks/useAttendanceCardQuery.ts` (nuevo) + `hooks/useAttendanceCardData.ts` (actualizado) — reemplaza `useAttendanceHistoryQuery` con `limit: 100` fijo por el endpoint agregado, sin límite artificial.
- `hooks/useAttendanceMutations.ts` — `useUpsertObservationMutation`, `useCreateManualMarkingMutation` (React Query, invalidan `attendanceKeys.all` en `onSuccess`).
- `mappers/attendance-card.mapper.ts` — `buildAttendanceCardRows` ya no lee de storage: las marcaciones manuales llegan mezcladas en el mismo array de `logs` (distinguibles por `log.source === 'MANUAL'`), y las observaciones se resuelven contra el array `observations` que devuelve el backend.
- `screens/AttendanceCardScreen.tsx` — `saveObservationModal`/`saveMarkingModal` ahora llaman a las mutations reales en vez de a storage local. Se agregó `MANAGER` a `MARKING_ROLES` (antes solo `OWNER, SUPER_ADMIN, SUPERVISOR`) para que el gate client-side coincida exactamente con `PAYROLL_WRITE_ROLES`/el scoping real del backend.

El resto de la UI (`packages/ui/src/components/asistencia/**`) no se tocó — se reconectó a datos reales sin cambios visuales.

---

## Addendum — visibilidad de observaciones y marcaciones existentes

Tras la primera prueba manual se detectó que el ícono de "tiene observación" (`StickyNote`) no era clickeable — solo indicaba estado, sin forma de ver la nota sin pasar por el kebab menu. Además, al editar una marcación no había forma de ver el motivo/autor de marcas manuales ya registradas ese día. Se agregó:

- Backend: `attendance.repository.ts` ahora incluye `createdBy`/`updatedBy` (email) en `listHistory`, `listObservationsInRange`, `findObservation` y `upsertObservation`. Nuevo tipo `AttendanceObservationFull` en `attendance.interfaces.ts`.
- Frontend: el ícono de observación (`packages/ui/.../AsistenciaTarjetaTable.tsx`) ahora es un botón que abre directamente el modal. El modal de observación (`AttendanceCardScreen.tsx`) muestra "Última edición por {email} el {fecha}". El modal de marcación (`AsistenciaTarjetaMarkingModal.tsx`, nueva prop `existingMarks`) muestra, de solo lectura, las marcaciones manuales ya registradas ese día con su motivo y quién las creó.
- No se creó pantalla de historial de cambios (eso sigue siendo OS-553) — esto solo hace visible la información que ya se estaba persistiendo pero no se mostraba.

## Riesgos

- **Modal de marcación siempre inicia en blanco.** Como `AttendanceLog` es inmutable, ya no existe el concepto de "cargar una marcación manual previa para editarla": cada guardado crea una fila nueva. El modal hoy no permite elegir un `parentLogId` desde la UI (el backend lo soporta, pero el frontend no lo envía todavía) — queda para OS-553.
- **`changeReason` sigue siendo una lista estática** (`ASISTENCIA_TARJETA_MARK_REASONS` en `packages/ui`), no configurable por tenant.
- **Sin historial de cambios visible.** Toda la auditoría vive en `AuditLog`, pero no hay pantalla ni endpoint de consulta por ahora.

## Relación con OS-553

Ya cubierto y reutilizable:

- `source=MANUAL` / `manualReason` / `createdByUserId` / `manualParentLogId` en `AttendanceLog`.
- `AuditLog` con entradas reales para cada creación/edición.
- `GET /attendance/employees/:userId/observations` como bloque independiente.

Pendiente:

- `DELETE /attendance/manual-markings/:id` (solo debería poder borrar `source=MANUAL`, nunca `DEVICE`).
- Pantalla de historial de cambios por día/marcación (leyendo `AuditLog` filtrado por `entityType`/`entityId`).
- UI para elegir `parentLogId` al corregir una marcación existente.
- Flujo de aprobación de marcas (mencionado en el modal, nunca implementado).

---

## Tests

- Backend: `test/attendance-card.service.spec.ts` (nuevo), `test/attendance.repository.spec.ts`, `test/attendance.controller.spec.ts`, `test/attendance.e2e-spec.ts` — extendidos.
- Frontend: `mappers/attendance-card.mapper.test.ts` (nuevo), `utils/attendance-card-dates.test.ts` (nuevo), `screens/AttendanceCardScreen.test.tsx` (nuevo).

## Postman

Carpeta `OS-551 Attendance Card` agregada a `postman/restopsiq-api.collection.json` (GET card, GET card con rango > 3 meses → 400, GET/PUT observations, PUT con nota > 500 → 400, PUT con rol no autorizado → 403, POST manual-markings ENTRY/EXIT, POST con `parentLogId` inválido → 400).
