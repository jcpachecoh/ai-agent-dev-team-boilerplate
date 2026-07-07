# EMP-POS-10 — Frontend: Gestión de Cargos (Nómina)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[UI]` `[PAYROLL]` `[CRUD]`  
**Issue:** OS-565 (backend)  
**Status:** `pending`  
**Depends on:** Backend OS-565 (`GET/POST/PATCH /employee-positions`, desactivación con validación de empleados asociados)  
**Epic:** Employee Positions — Catálogo de cargos  
**Reference UI:** `PayrollEmployeesListScreen` + componentes `Empleado*` en `@restopsiq/ui`

---

## Goal

Crear la sección **Gestión de Cargos** dentro del módulo de Nómina: pantalla de listado con tabla, búsqueda, paginación, CRUD completo (crear / editar / desactivar) y estados UX (loading, empty, error, toasts).

**Principio de diseño:** reutilizar la **misma estructura visual** que la tabla de empleados (`EmpleadoPage`, header, métricas, toolbar, tabla, modal/drawer, diálogo de confirmación). Cambiar **solo** colores de acento, textos, columnas, botones y formulario — no inventar un layout nuevo.

---

## Contexto

| Referencia existente                                                                                                                                                                            | Uso en esta task                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `PayrollEmployeesListScreen.tsx`                                                                                                                                                                | Blueprint de composición de pantalla            |
| `EmpleadoPage`, `EmpleadoPageHeader`, `EmpleadoPageSection`, `EmpleadoListToolbar`, `EmpleadoTable`, `EmpleadoModal`, `EmpleadoActionButton`, `EmpleadoPagination`, `RecetaMetricCard`, `toast` | Reutilizar patrón; variante de color distinta   |
| `PayrollEmployeeCreateModal` / `PayrollEmployeeEditDrawer`                                                                                                                                      | Patrón modal (crear) + drawer (editar)          |
| `PayrollDeactivateEmployeeDialog`                                                                                                                                                               | Patrón diálogo de desactivación con advertencia |
| `payroll.client.ts` + React Query hooks                                                                                                                                                         | Patrón API client + mutations                   |

### API backend esperada (OS-565)

| Método  | Ruta                                                                | Uso               |
| ------- | ------------------------------------------------------------------- | ----------------- |
| `GET`   | `/employee-positions?includeInactive=&area=&search=&limit=&offset=` | Listado + filtros |
| `POST`  | `/employee-positions`                                               | Crear cargo       |
| `PATCH` | `/employee-positions/:id`                                           | Actualizar cargo  |
| `PATCH` | `/employee-positions/:id/deactivate`                                | Desactivar (soft) |

**Payload create/update:**

```typescript
{
  title: string;           // Nombre del cargo
  area: string;            // Área / departamento
  baseSalaryRange: number; // Salario base (decimal)
  isActive?: boolean;      // Solo en update; create default true
}
```

**Respuesta posición:**

```typescript
{
  id: string;
  tenantId: string;
  title: string;
  area: string;
  baseSalaryRange: string; // decimal serializado
  isActive: boolean;
  employeeCount?: number;  // empleados activos con positionId — para advertencia
  createdAt: string;
  updatedAt: string;
}
```

Si el backend devuelve `409 Conflict` o mensaje de negocio al desactivar un cargo con empleados, el frontend debe mostrar la advertencia antes de confirmar (pre-check vía `employeeCount` si está disponible).

---

## Scope

### 1. UI kit (`packages/ui`) — variante Cargo

Crear familia `cargo/*` **copiando la estructura** de `empleado/*`, no reutilizando filas de empleado:

| Componente                      | Basado en                             | Cambio principal                                            |
| ------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `CargoPage`                     | `EmpleadoPage`                        | Mismo layout                                                |
| `CargoPageHeader`               | `EmpleadoPageHeader`                  | Título "Gestión de Cargos"                                  |
| `CargoPageSection`              | `EmpleadoPageSection`                 | —                                                           |
| `CargoActionButton`             | `EmpleadoActionButton`                | Label **"Nuevo cargo"**                                     |
| `CargoListToolbar`              | `EmpleadoListToolbar`                 | Placeholder búsqueda: "Buscar por nombre o área…"           |
| `CargoTable` / `CargoTableItem` | `EmpleadoTable` / `EmpleadoTableItem` | Columnas de cargos (ver abajo)                              |
| `CargoModal`                    | `EmpleadoModal`                       | —                                                           |
| `CargoStatusBadge`              | `EmpleadoStatusBadge`                 | Activo / Inactivo                                           |
| `_cargo-theme.scss`             | `_empleado-theme.scss`                | **Acento amber/purple** (nómina Palos de Leña), no sky blue |

**Columnas de la tabla:**

| Columna             | Campo             | Notas                       |
| ------------------- | ----------------- | --------------------------- |
| Nombre del cargo    | `title`           | Sortable                    |
| Área                | `area`            | Sortable                    |
| Rango salarial base | `baseSalaryRange` | Formato COP (`$ 3.500.000`) |
| Estado              | `isActive`        | Badge Activo / Inactivo     |
| Acciones            | —                 | Editar, Activar/Desactivar  |

Responsive: misma estrategia que empleados (tabla desktop + cards mobile en `CargoTableItem`).

### 2. Web-app — feature payroll

**Ruta:** `/payroll/positions`  
**Nav:** agregar ítem **"Gestión de Cargos"** en grupo Nómina (`navigation.ts`), junto a Empleados.

**Pantalla:** `EmployeePositionsListScreen` (o `PayrollPositionsListScreen`)

Composición (igual que empleados):

1. Header: título **"Gestión de Cargos"**, subtítulo con conteos, botón **Nuevo cargo**
2. Métricas: Total / Activos / Inactivos / Filtrados (`RecetaMetricCard`, variantes distintas a empleados)
3. Toolbar: búsqueda en tiempo real + filtro estado (todos / activos / inactivos)
4. Tabla con paginación (`limit` + `offset` o patrón page/size alineado con empleados)
5. Modal crear + Drawer editar + Diálogo desactivar

**Formulario (`EmployeePositionForm`):**

| Campo            | Tipo          | Validación                                                                      |
| ---------------- | ------------- | ------------------------------------------------------------------------------- |
| Nombre del cargo | text          | Obligatorio, max 120                                                            |
| Área             | select o text | Obligatorio; preferir opciones de `GET /employee-catalogs?type=AREA` si existen |
| Salario base     | number        | Obligatorio, > 0, formato numérico                                              |
| Activo           | toggle        | Default `true` en create; editable en edit                                      |

Validación con **zod** + `react-hook-form` (mismo patrón que otros formularios del proyecto).

**CRUD:**

- **Crear:** modal → `POST /employee-positions` → toast `"Cargo creado correctamente"` → refetch listado
- **Leer:** tabla con skeleton mientras `isLoading`
- **Editar:** clic fila o botón editar → drawer precargado → `PATCH /employee-positions/:id` → toast `"Cargo actualizado"`
- **Desactivar:** si `employeeCount > 0`, modal de advertencia explicando empleados asociados; confirmar → `PATCH .../deactivate` → toast `"Cargo desactivado"`. Si inactivo, permitir reactivar vía `PATCH` con `{ isActive: true }`.

**RBAC:** respetar `isPayrollReadOnlyRole` — ocultar acciones de escritura igual que en empleados.

**Toasts:** usar `toast` de `@restopsiq/ui` en éxito y error (`PayrollApiError.message`).

---

## Out of scope

- Backend / schema / migraciones (OS-565 y tasks 01–09)
- Cambios en formulario de empleados (dropdown `positionId` — task separada si aplica)
- GraphQL (REST es suficiente para esta pantalla)
- Tests E2E
- Modificar tokens globales del design system fuera de `cargo/*`
- `package.json`, `pnpm-lock.yaml`, `app.module.ts`

---

## Files allowed

### `packages/ui`

- `packages/ui/src/components/cargo/**`
- `packages/ui/src/components/cargo/index.ts` (export barrel)
- `packages/ui/src/index.ts` — re-export de componentes cargo

### `apps/web-app`

- `apps/web-app/src/features/payroll/screens/EmployeePositionsListScreen.tsx`
- `apps/web-app/src/features/payroll/screens/EmployeePositionsListScreen.module.scss`
- `apps/web-app/src/features/payroll/components/EmployeePositionForm.tsx`
- `apps/web-app/src/features/payroll/components/EmployeePositionCreateModal.tsx`
- `apps/web-app/src/features/payroll/components/EmployeePositionEditDrawer.tsx`
- `apps/web-app/src/features/payroll/components/EmployeePositionDeactivateDialog.tsx`
- `apps/web-app/src/features/payroll/api/employee-positions.api.ts`
- `apps/web-app/src/features/payroll/hooks/useEmployeePositions.ts`
- `apps/web-app/src/features/payroll/hooks/useEmployeePositionMutations.ts`
- `apps/web-app/src/features/payroll/hooks/useEmployeePositionsFilters.ts`
- `apps/web-app/src/features/payroll/validation/employeePosition.schema.ts`
- `apps/web-app/src/features/payroll/types/employee-position.types.ts`
- `apps/web-app/src/features/payroll/index.ts` — export screen
- `apps/web-app/src/pages/PayrollPage/PayrollPage.tsx` — ruta
- `apps/web-app/src/constants/navigation.ts` — nav item + breadcrumb label

## Files forbidden

- `apps/api/**`
- `schema.prisma`, migraciones
- `package.json`, `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `scripts/validate-structure.js`
- Archivos de auth existentes
- `packages/` fuera de `packages/ui/src/components/cargo/**`

---

## Acceptance criteria

### UI / Layout

- [ ] Existe ruta `/payroll/positions` accesible desde nav Nómina → **Gestión de Cargos**
- [ ] La pantalla replica la estructura de empleados (header, métricas, toolbar, tabla, paginación)
- [ ] Paleta de acento **distinta** a empleados (amber/purple en `_cargo-theme.scss`), branding Palos de Leña consistente
- [ ] Responsive: tabla en desktop, cards en mobile

### Tabla y filtros

- [ ] Columnas: Nombre del cargo, Área, Rango salarial base, Estado, Acciones
- [ ] Búsqueda en tiempo real por `title` y `area` (client-side sobre página actual o server-side si API lo soporta)
- [ ] Filtro Activo / Inactivo / Todos
- [ ] Paginación funcional cuando hay más cargos que el page size

### CRUD

- [ ] Botón **Nuevo cargo** abre modal con formulario validado
- [ ] Editar abre drawer con datos precargados
- [ ] Desactivar muestra advertencia si hay empleados asociados (`employeeCount > 0` o error 409)
- [ ] Reactivar cargo inactivo funciona
- [ ] Toasts de éxito/error en todas las operaciones

### Estados UX

- [ ] Loading skeleton o placeholder mientras carga
- [ ] Estado vacío: "No hay cargos registrados"
- [ ] Estado error con botón Reintentar
- [ ] Rol read-only oculta acciones de escritura

### Integración

- [ ] Datos reales desde `/employee-positions` (OS-565)
- [ ] Cache invalidation / refetch tras create, update, deactivate
- [ ] Salario formateado en COP en tabla y formulario

---

## Implementation notes

### Blueprint de pantalla

Seguir casi línea por línea `PayrollEmployeesListScreen.tsx`:

```tsx
<CargoPage theme={cargoTheme}>
  <CargoPageSection variant="header">
    <CargoPageHeader title="Gestión de Cargos" primaryAction={<CargoActionButton label="Nuevo cargo" />} />
  </CargoPageSection>
  {/* métricas RecetaMetricCard */}
  <CargoPageSection variant="toolbar">
    <CargoListToolbar searchValue={...} statusFilter={...} />
  </CargoPageSection>
  <CargoPageSection>
    {/* loading | error | empty | CargoTable */}
  </CargoPageSection>
  <EmployeePositionCreateModal />
  <EmployeePositionEditDrawer />
  <EmployeePositionDeactivateDialog />
</CargoPage>
```

### Colores (Palos de Leña — nómina)

En `_cargo-theme.scss`, usar acentos distintos a empleados:

```scss
$cargo-accent: #f0c040; // amber — grupo Nómina en nav
$cargo-secondary: #818cf8; // purple — contraste en badges/métricas
```

No modificar `_empleado-theme.scss`.

### Formato salario

Reutilizar helper de moneda del proyecto si existe; si no, crear `formatCopCurrency(value: number | string)` en `features/payroll/utils/`.

### Query keys

```typescript
employeePositions: {
  all: ['payroll', 'employee-positions'] as const,
  list: (filters) => [...employeePositions.all, 'list', filters] as const,
}
```

---

## Validation commands

```bash
pnpm --filter @restopsiq/ui build
pnpm --filter web-app typecheck
pnpm lint
```

### Manual QA

1. Login con rol nómina con permisos de escritura
2. Nómina → **Gestión de Cargos**
3. Crear cargo "Analista de Nómina" / Administración / $4.500.000
4. Verificar aparece en tabla con badge Activo
5. Buscar "Analista" → filtra en tiempo real
6. Editar salario → toast éxito
7. Intentar desactivar cargo con empleados asociados → advertencia
8. Desactivar cargo sin empleados → pasa a Inactivo
9. Verificar responsive en viewport mobile
10. Login rol read-only → sin botón Nuevo cargo ni acciones de fila

---

## Notes

- Si OS-565 aún no está mergeado, mockear respuestas en Storybook/preview local; la integración final depende del backend.
- Priorizar **reuso estructural** sobre componentes genéricos: la familia `cargo/*` es un fork controlado de `empleado/*`, no una abstracción compartida en esta iteración.
- Mantener textos en **español** (Colombia).
