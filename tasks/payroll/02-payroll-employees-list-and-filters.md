# Task: Nómina Web-App — Listado de Empleados y Filtros

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[CRUD]`
**Assigned Agent:** frontend-developer
**Status:** `pending`
**Created:** 2026-06-11
**Depends On:** `tasks/payroll/01-payroll-route-and-api-client.md`

---

## Context

Con el cliente API listo, se debe implementar la vista principal de empleados sobre `employeeDetails`, incluyendo filtros y estados UX (loading/empty/error).

---

## Requirements

- [ ] Construir pantalla de listado con tabla de empleados y columnas clave (nombre, cédula, cargo, tipo contrato, sede, estado).
- [ ] Implementar filtros por `locationId`, `contractType`, `isActive` e `includeInactive`.
- [ ] Implementar búsqueda local o server-side por texto (nombre/cédula/email, según contrato disponible).
- [ ] Soportar paginación (`limit`, `offset`) con controles de navegación.
- [ ] Añadir acciones por fila: ver detalle, editar, desactivar.

---

## Acceptance Criteria

- [ ] La pantalla muestra data real desde `/api/employees`.
- [ ] Cambiar filtros actualiza los resultados correctamente.
- [ ] Loading skeleton, estado vacío y estado de error están implementados.
- [ ] Refetch y cache invalidation funcionan de forma predecible.

---

## Files to Create or Modify

- `apps/web-app/src/features/payroll/screens/PayrollEmployeesListScreen.tsx`
- `apps/web-app/src/features/payroll/components/PayrollEmployeesTable.tsx`
- `apps/web-app/src/features/payroll/components/PayrollEmployeesFilters.tsx`
- `apps/web-app/src/features/payroll/hooks/usePayrollEmployeesQuery.ts`
- `apps/web-app/src/features/payroll/hooks/usePayrollEmployeesFilters.ts`
- `apps/web-app/src/pages/PayrollPage/PayrollPage.tsx`

---

## Notes

- Reutilizar componentes de UI existentes del design system (`@restopsiq/ui`) antes de crear nuevos.
- Priorizar responsive desktop/tablet.
