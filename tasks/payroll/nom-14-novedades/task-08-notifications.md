# NOM-14 Task 08 — Notificaciones

**Domain:** `[BACKEND]` `[NOTIFICATIONS]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-novedades-service.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Notificar al supervisor cuando tiene solicitudes pendientes y al empleado cuando su novedad cambia de estado (epic D8).

---

## Scope

### Eventos

| Evento                                | Destinatario                    | Mensaje MVP                                                |
| ------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Novedad → `PENDIENTE_SUPERVISOR`      | Supervisor(es) resueltos (D1)   | Nueva solicitud de {tipo} de {empleado}                    |
| Supervisor aprueba → `PENDIENTE_RRHH` | Empleado (`employee.userId`)    | Tu solicitud fue aprobada por tu supervisor y está en RRHH |
| `APROBADA`                            | Empleado                        | Tu solicitud de {tipo} fue aprobada                        |
| `RECHAZADA`                           | Empleado                        | Tu solicitud fue rechazada: {rejectionReason}              |
| Novedad → `PENDIENTE_RRHH` (directo)  | Rol `NOMINA` (opcional bandeja) | Nueva solicitud en bandeja RRHH                            |

### Implementación

- Reutilizar mecanismo in-app existente (buscar módulo `notifications` o patrón vacaciones si existe).
- `PayrollNovedadesNotificationService` invocado desde task 05 tras transiciones.
- No bloquear transacción principal si falla notificación (log + retry opcional).

---

## Out of scope

- Email / push.
- Badge count en sidebar (puede ser follow-up FE).

---

## Files allowed

- `apps/api/src/payroll-novedades/service/payroll-novedades-notification.service.ts` — create
- `apps/api/src/payroll-novedades/test/**` — create
- Integración en `payroll-novedades.service.ts`

---

## Files forbidden

- `apps/web-app/**` (salvo consumo futuro de notificaciones)
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Supervisor notificado al crear `PENDIENTE_SUPERVISOR`.
- [ ] Empleado notificado en `APROBADA` y `RECHAZADA` con motivo.
- [ ] Tests con notification service mockeado.

---

## Validation commands

```bash
pnpm --filter=api test -- payroll-novedades
node scripts/validate-structure.js
```
