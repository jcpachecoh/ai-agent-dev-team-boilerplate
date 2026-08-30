# ASIS-UNI Task 03 — Canal app móvil unificado

**Domain:** `[BACKEND]` `[GRAPHQL]` `[MOBILE]`  
**Status:** `pending`  
**Depends on:** [task-02-register-event-service.md](./task-02-register-event-service.md)

---

## Goal

Hacer que `registrarMarcacion` y flujos OS-499/OS-500/OS-505 persistan en `AttendanceLog` vía `registerEvent()` con `source=APP_MOVIL`.

---

## Scope

- Refactor `apps/api/src/attendance/mobile/**` para usar `registerEvent()`.
- Dejar de crear filas en `MobileAttendanceLog` para marcaciones nuevas.
- Mantener contrato GraphQL existente (campos de respuesta equivalentes).
- Tests resolver + service móvil.

---

## Out of scope

- Drop de `MobileAttendanceLog` (Task 05).
- Cambios en app Capacitor (CONN-04a/b).

---

## Files allowed

- `apps/api/src/attendance/mobile/**`
- `apps/api/src/attendance/service/**` (si wiring de módulo)
- Tests relacionados

---

## Files forbidden

- `apps/web-app/**`
- `schema.prisma` salvo hotfix bloqueante acordado

---

## Acceptance criteria

- [ ] `mutation registrarMarcacion` crea `AttendanceLog` con `source=APP_MOVIL`.
- [ ] Foto, geo y facial quedan en columnas de `AttendanceLog`.
- [ ] Intentos rechazados por geocerca siguen persistidos (status REJECTED) vía `registerEvent()`.
- [ ] Tests OS-499/OS-505 actualizados y en verde.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern="attendance/mobile|mobile-attendance"
```
