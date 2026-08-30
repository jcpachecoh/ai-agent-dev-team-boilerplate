# NOM-05 Task 04 — Frontend: rutas protegidas y solo lectura UI

**Domain:** `[FRONTEND]` `[WEB-APP]` `[RBAC]`  
**Status:** `pending`  
**Depends On:** [03-frontend-sidebar-filter.md](./03-frontend-sidebar-filter.md)

---

## Goal

Bloquear navegación directa a rutas no autorizadas y reforzar modo solo lectura para `NOMINA` en pantallas de nómina.

---

## Scope

### Rutas protegidas

- [ ] Crear `apps/web-app/src/components/auth/ProtectedRoute.tsx` (o `ModuleRoute`):
  - Props: `module: AppModule`, `children`.
  - Usa `useModuleAccess(module)`.
  - Si no autorizado → `<Navigate to="/unauthorized" replace />`.
- [ ] Crear página `apps/web-app/src/pages/UnauthorizedPage/UnauthorizedPage.tsx`:
  - Mensaje: _"No tienes permisos para acceder a este módulo."_
  - Botón volver a ruta home de nómina o logout.
- [ ] Registrar ruta `/unauthorized` en `apps/web-app/src/App.tsx`.
- [ ] Envolver rutas en `App.tsx` o layouts por módulo:

| Ruta             | Módulo        |
| ---------------- | ------------- |
| `/payroll/*`     | `NOMINA`      |
| `/inventory/*`   | `INVENTARIOS` |
| `/proveedores/*` | `PROVEEDORES` |
| `/produccion/*`  | `PRODUCCION`  |
| `/empresa/*`     | `EMPRESA`     |
| `/users/*`       | `USUARIOS`    |

- [ ] Redirect post-login para `NOMINA` → `/payroll/employees` (o primera ruta permitida).

### Solo lectura UI (fase 1)

- [ ] En `PayrollEmployeesListScreen` (y modales relacionados):
  - Ocultar botón "Nuevo empleado" si rol es `NOMINA`.
  - Ocultar acciones Editar / Desactivar en tabla.
- [ ] No confiar solo en UI: backend ya rechaza mutaciones (Task 02).

## Out of scope

- Proteger rutas de `apps/plant` o kiosko.
- GraphQL Apollo route guards (web-app usa REST para payroll).
- Rediseño de pantallas de nómina.

## Files allowed

- `apps/web-app/src/components/auth/ProtectedRoute.tsx`
- `apps/web-app/src/pages/UnauthorizedPage/**`
- `apps/web-app/src/App.tsx`
- `apps/web-app/src/features/auth/**` (redirect post-login)
- `apps/web-app/src/features/payroll/screens/PayrollEmployeesListScreen.tsx`
- `apps/web-app/src/features/payroll/components/PayrollEmployeeCreateModal.tsx` (condicional)
- `apps/web-app/src/features/payroll/components/PayrollEmployeesTable.tsx` (ocultar acciones)
- `apps/web-app/src/components/auth/ProtectedRoute.test.tsx`

## Files forbidden

- `packages/ui/**`
- `apps/api/**`
- `package.json`, `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Usuario `NOMINA` que navega a `/inventory/products` → redirige a `/unauthorized`.
- [ ] Usuario `NOMINA` en `/payroll/employees` → ve listado sin botones de crear/editar/desactivar.
- [ ] Usuario `MANAGER` en `/payroll/employees` → sin regresión (CRUD visible).
- [ ] `/unauthorized` renderiza mensaje claro en español.
- [ ] Typecheck web-app en verde.

## Validation commands

```bash
pnpm --filter @restopsiq/web-app test -- src/components/auth/ProtectedRoute.test.tsx
pnpm --filter @restopsiq/web-app typecheck
```

## Manual test

1. Login `nomina@...` / password del seed.
2. Confirmar sidebar y CRUD oculto.
3. Pegar `/inventory` en la barra de direcciones → `/unauthorized`.
