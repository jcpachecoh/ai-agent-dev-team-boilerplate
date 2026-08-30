# ASIS-UNI Task 01 — Schema: AttendanceLog unificado

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `completed`  
**Depends on:** [00-epic-and-decisions.md](./00-epic-and-decisions.md)

---

## Goal

Extender `AttendanceLog` como único modelo de marcaciones y planificar migración desde `MobileAttendanceLog` / `source=DEVICE`.

---

## Scope

- Enum `AttendanceLogSource`: `APP_MOVIL` | `MANUAL` (decidir tratamiento de `DEVICE` legacy).
- Campos móvil en `AttendanceLog`: geo, distancia, foto, facial, `validationStatus`, `rejectionReason`.
- Migración SQL aditiva + script de backfill desde `mobile_attendance_logs`.
- `prisma validate` / `prisma generate`.

---

## Out of scope

- `registerEvent()` (Task 02).
- Eliminar `MobileAttendanceLog` (Task 05).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/` (solo migración de este task)
- `apps/api/prisma/seed.ts` (fixtures opcionales)

---

## Files forbidden

- `apps/api/src/**`
- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] `AttendanceLog` incluye `source` con `APP_MOVIL` y `MANUAL`.
- [x] Campos necesarios para app móvil viven en `AttendanceLog` (no en tabla paralela para datos nuevos).
- [x] Migración aditiva aplicable sin pérdida de datos existentes.
- [x] Documentado en comentario Prisma el mapeo `DEVICE` → `APP_MOVIL` si aplica.

---

## Validation commands

```bash
cd apps/api && pnpm exec prisma validate && pnpm exec prisma generate
```
