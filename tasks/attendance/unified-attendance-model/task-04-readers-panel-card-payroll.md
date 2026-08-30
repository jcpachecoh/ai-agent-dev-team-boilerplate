# ASIS-UNI Task 04 — Lectores: panel, tarjeta y nómina

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]`  
**Status:** `pending`  
**Depends on:** [task-03-mobile-channel-unified.md](./task-03-mobile-channel-unified.md)

---

## Goal

OS-548, OS-551, OS-547/NOM-06 y NOM-07 leen **solo** `AttendanceLog`. UI muestra `source` (APP móvil / Manual).

---

## Scope

- Eliminar joins/uniones con `MobileAttendanceLog` en `attendance-control-panel.service.ts` y monitor.
- Tarjeta OS-551: columna o badge de origen (`APP_MOVIL` | `MANUAL`).
- NOM-07: auditoría y corrección de cálculos para usar exclusivamente `AttendanceLog`.
- Labels en español en UI (`App móvil`, `Manual`).

---

## Out of scope

- Drop tabla paralela (Task 05).
- CONN-04a/b (app móvil nativa).

---

## Files allowed

- `apps/api/src/attendance/service/attendance-control-panel.service.ts`
- `apps/api/src/attendance/service/attendance-monitor-summary.service.ts` (si aplica)
- `apps/api/src/payroll/**` (solo lectura asistencia NOM-07)
- `apps/web-app/src/features/attendance/**`
- `packages/ui/src/components/asistencia/**` (solo si hace falta columna `source`)

---

## Files forbidden

- `schema.prisma` / migraciones
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Marcación móvil y manual en la misma tarjeta OS-551.
- [ ] `source` visible en tarjeta y/o panel de control.
- [ ] NOM-07 no importa ni consulta `MobileAttendanceLog`.
- [ ] Panel OS-548 sin referencias a `MobileAttendanceLog`.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern="attendance-control-panel|attendance-card|payroll"
pnpm --filter=web-app test -- attendance
```
