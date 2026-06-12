# Task 06 — Frontend: Rutas, Sidebar gate y Página de Permisos

**Objetivo:** (1) Registrar las rutas `/users/roles` y `/users/permissions` en el router de la app. (2) Agregar gate en el sidebar para mostrar la sección "Usuarios" solo a `OWNER` y `SUPERVISOR`. (3) Implementar la página de catálogo de permisos en `/users/permissions` (solo lectura).

**Depends on:** Task 04 (`UsersListView` ya existe), Task 05 (`RolesPage` ya existe), `useMe` hook existente en `features/auth`.

---

## Scope

### 1. Rutas

Verificar el archivo de definición de rutas (probablemente `App.tsx` o un archivo de routes en `routes/`). Registrar:

- `/users` → `UsersPage` (ya existe, Task 04 la implementó)
- `/users/roles` → `RolesPage` (Task 05)
- `/users/permissions` → `PermissionsPage` (esta tarea)

Todas las rutas dentro del bloque autenticado con `RequireAuth`.

### 2. Sidebar gate

En `Sidebar.tsx` o donde se filtre `navigationItems`, filtrar la sección `id: 'usuarios'` para que solo aparezca si `me.roleCode` es `OWNER` o `SUPERVISOR`.

### 3. Página de permisos

`/users/permissions` — catálogo de permisos del sistema, solo lectura. Vista informativa para que admins entiendan qué permisos existen y a qué módulos corresponden.

---

## Archivos Permitidos

```
apps/web-app/src/App.tsx                                   (agregar rutas /users/roles y /users/permissions)
apps/web-app/src/components/Sidebar/Sidebar.tsx            (agregar gate por roleCode)
apps/web-app/src/pages/RolesPage/
  RolesPage.tsx                                            (nuevo — wrapper de RolesListView)
apps/web-app/src/pages/PermissionsPage/
  PermissionsPage.tsx                                      (nuevo)
  PermissionsListView.tsx                                  (nuevo)
apps/web-app/src/features/roles/hooks/useAdminRoles.ts     (verificar exportación de usePermissionCatalog)
```

## Archivos Prohibidos

- `apps/web-app/src/constants/navigation.ts` — sidebar items ya definidos correctamente
- `apps/api/**`

---

## 1. Rutas en `App.tsx`

Buscar el bloque de rutas autenticadas. Añadir dentro del `<Route>` con `<RequireAuth>`:

```tsx
<Route path="/users" element={<UsersPage />} />
<Route path="/users/roles" element={<RolesPage />} />
<Route path="/users/permissions" element={<PermissionsPage />} />
```

Usar lazy imports si el proyecto ya los usa para code-splitting:

```tsx
const RolesPage = lazy(() => import('@/pages/RolesPage/RolesPage'));
const PermissionsPage = lazy(() => import('@/pages/PermissionsPage/PermissionsPage'));
```

---

## 2. Sidebar gate por roleCode

En `Sidebar.tsx`, actualmente el componente mapea `navigationItems` directamente:

```typescript
const items = useMemo(() => navigationItems.map((item) => mapNavItem(item, pathname)), [pathname]);
```

### Cambio requerido

1. Obtener `me` del hook de autenticación:

```typescript
const { data: me } = useMe(); // hook existente en features/auth
```

2. Filtrar `navigationItems` antes del map:

```typescript
const ADMIN_ONLY_NAV_IDS = new Set(['usuarios']);
const ADMIN_ROLE_CODES = new Set(['OWNER', 'SUPERVISOR']);

const visibleItems = useMemo(() => {
  return navigationItems.filter((item) => {
    if (ADMIN_ONLY_NAV_IDS.has(item.id)) {
      return me?.roleCode != null && ADMIN_ROLE_CODES.has(me.roleCode);
    }
    return true;
  });
}, [me?.roleCode]);

const items = useMemo(
  () => visibleItems.map((item) => mapNavItem(item, pathname)),
  [visibleItems, pathname],
);
```

> **Importante:** Este gate es solo UX. El backend protege todas las operaciones con `PermissionsGuard`. Si `me` aún no cargó, la sección "Usuarios" no se muestra (undefined = ocultar).

---

## 3. `PermissionsPage` — catálogo solo lectura

### `PermissionsListView.tsx`

Vista de catálogo de permisos del sistema. Agrupa por módulo.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Catálogo de Permisos                               │
│  Los permisos definen qué acciones puede realizar   │
│  cada rol en el sistema.                            │
├─────────────────────────────────────────────────────┤
│  🔷 admin (7)                                       │
│    admin.users.read     — Read admin users          │
│    admin.users.create   — Create admin user         │
│    ...                                              │
│  🔶 plant (9)                                       │
│    plant.orders.read    — Read production orders    │
│    ...                                              │
│  🔵 mes (2)                                         │
│    mes.users.create     — Create operational user   │
│    ...                                              │
└─────────────────────────────────────────────────────┘
```

**Implementación:**

- Usar `usePermissionCatalog` hook de Task 05 (`features/roles/hooks/usePermissionCatalog.ts`).
- Agrupar por `module` con `useMemo`.
- Cada permiso muestra: `code` en monospace + `name` + `description` en gris.
- Sin acciones (solo lectura).
- Loading skeleton mientras carga.

```tsx
// PermissionsPage.tsx
import PermissionsListView from './PermissionsListView';

export default function PermissionsPage(): React.JSX.Element {
  return <PermissionsListView />;
}
```

---

## Criterios de Aceptación

### Rutas

- [ ] Navegar a `/users/roles` muestra `RolesPage` (no 404).
- [ ] Navegar a `/users/permissions` muestra `PermissionsPage` (no 404).
- [ ] Ambas rutas están dentro de `RequireAuth`.

### Sidebar gate

- [ ] Usuario con `roleCode: 'OWNER'` ve la sección "Usuarios" en el sidebar.
- [ ] Usuario con `roleCode: 'SUPERVISOR'` ve la sección "Usuarios" en el sidebar.
- [ ] Usuario con `roleCode: 'MANAGER'` NO ve la sección "Usuarios".
- [ ] Usuario con `roleCode: 'OPERATOR'` NO ve la sección "Usuarios".
- [ ] Mientras `me` carga (undefined), la sección "Usuarios" no aparece.

### Página de permisos

- [ ] `/users/permissions` muestra lista de permisos agrupados por módulo.
- [ ] No hay botones de acción (solo lectura).
- [ ] Muestra loading skeleton mientras carga.

## Validación

```bash
npm run typecheck --workspace=apps/web-app
# Verificar manualmente:
# 1. Login como OPERATOR → sidebar no muestra "Usuarios"
# 2. Login como SUPERVISOR → sidebar muestra "Usuarios"
# 3. Navegar a /users/roles → tabla de roles visible
# 4. Navegar a /users/permissions → catálogo visible
```

## Riesgos

| Riesgo                                                   | Mitigación                                                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `useMe` retorna `null` mientras carga → sidebar flickea  | `me?.roleCode != null && ...` oculta durante carga; no hay flash visible si navbar carga rápido                 |
| Ruta `/users` puede ya estar registrada como placeholder | Verificar en `App.tsx` si hay un `<Route path="/users">` antes de agregar — evitar duplicado                    |
| Sidebar importa `useMe` que hace un API call extra       | `useMe` debería estar en cache/context ya; verificar que usa el auth context global, no una nueva petición      |
| `RolesPage.tsx` como wrapper — puede ser innecesario     | Si `RolesListView` es autocontenido, `RolesPage` puede ser simplemente `export default () => <RolesListView />` |
