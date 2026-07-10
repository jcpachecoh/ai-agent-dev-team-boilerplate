# CONN-04a Task 05 — Cascada de aprobación

**Domain:** `[BACKEND]`  
**Status:** `completed`  
**Depends on:** [Task 04](./task-04-detection-service.md)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Implementar `OvertimeApprovalService` con transiciones de la cascada de 3 niveles y objeción en cualquier paso.

---

## Scope

### Archivos

- `apps/api/src/overtime/service/overtime-approval.service.ts`
- `apps/api/src/overtime/test/overtime-approval.service.spec.ts`

### Métodos

#### `approve(tenantId, actorUserId, overtimeRequestId, comment?)`

| Estado actual                    | Cargo aprobador (D4)         | Nuevo estado                     |
| -------------------------------- | ---------------------------- | -------------------------------- |
| `PENDIENTE_ADMIN`                | `ADMINISTRADOR` (misma sede) | `PENDIENTE_GERENCIA_OPERACIONES` |
| `PENDIENTE_GERENCIA_OPERACIONES` | `DIRECTOR DE OPERACIONES`    | `PENDIENTE_GERENCIA_GENERAL`     |
| `PENDIENTE_GERENCIA_GENERAL`     | `GERENTE GENERAL`            | `APROBADA`                       |

- Registrar `OvertimeApproval` con `decision: APROBADO`, `approverId`, `decidedAt`.
- Precondición: estado coincide con nivel esperado; si no → `BadRequestException`.

#### `object(tenantId, actorUserId, input)`

- `comment` obligatorio (trim no vacío).
- Cualquier estado pendiente → `OBJETADA`.
- Registrar decisión `OBJETADO` en el nivel activo.
- Terminal — no reabrir en MVP.

#### `listInbox(tenantId, actorUserId, filters)`

- Resolver `positionId` del actor vía `EmployeeDetails`.
- Mostrar solicitudes cuyo **nivel activo** coincide con el cargo del actor:
  - `ADMINISTRADOR` → solo `PENDIENTE_ADMIN` de sus sedes (`UserLocation`).
  - `DIRECTOR DE OPERACIONES` → `PENDIENTE_GERENCIA_OPERACIONES`.
  - `GERENTE GENERAL` → `PENDIENTE_GERENCIA_GENERAL`.
- `NOMINA` / `OWNER` / `SUPER_ADMIN` pueden ver histórico completo (solo lectura).

### Excepciones

| Caso                             | Excepción             |
| -------------------------------- | --------------------- |
| Solicitud no encontrada          | `NotFoundException`   |
| Transición inválida              | `BadRequestException` |
| Actor sin cargo del nivel activo | `ForbiddenException`  |
| Administrador de otra sede       | `ForbiddenException`  |
| Objeción sin comentario          | `BadRequestException` |

### Helpers testeables

- `assertActorCanApproveLevel(tenantId, actorUserId, level, locationId?)`
- `resolveActiveApprovalLevel(status): OvertimeApprovalLevel`
- `resolveApproverPositionIds(level): string[]` — constantes D4
- `findUsersByPositionAndLocation(tenantId, positionIds, locationId?)`

---

## Out of scope

- Notificaciones (task 06).
- Endpoints REST (task 08).
- CONN-04b (`SOLICITUD_ADMINISTRATIVA`).

---

## Files allowed

- `apps/api/src/overtime/overtime-approval.constants.ts` — create (position IDs D4)
- `apps/api/src/overtime/service/overtime-approval.service.ts` — create
- `apps/api/src/overtime/test/overtime-approval.service.spec.ts` — create

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/web-app/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Cascada completa Admin → Operaciones → General → `APROBADA`.
- [ ] Objeción en cada uno de los 3 niveles detiene en `OBJETADA`.
- [ ] Actor con cargo incorrecto recibe `ForbiddenException`.
- [ ] Administrador de otra sede no puede aprobar.
- [ ] Tests cubren los 3 puntos de objeción.

---

## Validation commands

```bash
pnpm --filter=api test -- overtime-approval
```
