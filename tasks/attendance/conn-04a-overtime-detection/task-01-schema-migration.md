# CONN-04a Task 01 — Schema Prisma y migración

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `completed`  
**Depends on:** —  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Agregar al schema Prisma los modelos `OvertimeRequest`, `OvertimeApproval` y enums asociados según el epic, generar migración SQL.

---

## Scope

### Enums

```prisma
enum OvertimeRequestType {
  DETECCION_AUTOMATICA
  SOLICITUD_ADMINISTRATIVA
}

enum OvertimeStatus {
  PENDIENTE_ADMIN
  PENDIENTE_GERENCIA_OPERACIONES
  PENDIENTE_GERENCIA_GENERAL
  APROBADA
  OBJETADA
}

enum OvertimeApprovalLevel {
  ADMINISTRADOR
  GERENCIA_OPERACIONES
  GERENCIA_GENERAL
}

enum OvertimeApprovalDecision {
  APROBADO
  OBJETADO
}
```

### Modelo `OvertimeRequest`

| Campo                     | Tipo / notas                                        |
| ------------------------- | --------------------------------------------------- |
| `tenantId`                | String, índice obligatorio                          |
| `employeeId`              | FK `EmployeeDetails.id`, `onDelete: Restrict`       |
| `locationId`              | FK `Location.id`, `onDelete: Restrict`              |
| `type`                    | `OvertimeRequestType`                               |
| `shiftEndTime`            | DateTime                                            |
| `actualEndTime`           | DateTime — última salida que actualizó el acumulado |
| `accumulatedMinutes`      | Int                                                 |
| `status`                  | `OvertimeStatus` `@default(PENDIENTE_ADMIN)`        |
| `payrollPeriod`           | String? — ej. `2026-07`                             |
| `deletedAt`               | DateTime? (soft delete)                             |
| `createdAt` / `updatedAt` | DateTime                                            |

`@@unique([tenantId, employeeId, locationId, payrollPeriod, type])` para una solicitud automática por empleado/sede/período.

### Modelo `OvertimeApproval`

| Campo               | Tipo / notas                                 |
| ------------------- | -------------------------------------------- |
| `tenantId`          | String, índice obligatorio                   |
| `overtimeRequestId` | FK `OvertimeRequest.id`, `onDelete: Cascade` |
| `level`             | `OvertimeApprovalLevel`                      |
| `approverId`        | String? — `User.id`                          |
| `decision`          | `OvertimeApprovalDecision?`                  |
| `decidedAt`         | DateTime?                                    |
| `comment`           | String?                                      |

`@@unique([overtimeRequestId, level])`

### Relaciones inversas

- `EmployeeDetails.overtimeRequests OvertimeRequest[]`
- `Location.overtimeRequests OvertimeRequest[]` (si el modelo `Location` lo permite)

### Índices

Según epic: `tenantId`, compuestos por `employeeId`, `locationId`, `status`, `payrollPeriod`, `deletedAt`.

### Migración

- Nombre sugerido: `overtime_requests`.
- SQL solo de esta task.
- No ejecutar `prisma migrate dev` salvo instrucción explícita.

---

## Out of scope

- Repository, service, controller.
- Seeds de permisos RBAC (task 08).
- Integración liquidación.

---

## Files allowed

- `prisma/schema.prisma` — modify
- `prisma/migrations/**` — create

---

## Files forbidden

- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/**`
- `apps/web-app/**`
- `packages/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Modelos y enums en `schema.prisma` con convenciones multi-tenant.
- [ ] Migración SQL creada y revisada.
- [ ] `pnpm prisma format` y `pnpm prisma validate` pasan.
- [ ] `pnpm prisma generate` ejecutado localmente.

---

## Validation commands

```bash
pnpm prisma format
pnpm prisma validate
pnpm prisma generate
```
