# CONN-04a Task 03 — OvertimeRepository

**Domain:** `[BACKEND]`  
**Status:** `completed`  
**Depends on:** [Task 02](./task-02-interfaces.md)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Implementar `OvertimeRepository` con acceso Prisma: CRUD, upsert de acumulado, consultas de bandeja y aprobaciones por nivel.

---

## Scope

### Archivos

- `apps/api/src/overtime/repository/overtime.repository.ts`
- `apps/api/src/overtime/test/overtime.repository.spec.ts`

### Métodos

| Método                                                                          | Comportamiento                                                    |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `findById(tenantId, id)`                                                        | `deletedAt: null`                                                 |
| `findActiveAutomaticByPeriod(tenantId, employeeId, locationId, payrollPeriod)`  | Solicitud `DETECCION_AUTOMATICA` no eliminada                     |
| `createRequest(tenantId, data)`                                                 | Insert con `tenantId`                                             |
| `updateRequest(tenantId, id, data)`                                             | Validar `tenantId` post-update                                    |
| `incrementAccumulatedMinutes(tenantId, id, delta, actualEndTime, shiftEndTime)` | Suma atómica                                                      |
| `listInbox(tenantId, filters)`                                                  | Cursor-based; filtros por `status`, `payrollPeriod`, `locationId` |
| `findApprovalsByRequestId(tenantId, overtimeRequestId)`                         | Orden por `level`                                                 |
| `upsertApproval(tenantId, overtimeRequestId, level, data)`                      | `@@unique` por nivel                                              |

### Reglas

- Toda query incluye `tenantId`.
- No lanzar HTTP exceptions — retornar `null` o resultados vacíos.
- Soft delete: `update({ deletedAt: new Date() })` si se requiere cancelación futura; no `delete()`.

---

## Out of scope

- Lógica de umbral 30 min (task 04).
- Cascada de estados (task 05).
- Controller.

---

## Files allowed

- `apps/api/src/overtime/repository/overtime.repository.ts` — create
- `apps/api/src/overtime/test/overtime.repository.spec.ts` — create

---

## Files forbidden

- `prisma/schema.prisma` (salvo bug crítico)
- `apps/api/src/attendance/**`
- `apps/api/src/payroll/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Tests unitarios con Prisma mockeado (patrón `vacations.repository.spec.ts`).
- [ ] `findActiveAutomaticByPeriod` filtra por `tenantId`, `type`, `payrollPeriod`.
- [ ] `incrementAccumulatedMinutes` actualiza `actualEndTime` y `shiftEndTime`.
- [ ] Cobertura repository ≥ 80% branches.

---

## Validation commands

```bash
pnpm --filter=api test -- overtime.repository
node scripts/validate-structure.js
```
