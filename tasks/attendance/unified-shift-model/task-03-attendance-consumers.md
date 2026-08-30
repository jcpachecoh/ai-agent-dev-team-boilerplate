# SHIFT-UNI Task 03 — Consumidores asistencia: tarjeta, registro manual, UI Turnos

**Domain:** `[BACKEND]` `[FRONTEND]` `[ATTENDANCE]`  
**Status:** `pending`  
**Depends on:** [task-02-shift-service-and-resolution.md](./task-02-shift-service-and-resolution.md)

---

## Goal

Conectar OS-551, OS-554 y el menú Turnos de OS-547 al resolver unificado de turnos. Eliminar constantes hardcodeadas de jornada (8 h) en la tarjeta de asistencia.

---

## Scope

### Backend (`apps/api/src/attendance/`)

- `AttendanceCardService` (o servicio de agregación de tarjeta): por cada `workDate` del rango, llamar `ShiftResolutionService.getTargetMinutesForDay`.
- Exponer en response de tarjeta (DTO existente o extendido):
  - `targetMinutes` / `targetHours` formateado
  - `ordinaryMinutes`, `unworkedMinutes`, `overtimeMinutes` calculados **en servidor** vs. `targetMinutes` (no vs. 480 fijo).
- `AttendanceService.registerEvent()` (OS-554): opcional validación contra ventana del turno resuelto (tolerancia en minutos — constante en `attendance.constants.ts`).
- `AttendanceCollaboratorsService.todayShift`: alinear con `resolveForDay` cuando no hay fila calendario (sustituir o complementar lógica BASE).

### Frontend (`apps/web-app/src/features/attendance/`)

- Eliminar `REGULAR_DAY_MINUTES = 480` de `attendance-card.mapper.ts` y `attendance-card-calculations.ts` para filas que vengan del API.
- `targetHours` desde datos del backend, no `'08:00:00'`.
- Formularios Turnos (`TurnosForm`, modales): campos `locationId` (selector sede) y `daysOfWeek` (multi-select).
- Nueva UI mínima para asignación vigente por empleado (tab en ficha colaborador o modal desde listado OS-550) — alcance mínimo para cumplir AC menú Turnos.

### Tests

- `attendance-card.service.spec.ts`: HObj 6 h cuando turno asignado es 06:00–12:00.
- `attendance.service.spec.ts`: `registerEvent` rechaza ENTRY fuera de ventana si validación activa.
- Frontend: test mapper/tarjeta con `targetHours` del API.

---

## Out of scope

- NOM-07 payroll (Task 04).
- App móvil CONN-04a/b.
- Rediseño completo calendario OS-582.

---

## Files allowed

- `apps/api/src/attendance/**`
- `apps/web-app/src/features/attendance/**`
- `packages/ui/**` — solo si hace falta ajustar tipos de `AsistenciaTarjetaDayRow` (evitar si el API ya envía strings finales)

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/payroll/**` (Task 04)

---

## Acceptance criteria

- [ ] HObj en tarjeta coincide con duración del turno asignado (no `08:00:00` fijo).
- [ ] HO/HNT/HHEE usan `targetMinutes` del turno del día.
- [ ] Cambio de `EmployeeShiftAssignment` con `effectiveFrom` futuro se refleja en tarjeta a partir de esa fecha.
- [ ] Menú Turnos permite editar sede y días de semana del turno.
- [ ] Tests backend y frontend relevantes en verde.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern="attendance-card|attendance.service"
pnpm --filter=web-app test -- attendance-card
node scripts/validate-structure.js
```
