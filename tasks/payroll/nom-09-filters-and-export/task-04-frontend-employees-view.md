# Task 04 — Frontend: filtros y export en listado de empleados

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PAYROLL]`  
**Status:** `pending`  
**Depends on:** [task-02-backend-export-endpoints.md](./task-02-backend-export-endpoints.md), [task-03-frontend-shared-filter-export-ui.md](./task-03-frontend-shared-filter-export-ui.md)  
**Epic:** NOM-09

---

## Goal

Completar los **filtros** del listado de empleados (`/payroll/employees`) y conectar la **exportación PDF/Excel** de los resultados filtrados.

---

## Scope

### Filtros a exponer en UI

| Filtro                 | Estado actual          | Acción                                                                            |
| ---------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| Sede (`locationId`)    | Parcial en toolbar     | Mantener; enviar al backend y al export                                           |
| Tipo contrato          | Parcial                | Mantener                                                                          |
| Estado activo/inactivo | Local (`statusFilter`) | Enviar `isActive` al backend si el API lo soporta; si no, extender API en task 02 |
| Búsqueda texto         | Solo local             | Mover a server-side `search` param en query + export                              |
| Cargo (`positionId`)   | No existe              | Añadir select desde catálogo de cargos                                            |
| Área / departamento    | No existe              | Añadir según contrato API task 02                                                 |

### Pantalla

- Integrar `PayrollFilterBar` + `PayrollExportMenu` en `PayrollEmployeesListScreen`.
- Al exportar, serializar **estado actual de filtros** (no solo página visible).
- Nombre archivo sugerido: `empleados-<sede|todas>-<YYYY-MM-DD>.pdf|xlsx`.

### Hook

- Extender `usePayrollEmployeesFilters` con nuevos campos y `exportFilters` memoizado para el client de export.

### Columnas exportadas (paridad tabla)

Alinear con columnas visibles en `EmpleadoTable`:

- Nombre, documento, cargo, área, departamento, tipo contrato, sede, estado, salario (si visible según RBAC).

---

## Out of scope

- Export desde perfil de empleado individual.
- Cambios en modal crear/editar empleado.
- Backend (salvo coordinación de contrato con task 02).

---

## Files allowed

- `apps/web-app/src/features/payroll/screens/PayrollEmployeesListScreen.tsx`
- `apps/web-app/src/features/payroll/hooks/usePayrollEmployeesFilters.ts`
- `apps/web-app/src/features/payroll/hooks/usePayrollEmployeesQuery.ts`
- `apps/web-app/src/features/payroll/types/payroll.types.ts` (solo filtros)
- `apps/web-app/src/features/payroll/api/payroll.client.ts` (solo si no cubierto en task 03)
- Componentes de task 03 (importar, no modificar salvo bugfix)

## Files forbidden

- `apps/api/**`
- `schema.prisma`
- `package.json`, `pnpm-lock.yaml`
- Otras pantallas de nómina

---

## Acceptance criteria

- [ ] Usuario filtra por sede, contrato, estado, cargo/área y búsqueda; la tabla refleja resultados del servidor.
- [ ] Export PDF descarga archivo con **solo** empleados que coinciden con filtros activos.
- [ ] Export Excel contiene las mismas filas y columnas visibles.
- [ ] Cambiar filtro y exportar sin refrescar manualmente produce archivo actualizado.
- [ ] Paginación en pantalla no limita el export (export = dataset filtrado completo hasta límite BE).
- [ ] Estados loading/empty/error sin regresiones.

---

## Validation commands

```bash
pnpm --filter web-app typecheck
pnpm lint
```

Manual:

1. Filtrar empleados por sede A → exportar PDF → verificar solo sede A.
2. Añadir filtro inactivos → export Excel → contar filas vs tabla (sin paginación).
3. Rol sin permiso escritura puede exportar si tiene lectura nómina (según RBAC definido).
