# ASIS-UNI Task 02 — AttendanceService.registerEvent()

**Domain:** `[BACKEND]` `[VALIDATION]`  
**Status:** `pending`  
**Depends on:** [task-01-schema-unified-attendance-log.md](./task-01-schema-unified-attendance-log.md)

---

## Goal

Implementar `AttendanceService.registerEvent()` como único punto de registro con validaciones compartidas (turno, duplicados, geocerca, `workDate`).

---

## Scope

- Método `registerEvent()` en `attendance.service.ts` (o servicio dedicado exportado por el módulo).
- Refactor `AttendanceCardService.createManualMarking` → delega en `registerEvent()`.
- Tests unitarios: ENTRY/EXIT, duplicados, geo APP_MOVIL, MANUAL sin geo, turno nocturno.

---

## Out of scope

- GraphQL móvil (Task 03).
- UI (Task 04).

---

## Files allowed

- `apps/api/src/attendance/**`
- Tests bajo `apps/api/src/attendance/test/`

---

## Files forbidden

- `schema.prisma` / migraciones
- `apps/web-app/**`
- `packages/**`

---

## Acceptance criteria

- [ ] Ningún insert directo a `AttendanceLog` en `createManualMarking` fuera de `registerEvent()`.
- [ ] Mismas reglas de duplicado para `APP_MOVIL` y `MANUAL` el mismo día.
- [ ] Geocerca solo aplica cuando `source=APP_MOVIL`.
- [ ] Cobertura tests ≥ 80% en service afectado.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern="attendance"
node scripts/validate-structure.js
```
