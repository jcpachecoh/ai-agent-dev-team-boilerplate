# OS-589 Task 03 — Repository Prisma

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 02](./task-02-interfaces.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Implementar `VacationsRepository` con acceso Prisma a saldos, solicitudes y consultas de rangos aprobados (para integración con asistencia).

---

## Scope

### Archivos

- `apps/api/src/vacations/repository/vacations.repository.ts`
- `apps/api/src/vacations/test/vacations.repository.spec.ts`

### Métodos (`IVacationsRepository`)

| Método                          | Reglas                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findBalanceByEmployee`         | `where: { tenantId, employeeId, ... }`                                                                                                                                |
| `upsertBalance`                 | Upsert por `tenantId + employeeId`                                                                                                                                    |
| `createRequest`                 | Insert con `status: SOLICITADA`                                                                                                                                       |
| `findRequestById`               | `findFirst` con `tenantId`, `id`, `isActive: true`                                                                                                                    |
| `updateRequest`                 | Update parcial (estado, aprobadores, carta)                                                                                                                           |
| `listRequests`                  | Filtros + orden `createdAt desc`; cursor-based si `take` provisto                                                                                                     |
| `findApprovedDisfruteRanges`    | Solo `type: DISFRUTE`, `status: APROBADA`, rango solapado con `[dateFrom, dateTo]`                                                                                    |
| `findApprovedDisfruteByDate`    | Un empleado + una fecha dentro del rango aprobado                                                                                                                     |
| `findSubordinatePositionIds`    | BFS transitivo sobre `EmployeePositionSupervisor` desde `supervisorPositionId` (mismo algoritmo que `AttendanceCollaboratorsRepository` — requerido por D9 / task 05) |
| `findEmployeeApprovalContext`   | `EmployeeDetails` del solicitante: `userId`, `locationId`, `positionId` (helper para L1)                                                                              |
| `findActiveEmployeesForAccrual` | Empleados activos con `id`, `hireDate` para el job de acumulación (D3)                                                                                                |

### Reglas obligatorias

- **Toda** query incluye `tenantId`.
- Repository **no** lanza HTTP exceptions; retorna `null` o datos.
- Soft delete: filtrar `isActive: true` en lecturas; desactivar con `isActive: false` (nunca `.delete()`).
- No lógica de negocio (validación de saldo, transiciones de estado → service).

### Tests unitarios (mínimo)

- `findBalanceByEmployee` filtra por `tenantId`.
- `findApprovedDisfruteRanges` solo retorna `DISFRUTE` + `APROBADA`.
- `findRequestById` retorna `null` si `isActive: false`.

---

## Out of scope

- `VacationsService` (task 05).
- Job de acumulación (task 04).
- Controller/resolver (task 08).
- `vacations.module.ts` wiring completo (task 08).

---

## Files allowed

- `apps/api/src/vacations/repository/vacations.repository.ts` — create
- `apps/api/src/vacations/test/vacations.repository.spec.ts` — create

---

## Files forbidden

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `apps/api/src/attendance/**` (task 07)
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] `VacationsRepository` implementa `IVacationsRepository`.
- [ ] Queries con `tenantId` verificadas en tests.
- [ ] `findApprovedDisfruteRanges` listo para consumo por asistencia (PC-1).
- [ ] `pnpm --filter=api test -- vacations.repository.spec` pasa.

---

## Validation commands

```bash
pnpm --filter=api test -- vacations.repository.spec
node scripts/validate-structure.js
```
