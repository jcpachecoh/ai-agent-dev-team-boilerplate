# NOM-05 Task 03 — Frontend: filtro del menú lateral

**Domain:** `[FRONTEND]` `[WEB-APP]` `[RBAC]`  
**Status:** `pending`  
**Depends On:** [01-rbac-config-matrix.md](./01-rbac-config-matrix.md)

---

## Goal

Mostrar en el sidebar solo las entradas de navegación permitidas para el rol del usuario autenticado. El rol `NOMINA` solo ve el módulo de Nómina (subconjunto de hijos).

---

## Scope

- [ ] Crear hook `apps/web-app/src/hooks/useModuleAccess.ts`:
  - `useModuleAccess(module: AppModule): boolean`
  - Lee `roleCode` desde `useMe()` (o store de auth existente).
  - Delega en `canAccessModule` de `rbac.config.ts`.
- [ ] Crear helper `getVisibleNavigationItems(roleCode, navigationItems)` que filtre módulos padre e hijos.
- [ ] Modificar `apps/web-app/src/components/Sidebar/Sidebar.tsx`:
  - Reemplazar lógica ad-hoc `ADMIN_ONLY_NAV_IDS` por matriz centralizada donde aplique.
  - Ocultar (no deshabilitar) módulos no permitidos.
- [ ] Para rol `NOMINA`, menú visible:
  - **Reportes** (`/payroll`)
  - **Empleados** (`/payroll/employees`)
  - **Monitor de asistencia** (`/payroll/attendance`)
- [ ] Ocultar para `NOMINA`: Salarios, Inventario, Proveedores, Producción, Recetas, Empresa, Usuarios, Configuración, etc.
- [ ] Tras login, usuario `NOMINA` aterriza en ruta por defecto de nómina (ej. `/payroll/employees`).

## Out of scope

- `ProtectedRoute` y deep links (Task 04).
- Ocultar botones de crear/editar en pantallas de nómina (puede ser Task 04 o ticket de solo lectura UI).
- Backend guards (Task 02).

## Files allowed

- `apps/web-app/src/hooks/useModuleAccess.ts`
- `apps/web-app/src/hooks/useModuleAccess.test.ts`
- `apps/web-app/src/config/rbac.config.ts` (solo si hace falta helper de navegación)
- `apps/web-app/src/components/Sidebar/Sidebar.tsx`
- `apps/web-app/src/constants/navigation.ts` (agregar `module: AppModule` en `NavItem` si simplifica el filtro)
- `apps/web-app/src/features/auth/hooks/useMe.ts` (solo lectura; sin cambiar contrato salvo necesidad)

## Files forbidden

- `packages/ui/**`
- `apps/api/**`
- `apps/web-app/src/App.tsx` (Task 04)
- `package.json`, `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Login como `NOMINA` → sidebar muestra únicamente sección Nómina con 3 ítems (sin Salarios).
- [ ] Login como `MANAGER` → sidebar sin regresión (ve módulos según matriz).
- [ ] `useModuleAccess('INVENTARIOS')` retorna `false` para rol `NOMINA` (unit test).
- [ ] No quedan listas de roles hardcodeadas en `Sidebar.tsx` salvo reexport desde config.

## Validation commands

```bash
pnpm --filter @restopsiq/web-app test -- src/hooks/useModuleAccess.test.ts
pnpm --filter @restopsiq/web-app typecheck
```

## Notes

- El componente de UI es `Sidebar` (`@/components/Sidebar`), no `SideMenu`.
- Mantener accesibilidad: ítems ocultos no deben ser focusables.
