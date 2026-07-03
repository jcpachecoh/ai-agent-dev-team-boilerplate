# EMP-POS-01 Task 07 — `EmployeePositionsResolver` (GraphQL)

## Goal

Exponer queries y mutations GraphQL para el catálogo de cargos, alineado con `EmployeesResolver`.

**Depends on:** Task 04 (service), Task 05 (tipos de validación como referencia).

---

## Scope

- `apps/api/src/payroll/resolver/employee-positions.resolver.ts`
- DTOs GraphQL en `apps/api/src/payroll/resolver/dto/` (o reutilizar patrones inline como `employees.resolver.ts`)
- `apps/api/src/payroll/test/employee-positions.resolver.spec.ts`

---

## Out of scope

- Module wiring (Task 09).

---

## GraphQL operations

| Tipo     | Operación                                          | Return                        |
| -------- | -------------------------------------------------- | ----------------------------- |
| Query    | `employeePositions(includeInactive, area, search)` | `[EmployeePosition!]!`        |
| Query    | `employeePosition(id)`                             | `EmployeePosition`            |
| Query    | `employeePositionHistory(employeeDetailsId)`       | `[EmployeePositionHistory!]!` |
| Mutation | `createEmployeePosition(input)`                    | `EmployeePosition`            |
| Mutation | `updateEmployeePosition(id, input)`                | `EmployeePosition`            |
| Mutation | `deactivateEmployeePosition(id)`                   | `EmployeePosition`            |

### Guards

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
```

---

## Acceptance criteria

- [ ] Resolver no importa repository.
- [ ] `tenantId` desde JWT/context.
- [ ] 6+ tests del resolver.
- [ ] Schema GraphQL generado incluye tipos nuevos.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-positions.resolver
```
