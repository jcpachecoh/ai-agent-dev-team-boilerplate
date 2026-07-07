# Task: Nómina Web-App — QA, Tests y Despliegue

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[TEST]`
**Assigned Agent:** test-engineer, frontend-developer
**Status:** `pending`
**Created:** 2026-06-11
**Depends On:** `tasks/payroll/03-payroll-employee-create-update-delete.md`

---

## Context

La nueva interfaz de nómina debe entrar a CI con cobertura y pruebas funcionales del flujo CRUD.

---

## Requirements

- [ ] Crear tests unitarios/integración para listado, filtros y CRUD de empleados.
- [ ] Validar guard de autenticación en la ruta de nómina.
- [ ] Agregar pruebas de errores API (400/401/403/409/422) y estados vacíos.
- [ ] Verificar responsive básico (desktop + tablet) para la pantalla de empleados.
- [ ] Preparar checklist de salida para staging.

---

## Acceptance Criteria

- [ ] Tests de nómina pasan en `@restopsiq/web-app` sin flaky failures.
- [ ] Flujo CRUD validado end-to-end contra API local/staging.
- [ ] La calidad de código mantiene o mejora la cobertura del frontend.
- [ ] Checklist de release completado con evidencia de pruebas.

---

## Files to Create or Modify

- `apps/web-app/src/features/payroll/screens/PayrollEmployeesListScreen.test.tsx`
- `apps/web-app/src/features/payroll/components/PayrollEmployeeForm.test.tsx`
- `apps/web-app/src/features/payroll/hooks/usePayrollEmployeeMutations.test.ts`
- `apps/web-app/src/pages/PayrollPage/PayrollPage.test.tsx`
- `apps/web-app/src/routes/RequireAuth.test.tsx` — ampliar casos para payroll si aplica.

---

## Notes

- Priorizar tests de comportamiento de usuario sobre snapshots.
- Mockear API en pruebas unitarias y usar entorno real solo para smoke funcional.
