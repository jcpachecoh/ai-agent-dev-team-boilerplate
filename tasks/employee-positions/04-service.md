# EMP-POS-01 Task 04 — `EmployeePositionsService` + Unit Tests

## Goal

Reglas de negocio del catálogo de cargos: unicidad, desactivación segura, asignación con historial.

**Depends on:** Task 02, Task 03.

---

## Scope

- `apps/api/src/payroll/service/employee-positions.service.ts`
- `apps/api/src/payroll/test/employee-positions.service.spec.ts`

---

## Out of scope

- Controller/resolver.
- Cambios a `PayrollService` (Task 08).

---

## Files allowed

- `apps/api/src/payroll/service/employee-positions.service.ts` — create
- `apps/api/src/payroll/test/employee-positions.service.spec.ts` — create

---

## Business rules

| Operación                  | Regla                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create`                   | `title` único por tenant; `baseSalaryRange >= 0`                                                                                                              |
| `update`                   | Si cambia `title`, validar unicidad                                                                                                                           |
| `deactivate`               | `countActiveEmployeesByPosition === 0` o `ConflictException`                                                                                                  |
| `assignPositionToEmployee` | Cargo debe existir y `isActive`; cerrar historial abierto; crear nuevo; actualizar `EmployeeDetails.positionId` + `position` snapshot vía `PayrollRepository` |

### Excepciones

```typescript
throw new NotFoundException(`Employee position "${id}" not found`);
throw new ConflictException('An active employee position with this title already exists');
throw new ConflictException('Cannot deactivate position with active employees assigned');
throw new BadRequestException('baseSalaryRange must be greater than or equal to 0');
throw new BadRequestException('Cannot assign an inactive position to an employee');
```

### Tests mínimos (14+)

- create happy path.
- create duplicate title → ConflictException.
- update title.
- deactivate sin empleados → ok.
- deactivate con empleados activos → ConflictException.
- assignPositionToEmployee crea historial.
- assignPositionToEmployee cierra historial previo.
- assign cargo inactivo → BadRequestException.
- findById not found → NotFoundException.
- getEmployeePositionHistory.

---

## Acceptance criteria

- [ ] Implementa `IEmployeePositionsService`.
- [ ] Cobertura service ≥ 80%.
- [ ] 14+ tests pasan.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-positions.service --coverage
```
