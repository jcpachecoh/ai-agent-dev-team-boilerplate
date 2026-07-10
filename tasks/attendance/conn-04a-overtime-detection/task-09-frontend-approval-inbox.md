# CONN-04a Task 09 — Frontend bandeja e indicador tarjeta

**Domain:** `[FRONTEND]` `[WEB-APP]`  
**Status:** `completed`  
**Depends on:** [Task 08](./task-08-api-endpoints-dtos.md)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Bandeja de aprobación de tiempo extra por **cargo** en el panel de asistencia e indicador de estado en la Tarjeta de Asistencia (OS-551).

---

## Scope

### Rutas / UI

- Ruta propuesta: `/asistencia/tiempo-extra` (o pestaña en panel OS-548).
- Entrada en `apps/web-app/src/constants/navigation.ts` bajo Asistencia.
- Visible si el usuario tiene permiso `attendance.overtime.read` **o** cargo aprobador (D4).
- Acciones Aprobar/Objetar solo si el cargo del usuario coincide con el nivel activo de la solicitud.

### Bandeja

| Columna            | Fuente                     |
| ------------------ | -------------------------- |
| Empleado           | `employeeName`             |
| Sede               | `locationName`             |
| Minutos acumulados | `accumulatedMinutes`       |
| Fin de turno       | `shiftEndTime`             |
| Última salida      | `actualEndTime`            |
| Estado             | badge por `OvertimeStatus` |
| Período            | `payrollPeriod`            |

- Acciones: **Aprobar** / **Objetar** (modal; comentario obligatorio en objeción).
- Estados loading / error / empty (patrón proyecto).
- Hook `useOvertimeRequests` con React Query o patrón existente en `features/attendance`.

### Tarjeta OS-551

- Indicador en fila del día: pendiente / aprobada / objetada.
- Tooltip con minutos y nivel pendiente.
- Archivos probables: `AttendanceCardScreen`, `attendance-card.mapper.ts`, estilos SCSS module.

### API client

- Servicios en `apps/web-app/src/features/attendance/api/` o `services/`.
- Sin `fetch` directo — usar cliente HTTP existente del proyecto.

---

## Out of scope

- App móvil CONN-01.
- Email notifications UI.
- CONN-04b formulario administrativo.

---

## Files allowed

- `apps/web-app/src/features/attendance/**` — create/modify
- `apps/web-app/src/constants/navigation.ts` — modify
- `apps/web-app/src/features/attendance/**/test/**` — create

---

## Files forbidden

- `apps/api/src/**` (salvo tipos compartidos si ya existen en packages)
- `prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Usuario con cargo `ADMINISTRADOR` ve solo `PENDIENTE_ADMIN` de sus sedes.
- [ ] Usuario con cargo `DIRECTOR DE OPERACIONES` ve `PENDIENTE_GERENCIA_OPERACIONES`.
- [ ] Usuario con cargo `GERENTE GENERAL` ve `PENDIENTE_GERENCIA_GENERAL`.
- [ ] Wizard de cierre OS-380 muestra advertencia si hay pendientes (no bloquea).
- [ ] Modal de objeción valida comentario requerido.
- [ ] Tarjeta muestra indicador de estado para días con solicitud.
- [ ] CSS Modules + tokens SCSS; sin inline styles.

---

## Validation commands

```bash
pnpm --filter=web-app test -- overtime
pnpm --filter=web-app typecheck
pnpm lint
```
