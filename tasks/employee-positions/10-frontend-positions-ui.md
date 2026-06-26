# EMP-POS-01 Task 10 — Frontend: dropdown de cargos (web-app)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PAYROLL]`  
**Status:** `pending`  
**Depends on:** Tasks 06–08 (API disponible)

---

## Goal

Reemplazar el input libre de **cargo** en el formulario de empleados por un **dropdown dinámico** que consume `employee_positions` (solo activos).

---

## Scope

- API client + React Query hooks para cargos.
- Actualizar `PayrollEmployeeForm` para usar `positionId`.
- Pantalla opcional de administración de catálogo de cargos (listado + CRUD básico).

---

## Out of scope

- Cambios al backend.
- `packages/**` salvo si se requiere componente UI genérico ya existente.

---

## Files allowed

- `apps/web-app/src/features/payroll/api/employee-positions.api.ts` — create
- `apps/web-app/src/features/payroll/hooks/useEmployeePositions.ts` — create
- `apps/web-app/src/features/payroll/hooks/useEmployeePositionMutations.ts` — create (admin CRUD)
- `apps/web-app/src/features/payroll/types/employee-position.types.ts` — create
- `apps/web-app/src/features/payroll/components/PayrollEmployeeForm.tsx` — modify
- `apps/web-app/src/features/payroll/validation/payrollEmployee.schema.ts` — modify
- `apps/web-app/src/features/payroll/api/queryKeys.ts` — extend
- Opcional: `apps/web-app/src/features/payroll/components/EmployeePositionsAdmin.tsx`

---

## API consumption

### REST (preferido, alineado a employee-catalogs)

```typescript
GET /api/employee-positions?includeInactive=false
GET /api/employee-positions/:id
POST /api/employee-positions
PATCH /api/employee-positions/:id
PATCH /api/employee-positions/:id/deactivate
```

### Payload empleado

```typescript
// create/update employee
{
  positionId: 'pos-uuid',
  // position string ya no se envía manualmente cuando hay catálogo
}
```

---

## UI requirements

### Formulario empleado (`PayrollEmployeeForm`)

| Antes                                   | Después                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| `<input name="position" />` texto libre | `<select>` con cargos activos (`title` + `area` en label) |
| —                                       | Mostrar `baseSalaryRange` como hint al seleccionar cargo  |
| —                                       | Loading / empty / error states                            |

Label sugerido: `"Desarrollador Senior — Administración"`.

### Admin catálogo (opcional MVP+)

- Tabla de cargos con crear/editar/desactivar.
- Confirmación antes de desactivar.
- Mensaje claro si API retorna conflicto por empleados activos.

---

## Tests FE

- `employee-positions.api.test.ts` — mock fetch.
- Actualizar `PayrollEmployeeForm.test.tsx` — mock `useEmployeePositions`.

---

## Acceptance criteria

- [ ] Dropdown carga cargos activos del tenant.
- [ ] Crear/editar empleado envía `positionId`.
- [ ] Campo cargo texto libre eliminado o marcado deprecated en UI.
- [ ] Estados loading/error/empty implementados.
- [ ] `pnpm --filter=@restopsiq/web-app typecheck` pasa.
- [ ] Tests FE pasan.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/web-app typecheck
pnpm --filter=@restopsiq/web-app test -- employee-position
```
