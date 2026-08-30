# Task: Nómina Web-App — Crear, Editar y Desactivar Empleados

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[CRUD]` `[FORMS]`
**Assigned Agent:** frontend-developer
**Status:** `pending`
**Created:** 2026-06-11
**Depends On:** `tasks/payroll/02-payroll-employees-list-and-filters.md`

---

## Context

Una vez disponible el listado, se debe completar el CRUD: crear empleado, editar `employeeDetails` y desactivar (soft delete).

---

## Requirements

- [ ] Implementar formulario de creación con campos obligatorios del backend (`CreateEmployeeDto`).
- [ ] Implementar formulario de edición con campos permitidos por `UpdateEmployeeDto`.
- [ ] Implementar acción de desactivar empleado con confirmación explícita.
- [ ] Mapear y mostrar errores de validación de negocio (ley Colombia) devueltos por API.
- [ ] Agregar notificaciones de éxito/error y refresco automático del listado.

---

## Acceptance Criteria

- [ ] Crear empleado persiste y aparece en listado sin recargar manualmente.
- [ ] Editar empleado actualiza la fila y/o detalle correctamente.
- [ ] Desactivar empleado lo excluye del listado por defecto y aparece al activar `includeInactive`.
- [ ] Mensajes de validación se muestran al usuario en español y en contexto del campo o formulario.

---

## Files to Create or Modify

- `apps/web-app/src/features/payroll/components/PayrollEmployeeForm.tsx`
- `apps/web-app/src/features/payroll/components/PayrollEmployeeCreateModal.tsx`
- `apps/web-app/src/features/payroll/components/PayrollEmployeeEditDrawer.tsx`
- `apps/web-app/src/features/payroll/components/PayrollDeactivateEmployeeDialog.tsx`
- `apps/web-app/src/features/payroll/hooks/usePayrollEmployeeMutations.ts`
- `apps/web-app/src/features/payroll/validation/payrollEmployee.schema.ts`

---

## Notes

- La regla de negocio final la decide backend; frontend debe reflejar errores y prevenir casos triviales.
- Evitar duplicar mapping de payload: centralizar serialización en helper del feature.
