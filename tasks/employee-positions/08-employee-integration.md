# EMP-POS-01 Task 08 — Integración con empleados (`PayrollService`)

## Goal

Vincular `EmployeeDetails.positionId` al crear/actualizar empleados y registrar historial de cargos.

**Depends on:** Task 04 (`EmployeePositionsService.assignPositionToEmployee`).

---

## Scope

- Extender `CreateEmployeeDto` / `UpdateEmployeeDto` con `positionId?: string`.
- Extender inputs GraphQL `CreateEmployeeInput` / `UpdateEmployeeInput`.
- Modificar `PayrollService.create()` y `PayrollService.update()` para delegar asignación de cargo.
- Extender `PayrollRepository` si hace falta método `updateEmployeePosition`.
- Tests en `payroll.service.spec.ts` para flujo positionId.

---

## Out of scope

- UI frontend (Task 10).
- Catálogo CRUD (Tasks 03–07).

---

## Files allowed

- `apps/api/src/payroll/interfaces/payroll.interfaces.ts`
- `apps/api/src/payroll/controller/dto/create-employee.dto.ts`
- `apps/api/src/payroll/controller/dto/update-employee.dto.ts`
- `apps/api/src/payroll/resolver/employees.resolver.ts` (inputs GraphQL)
- `apps/api/src/payroll/service/payroll.service.ts`
- `apps/api/src/payroll/repository/payroll.repository.ts`
- `apps/api/src/payroll/test/payroll.service.spec.ts`
- `apps/api/src/payroll/test/employee.e2e-spec.ts` (casos positionId si aplica)

---

## Implementation notes

### Flujo create employee

```
1. Crear User + EmployeeDetails (position string legacy = title del cargo o fallback)
2. Si input.positionId presente:
   a. employeePositionsService.assignPositionToEmployee(tenantId, employeeId, positionId, requesterId)
3. Retornar empleado con positionRef incluido en response mapper
```

### Flujo update employee

```
1. Si positionId cambió respecto al valor actual:
   a. assignPositionToEmployee (cierra historial + abre nuevo)
2. Si positionId removido (null) — fuera de scope MVP; rechazar con BadRequest o mantener cargo actual
```

### Compatibilidad

- Si solo llega `position` string (legacy) sin `positionId` — mantener comportamiento actual.
- Si llega `positionId` — ignorar `position` del body o validar que coincidan.

### Mapper

Extender `employees.mapper.ts` para incluir:

```typescript
positionId?: string | null;
positionTitle?: string; // desde positionRef.title
```

---

## Acceptance criteria

- [ ] `createEmployee` acepta `positionId` opcional.
- [ ] `updateEmployee` cambia cargo y genera historial.
- [ ] `GET employee` / GraphQL `employee` expone `positionId`.
- [ ] Tests payroll.service cubren asignación y cambio de cargo.
- [ ] Empleados existentes sin `positionId` siguen funcionando.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=payroll.service
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee.e2e
```
