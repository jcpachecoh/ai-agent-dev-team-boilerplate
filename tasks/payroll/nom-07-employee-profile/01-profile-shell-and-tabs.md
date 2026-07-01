# NOM-07-01 — Shell, ruta y tabs vacíos

**Parent:** `00-epic.md`  
**Status:** `in_progress`  
**Depends on:** ninguna  
**Blocks:** `02`–`08`

---

## Goal

Crear la pantalla base de Perfil de Empleado en Nómina con navegación por tabs usando componentes `empleado` de `@restopsiq/ui`. Cada tab muestra placeholder hasta completar su subtarea.

---

## Scope

- Componentes UI en `packages/ui`:
  - `EmpleadoProfileTab`
  - `EmpleadoProfileTabBar` (6 tabs configurables)
- Pantalla `PayrollEmployeeProfileScreen` en web-app.
- Ruta `/payroll/employees/:userId/profile?tab=<id>`.
- Constantes de tabs (ids, labels, iconos).
- Placeholder por tab (`EmptyState`).
- Carga básica del empleado vía `getPayrollEmployeeByUserId`.
- Header con nombre del colaborador y enlace «Volver a empleados».

---

## Out of Scope

- Contenido real de cada tab (tasks 02–07).
- RBAC granular y enmascaramiento (task 08).
- GraphQL / nuevos endpoints.
- Edición inline del perfil.

---

## Files allowed

- `packages/ui/src/components/empleado/empleado-profile-tab/**`
- `packages/ui/src/components/empleado/empleado-profile-tab-bar/**`
- `packages/ui/src/components/empleado/index.ts`
- `apps/web-app/src/features/payroll/constants/employee-profile-tabs.ts`
- `apps/web-app/src/features/payroll/screens/PayrollEmployeeProfileScreen.tsx`
- `apps/web-app/src/features/payroll/screens/PayrollEmployeeProfileScreen.module.scss`
- `apps/web-app/src/features/payroll/components/PayrollEmployeeProfilePlaceholderTab.tsx`
- `apps/web-app/src/features/payroll/hooks/usePayrollEmployeeQuery.ts`
- `apps/web-app/src/features/payroll/index.ts`
- `apps/web-app/src/pages/PayrollPage/PayrollPage.tsx`

---

## Files forbidden

- `apps/api/**`
- `schema.prisma`, migraciones
- `package.json`, `pnpm-lock.yaml`
- `apps/web-app/src/app.module.ts` (N/A FE)

---

## Acceptance criteria

- [ ] Navegar a `/payroll/employees/:userId/profile` renderiza perfil con 6 tabs.
- [ ] Cambiar tab actualiza query `?tab=` sin recargar.
- [ ] Tabs sin contenido muestran placeholder «Próximamente».
- [ ] Tab bar usa componentes exportados desde `@restopsiq/ui`.
- [ ] `pnpm --filter web-app typecheck` pasa.

---

## Validation

```bash
pnpm --filter web-app typecheck
pnpm --filter @restopsiq/ui typecheck
```
