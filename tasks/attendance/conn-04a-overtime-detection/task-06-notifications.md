# CONN-04a Task 06 — Notificaciones por nivel

**Domain:** `[BACKEND]` `[NOTIFICATIONS]`  
**Status:** `completed`  
**Depends on:** [Task 05](./task-05-approval-cascade-service.md)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Alertar al aprobador correspondiente cuando una solicitud de tiempo extra llega a su nivel en la cascada.

---

## Scope

### Archivos

- `apps/api/src/overtime/service/overtime-notification.service.ts`
- `apps/api/src/overtime/test/overtime-notification.service.spec.ts`

### Eventos

| Transición                         | Destinatarios (por cargo D4)                                       |
| ---------------------------------- | ------------------------------------------------------------------ |
| → `PENDIENTE_ADMIN`                | Usuarios con cargo `ADMINISTRADOR` en `locationId` de la solicitud |
| → `PENDIENTE_GERENCIA_OPERACIONES` | Usuarios con cargo `DIRECTOR DE OPERACIONES`                       |
| → `PENDIENTE_GERENCIA_GENERAL`     | Usuarios con cargo `GERENTE GENERAL`                               |
| → `OBJETADA`                       | Empleado afectado (opcional log)                                   |
| → `APROBADA`                       | Empleado afectado (opcional log)                                   |

### Implementación

- Buscar módulo `notifications` existente; si no hay, stub con `Logger` (patrón NOM-14).
- Invocar desde `OvertimeDetectionService` (creación) y `OvertimeApprovalService` (transiciones).
- No bloquear transacción principal si falla notificación.

---

## Out of scope

- Email / push.
- Badge count en sidebar web-app.

---

## Files allowed

- `apps/api/src/overtime/service/overtime-notification.service.ts` — create
- `apps/api/src/overtime/test/overtime-notification.service.spec.ts` — create
- Integración en services de tasks 04 y 05

---

## Files forbidden

- `apps/web-app/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Cada transición a estado pendiente dispara notificación al rol correcto.
- [ ] Fallo de notificación no revierte aprobación ni detección.
- [ ] Tests verifican invocación por nivel.

---

## Validation commands

```bash
pnpm --filter=api test -- overtime-notification
```
