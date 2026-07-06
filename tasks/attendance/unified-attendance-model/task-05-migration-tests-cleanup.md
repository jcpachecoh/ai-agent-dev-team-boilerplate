# ASIS-UNI Task 05 — Migración, tests cruzados y limpieza

**Domain:** `[BACKEND]` `[MIGRATION]` `[TEST]` `[POSTMAN]`  
**Status:** `pending`  
**Depends on:** [task-04-readers-panel-card-payroll.md](./task-04-readers-panel-card-payroll.md)

---

## Goal

Migrar datos históricos, validar convivencia APP_MOVIL + MANUAL mismo día, eliminar `MobileAttendanceLog` del código y schema.

---

## Scope

- Script/migración: backfill `mobile_attendance_logs` → `attendance_logs`.
- Migración final: drop `mobile_attendance_logs` + enums huérfanos.
- Tests E2E: empleado con marcación app + manual mismo `workDate` sin conflicto.
- Actualizar Postman (carpeta asistencia unificada).
- Eliminar repositorios/servicios que solo leían `MobileAttendanceLog`.

---

## Out of scope

- Nuevas features de marcación.

---

## Files allowed

- `apps/api/prisma/migrations/`
- `apps/api/prisma/schema.prisma` (solo drop modelo paralelo)
- `apps/api/src/attendance/**`
- `apps/api/test/**`
- `postman/restopsiq-api.collection.json`

---

## Files forbidden

- `apps/web-app/**` salvo ajuste mínimo si tests FE fallan
- `packages/**`

---

## Acceptance criteria

- [ ] Cero referencias a `MobileAttendanceLog` en `apps/api/src`.
- [ ] Conteo migrado ≥ filas origen en staging (documentar excepciones REJECTED duplicadas).
- [ ] Test: mismo empleado, mismo día, ENTRY app + corrección MANUAL → ambos en tarjeta.
- [ ] `pnpm --filter=@restopsiq/api test:cov` en verde (branches ≥ 80%).

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api exec prisma migrate deploy
pnpm --filter=@restopsiq/api test:cov
rg MobileAttendanceLog apps/api --glob '!**/migrations/**'
```
