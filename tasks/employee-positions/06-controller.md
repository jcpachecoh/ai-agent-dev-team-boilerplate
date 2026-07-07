# EMP-POS-01 Task 06 — `EmployeePositionsController` (REST)

## Goal

Exponer CRUD REST del catálogo de cargos siguiendo el patrón de `EmployeeCatalogController`.

**Depends on:** Task 04 (service), Task 05 (DTOs).

---

## Scope

- `apps/api/src/payroll/controller/employee-positions.controller.ts`
- `apps/api/src/payroll/test/employee-positions.controller.spec.ts`

---

## Out of scope

- GraphQL resolver (Task 07).
- Module wiring (Task 09).

---

## Files allowed

- `apps/api/src/payroll/controller/employee-positions.controller.ts` — create
- `apps/api/src/payroll/test/employee-positions.controller.spec.ts` — create

---

## Endpoints

| Method | Path                                                       | Descripción                                    |
| ------ | ---------------------------------------------------------- | ---------------------------------------------- |
| GET    | `/employee-positions`                                      | Listar cargos (`?includeInactive&area&search`) |
| GET    | `/employee-positions/:id`                                  | Detalle de cargo                               |
| POST   | `/employee-positions`                                      | Crear cargo                                    |
| PATCH  | `/employee-positions/:id`                                  | Actualizar cargo                               |
| PATCH  | `/employee-positions/:id/deactivate`                       | Desactivar cargo (`isActive=false`)            |
| GET    | `/employee-positions/employees/:employeeDetailsId/history` | Historial de cargos del empleado               |

### Guards

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES) // lectura
@Roles(...PAYROLL_WRITE_ROLES)  // escritura
```

Extraer `tenantId` de `@CurrentUser()` — no del body.

---

## Acceptance criteria

- [ ] Controller inyecta solo `EmployeePositionsService`.
- [ ] Sin lógica de negocio en controller.
- [ ] Tests mock del service (8+ casos).
- [ ] Swagger tags `employee-positions`.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-positions.controller
```
