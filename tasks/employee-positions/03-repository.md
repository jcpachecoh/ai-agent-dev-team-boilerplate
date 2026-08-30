# EMP-POS-01 Task 03 — `EmployeePositionsRepository` + Unit Tests

## Goal

Implementar acceso Prisma para cargos e historial. Sin lógica de negocio ni excepciones HTTP.

**Depends on:** Task 01b, Task 02.

---

## Scope

- `apps/api/src/payroll/repository/employee-positions.repository.ts`
- `apps/api/src/payroll/test/employee-positions.repository.spec.ts`

---

## Out of scope

- Service, controller, resolver.
- Validación de empleados activos (service).

---

## Files allowed

- `apps/api/src/payroll/repository/employee-positions.repository.ts` — create
- `apps/api/src/payroll/test/employee-positions.repository.spec.ts` — create

---

## Files forbidden

- `payroll.module.ts` — Task 09
- `schema.prisma`

---

## Implementation notes

Queries siempre filtran `tenantId`.

Métodos clave:

- `findAll` — `where: { tenantId, ...(includeInactive ? {} : { isActive: true }) }`, búsqueda por `title`/`area` con `contains` insensitive.
- `countActiveEmployeesByPosition` — `employeeDetails.count({ where: { tenantId, positionId, isActive: true, deletedAt: null } })`.
- `closeOpenHistory` — `updateMany` donde `effectiveTo IS NULL`.
- `createHistoryEntry` — insert en `employeePositionHistory`.

### Tests mínimos (12+)

- `findAll` activos por defecto.
- `findById` null cuando no existe.
- `create` persiste con `tenantId`.
- `update` parcial.
- `deactivate` → `isActive: false`.
- `countActiveEmployeesByPosition`.
- `findHistoryByEmployee` ordenado por `effectiveFrom desc`.
- `closeOpenHistory` cierra registro abierto.
- `createHistoryEntry` inserta fila.

---

## Acceptance criteria

- [ ] Implementa `IEmployeePositionsRepository`.
- [ ] Solo inyecta `PrismaService`.
- [ ] Sin excepciones HTTP.
- [ ] 12+ tests pasan.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-positions.repository
```
