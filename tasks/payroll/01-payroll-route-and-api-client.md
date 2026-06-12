# Task: Nómina Web-App — Ruta y Cliente API Base

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[API]`
**Assigned Agent:** frontend-developer
**Status:** `pending`
**Created:** 2026-06-11
**Depends On:** `none`

---

## Context

Se requiere crear una interfaz de nómina en `apps/web-app` para gestionar CRUD de empleados con base en `employeeDetails`.
El backend ya expone endpoints REST en `/api/employees` (create/list/detail/update/delete) con `x-tenant-id` y JWT.

---

## Requirements

- [ ] Definir la nueva ruta funcional de nómina en frontend (`/payroll/employees`) manteniendo compatibilidad con `/payroll`.
- [ ] Crear cliente API tipado para empleados en `apps/web-app` con operaciones: list, getByUserId, create, update, remove.
- [ ] Modelar tipos frontend alineados al payload de `EmployeeResponseDto` y DTOs de create/update.
- [ ] Integrar manejo de `x-tenant-id` y token en todas las llamadas.
- [ ] Definir query keys para React Query (listado, detalle, filtros).

---

## Acceptance Criteria

- [ ] Navegar a `/payroll/employees` renderiza la nueva pantalla base (no placeholder genérico).
- [ ] Existe módulo API reutilizable para empleados sin lógica duplicada en componentes.
- [ ] Todas las llamadas a payroll usan cabeceras de autenticación + tenant.
- [ ] Typecheck sin errores en `@restopsiq/web-app`.

---

## Files to Create or Modify

- `apps/web-app/src/App.tsx` — registrar ruta real de empleados de nómina.
- `apps/web-app/src/pages/PayrollPage/PayrollPage.tsx` — dejar de usar placeholder para empleados.
- `apps/web-app/src/features/payroll/api/payroll.client.ts` — cliente HTTP de empleados.
- `apps/web-app/src/features/payroll/api/queryKeys.ts` — claves de cache React Query.
- `apps/web-app/src/features/payroll/types/payroll.types.ts` — tipos FE de request/response.
- `apps/web-app/src/features/payroll/index.ts` — barrel exports del feature.

---

## Notes

- Usar patrón ya existente en módulos de `inventory`/`produccion` para estructura de feature.
- Si hay discrepancias de contrato FE/BE, documentarlas en esta task antes de seguir a la Task 02.
