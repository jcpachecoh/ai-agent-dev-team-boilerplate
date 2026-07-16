# CONN-11 Task 05 — Consumidores: tiempo pagable con ventana planificada

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 02](./task-02-shift-window-utils.md), [Task 03](./task-03-jornada-cutoff-service-and-scheduler.md)  
**Epic:** CONN-11

---

## Goal

Actualizar lectores de asistencia para que minutos ordinarios y overtime reflejen las reglas CONN-11 (ventana planificada + corte), no el crudo ENTRY→EXIT.

---

## Scope

### Archivos a modificar

| Archivo                                                    | Cambio                                                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `attendance/utils/attendance-card-day-summary.util.ts`     | Usar `computeDayMinutesByScope()` + turno resuelto + cutoff                                                        |
| `attendance/utils/attendance-calculation.util.ts`          | Deprecar/documentar `calculateDaySummary()` crudo para reportes de pago; mantener para monitor operativo si aplica |
| `attendance/service/attendance.service.ts`                 | `getOvertimeSummary()` — separar ordinary vs overtime scope                                                        |
| `attendance/service/attendance-control-panel.service.ts`   | Métricas HE del mes basadas en OVERTIME scope aprobado o detectado                                                 |
| `attendance/service/attendance-monitor-summary.service.ts` | Revisar si "overtime" operativo vs pagable — documentar                                                            |

### Tarjeta OS-551 (`buildAttendanceCardDaySummaries`)

Por cada día:

1. Resolver turno (`resolveForDay`).
2. Obtener `JornadaCutoff` si existe.
3. Calcular:
   - `ordinaryMinutes` — pares ORDINARY recortados a `[shiftStart, shiftEnd]`
   - `overtimeMinutes` — suma pares OVERTIME (minutos brutos del par; aprobación es capa CONN-04a)
4. `unworkedMinutes` = `targetMinutes - ordinaryMinutes` (sin cambio semántico)

### Resumen empleado / API REST

`GET /api/attendance/employees/:userId/overtime`:

- `totalMinutes` → ordinaryMinutes del día (no crudo)
- `overtimeMinutes` → minutos scope OVERTIME (no `total - 480`)
- Documentar breaking change en response DTO si aplica

---

## Out of scope

- Liquidación nómina OS-586 (task CONN-04a-07)
- Frontend tarjeta
- Cambio visual panel

---

## Files allowed

- `apps/api/src/attendance/utils/attendance-card-day-summary.util.ts`
- `apps/api/src/attendance/utils/attendance-calculation.util.ts`
- `apps/api/src/attendance/service/attendance.service.ts`
- `apps/api/src/attendance/service/attendance-control-panel.service.ts`
- `apps/api/src/attendance/service/attendance-monitor-summary.service.ts`
- `apps/api/src/attendance/test/attendance-card*.spec.ts`
- `apps/api/src/attendance/test/attendance-calculation.util.spec.ts`

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/web-app/**`
- `apps/api/src/overtime/**`

---

## Acceptance criteria

- [ ] Tarjeta: entrada 07:45, turno 08:00–17:00, salida 17:00 → `ordinaryMinutes = targetMinutes` (sin +15)
- [ ] Tarjeta: salida real 17:45 sin OVERTIME → `overtimeMinutes = 0`
- [ ] Tarjeta: par OVERTIME 17:05–18:00 → `overtimeMinutes = 55`
- [ ] Tests de regresión OS-551 pasan con nuevas expectativas documentadas

---

## Validation

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern="attendance-card|attendance-calculation"
pnpm --filter=@restopsiq/api run typecheck
```
