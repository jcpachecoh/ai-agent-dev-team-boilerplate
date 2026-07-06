# OS-553 — Kebab Menu / Modal Crear-Editar Marcación (alcance mínimo)

**Domain:** `[BACKEND]` `[FRONTEND]` `[RBAC]` `[AUDIT]`
**Status:** `implemented (alcance mínimo)`
**Rutas REST:** `DELETE /attendance/manual-markings/:id` (nuevo); `POST /attendance/employees/:userId/manual-markings` (ahora valida `reason`)
**Ruta frontend:** `/asistencia/asistencias/:locationId/employees/:userId/card` (mismo modal de OS-551, ampliado)
**Depends on:** OS-551 (`AttendanceLog.source`, `AttendanceObservation`, `AuditLog`, endpoints de tarjeta)
**Precede a:** resto de OS-553 (historial visible de cambios, selector de `manualParentLogId`, motivos configurables)

---

## Alcance

Se auditó el kebab menu y el modal "Crear/Editar Marcación" contra el requerimiento de OS-553 y se implementó **solo** el subconjunto mínimo acordado:

1. Ajustes de texto del modal (alert principal con "¡" inicial, según referencia).
2. `DELETE` seguro de marcación manual persistida (`source=MANUAL` únicamente).
3. Validación backend del motivo de cambio contra un catálogo fijo.
4. `AuditLog` al eliminar una marcación manual.

### Fuera de alcance (explícitamente, para el resto de OS-553)

- Historial de cambios visible (pantalla o endpoint de consulta de `AuditLog`; `AuditController` sigue vacío).
- Selector de `manualParentLogId` en el modal (el backend ya lo soporta desde OS-551, pero no hay UI para elegirlo).
- Motivos de cambio configurables por tenant (sigue siendo un catálogo fijo, ahora validado en ambos lados).
- Exportaciones (Excel/PDF/correo) — sin cambios, siguen como "próximamente".
- Cualquier rediseño de UI no estrictamente necesario para lo anterior.

---

## Decisiones

### `AttendanceLog` sigue inmutable — DELETE solo para `source=MANUAL`

El nuevo endpoint `DELETE /attendance/manual-markings/:id` es un **hard delete real** (no soft delete: `AttendanceLog` nunca tuvo `deletedAt`, y no se agregó en este ticket). La protección tiene dos capas:

- **Service** (`AttendanceCardService.deleteManualMarking`): busca el log, si `source !== 'MANUAL'` lanza `ForbiddenException` — nunca llega a intentar el borrado.
- **Repository** (`AttendanceRepository.deleteManualLog`): el `where` de Prisma incluye `source: 'MANUAL'` como defensa adicional a nivel de datos (si alguna vez se llama sin pasar por el service, Prisma no encuentra la fila y lanza `P2025`).

### Motivo de cambio — enum compartido, no catálogo en base de datos

Se agregó `ATTENDANCE_MANUAL_MARKING_REASONS` en `apps/api/src/attendance/attendance.constants.ts` (debe mantenerse sincronizado a mano con `ASISTENCIA_TARJETA_MARK_REASONS` en `packages/ui/src/components/asistencia/shared/asistencia-types.ts` — no se creó una fuente única compartida entre backend y `packages/ui` para no acoplar el paquete de UI a Prisma/NestJS). `create-manual-marking.dto.ts` ahora usa `@IsIn(ATTENDANCE_MANUAL_MARKING_REASONS)` en vez de `@IsString()`.

### Scoping de sede reutilizado tal cual OS-551

`deleteManualMarking` reutiliza el mismo `assertLocationScope` privado del service (ahora con firma `{ locationId: string }` en vez de `EmployeeWithUser`, para poder pasarle tanto el empleado completo como el `employee` embebido en el log). Mismo criterio: OWNER/SUPER_ADMIN sin restricción, SUPERVISOR/MANAGER solo su propia sede.

### Confirmación simple, sin modal de confirmación dedicado

El pedido de "confirmación simple antes de eliminar" se resolvió con `window.confirm(...)` en `AttendanceCardScreen.tsx`, no con un componente de diálogo nuevo — evita agregar un componente más a `packages/ui` para un caso de uso de una sola línea.

### Al eliminar: se actualiza la lista del modal, no se cierra

Tras eliminar, la mutation invalida `attendanceKeys.all` (React Query), lo que refresca `cardQuery` y por lo tanto `existingMarksForDay` (ahora ya no incluye la marca borrada) — el modal permanece abierto para seguir operando sobre el mismo día si hace falta.

---

## Backend

Extiende `apps/api/src/attendance/` (sin módulo nuevo):

- `attendance.constants.ts` — `ATTENDANCE_MANUAL_MARKING_REASONS`, tipo `AttendanceManualMarkingReason`.
- `controller/dto/create-manual-marking.dto.ts` — `reason` ahora usa `@IsIn(...)`.
- `interfaces/attendance.interfaces.ts` — nuevo tipo `AttendanceLogWithEmployee`; `findLogById` ahora retorna ese tipo (incluye `employee` para poder hacer scoping de sede sin una query extra); nuevo método `deleteManualLog` en `IAttendanceRepository`.
- `repository/attendance.repository.ts` — `findLogById` agrega `include: { employee: true }`; nuevo `deleteManualLog(id, tenantId)` con `where: { id, tenantId, source: 'MANUAL' }`.
- `service/attendance-card.service.ts` — nuevo método `deleteManualMarking(logId, tenantId, actingUser)`; `assertLocationScope` generalizado a `{ locationId: string }`.
- `controller/attendance.controller.ts` — nuevo endpoint `DELETE manual-markings/:id` (`PAYROLL_WRITE_ROLES`, `204 No Content`).

### AuditLog al eliminar

```ts
action: 'DELETE'
entityType: 'AttendanceLog'
entityId: <id eliminado>
oldValue: { id, eventType, timestamp, workDate, source }  // serializeLog, reutilizado de OS-551
newValue: null
```

---

## Frontend

- `packages/ui/.../AsistenciaTarjetaMarkingModal.tsx` — texto principal ajustado a `¡Solo se pueden modificar o eliminar marcas manuales.`; `AsistenciaTarjetaExistingMark` ahora incluye `source: 'DEVICE' | 'MANUAL'`; nueva prop `onDeleteExistingMark`; cada marca existente muestra botón `Trash2` (si `source=MANUAL`) o ícono `Lock` bloqueado (si `source=DEVICE`).
- `apps/web-app/src/features/attendance/api/attendance.client.ts` — `deleteManualMarking(logId)`.
- `hooks/useAttendanceMutations.ts` — `useDeleteManualMarkingMutation`.
- `screens/AttendanceCardScreen.tsx` — `existingMarksForDay` (renombrado desde `existingManualMarks`) ahora incluye **todas** las marcas del día (DEVICE + MANUAL), no solo las manuales, para poder mostrar el candado en las DEVICE. Nuevo `handleDeleteExistingMark` con `window.confirm` + gate de rol (`canEditMarking`) + toast + invalidación automática vía React Query.

---

## Riesgos

- El catálogo de motivos vive duplicado (frontend `packages/ui` y backend `attendance.constants.ts`) — si se agrega un motivo nuevo hay que actualizar ambos archivos a mano. Documentado explícitamente para evitar que se rompa silenciosamente.
- Hard delete real: una vez eliminada una marcación manual, solo queda su rastro en `AuditLog` (sin UI de consulta todavía) — si se borra por error, no hay "deshacer" a nivel de datos, solo se puede volver a crear manualmente.

## Pendiente para el resto de OS-553

- Endpoint(s) en `AuditController` (hoy completamente vacío) para consultar el historial de cambios por marcación/día/empleado.
- UI para elegir `manualParentLogId` al crear una marcación de corrección.
- Motivos de cambio configurables por tenant (hoy fijos y duplicados en dos archivos).

## Tests

- Backend: `attendance-card.service.spec.ts` (+5 casos `deleteManualMarking`), `attendance.repository.spec.ts` (+2: `findLogById` con include, `deleteManualLog`), `attendance.controller.spec.ts` (+1), `attendance.e2e-spec.ts` (+4: reason inválido en POST, DELETE válido, DELETE sobre DEVICE, DELETE inexistente).
- Frontend: `AttendanceCardScreen.test.tsx` (+5: texto del alert, botón eliminar vs. candado, eliminar llama API, cancelar confirmación no elimina, catálogo de motivos del select).

## Postman

Carpeta `OS-551 Attendance Card` (reutilizada, mismo recurso): + DELETE válido, + DELETE sobre DEVICE (403), + POST manual marking con `reason` inválido (400).
