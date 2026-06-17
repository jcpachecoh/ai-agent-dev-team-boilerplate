# Task 05 — Frontend: Página de Roles (`/users/roles`)

**Objetivo:** Implementar la página de administración de roles en `apps/web-app/src`, con tabla CRUD de roles, panel lateral de asignación de permisos, y modal de creación/edición. Consumir el GraphQL del backend (Task 03).

**Depends on:** Task 03 (GraphQL mutations/queries de roles y permisos disponibles), Task 04 (patrón de features/usuarios establecido).

---

## Scope

- Feature `features/roles/` — types, columns, hooks, API client.
- Página `pages/RolesPage/` — tabla de roles + panel de permisos (split layout).
- Sin cambios en routing ni sidebar.

---

## Archivos Permitidos

```
apps/web-app/src/features/roles/
  types.ts                                                 (nuevo)
  roles-columns.ts                                         (nuevo)
  hooks/
    useAdminRoles.ts                                       (nuevo)
    useAdminCreateRole.ts                                  (nuevo)
    useAdminUpdateRole.ts                                  (nuevo)
    useAdminDeactivateRole.ts                              (nuevo)
    useAdminAssignRolePermissions.ts                       (nuevo)
    usePermissionCatalog.ts                                (nuevo)
  api/
    admin-roles.graphql.ts                                 (nuevo)
  components/
    RoleFormModal.tsx                                      (nuevo)
    RoleTableRow.tsx                                       (nuevo)
    RoleListCard.tsx                                       (nuevo)
    DeactivateRoleDialog.tsx                               (nuevo)
    RolePermissionsPanel.tsx                               (nuevo — panel lateral)
    PermissionCheckbox.tsx                                 (nuevo — item del panel)
apps/web-app/src/pages/RolesPage/
  RolesPage.tsx                                            (nuevo)
  RolesListView.tsx                                        (nuevo)
```

### Registrar nueva ruta RolesPage

La ruta `/users/roles` ya existe en `navigation.ts` con path correcto. Verificar si `App.tsx` o el archivo de rutas ya mapea `/users/roles` → alguna página. Si no, agregar la importación del componente en el archivo de rutas.

## Archivos Prohibidos

- `apps/web-app/src/constants/navigation.ts`
- `apps/api/**`

---

## Types (`features/roles/types.ts`)

```typescript
export type PermissionCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string | null;
  resource: string | null;
  action: string | null;
};

export type AdminRolePermission = {
  id: string;
  code: string;
  name: string;
};

export type AdminRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
  permissions: AdminRolePermission[];
  createdAt: string;
};

export type CreateRoleFormValues = {
  code: string;
  name: string;
  description?: string;
};

export type UpdateRoleFormValues = {
  name?: string;
  description?: string;
  isActive?: boolean;
};
```

---

## GraphQL queries/mutations (`api/admin-roles.graphql.ts`)

```typescript
export const ADMIN_ROLES_QUERY = `
  query AdminRoles($includeInactive: Boolean) {
    adminRoles(includeInactive: $includeInactive) {
      id code name description isActive userCount createdAt
      permissions { id code name }
    }
  }
`;

export const ADMIN_PERMISSIONS_CATALOG_QUERY = `
  query AdminPermissions {
    adminPermissions {
      id code name description module resource action
    }
  }
`;

export const ADMIN_CREATE_ROLE_MUTATION = `
  mutation AdminCreateRole($input: CreateRoleInput!) {
    adminCreateRole(input: $input) {
      id code name description isActive userCount
      permissions { id code name }
    }
  }
`;

export const ADMIN_UPDATE_ROLE_MUTATION = `
  mutation AdminUpdateRole($id: ID!, $input: UpdateRoleInput!) {
    adminUpdateRole(id: $id, input: $input) {
      id code name description isActive userCount
      permissions { id code name }
    }
  }
`;

export const ADMIN_DEACTIVATE_ROLE_MUTATION = `
  mutation AdminDeactivateRole($id: ID!) {
    adminDeactivateRole(id: $id)
  }
`;

export const ADMIN_ASSIGN_ROLE_PERMISSIONS_MUTATION = `
  mutation AdminAssignRolePermissions($roleId: ID!, $permissionIds: [ID!]!) {
    adminAssignRolePermissions(roleId: $roleId, permissionIds: $permissionIds)
  }
`;
```

---

## Layout principal (`RolesListView.tsx`)

```
┌─────────────────────────────────────────────────────┐
│  Roles                              [+ Nuevo rol]   │
├──────────────────────────┬──────────────────────────┤
│  Tabla de roles          │  Panel de permisos        │
│  (50% ancho / fullwidth  │  (aparece al seleccionar  │
│   en mobile)             │   un rol)                 │
│                          │                           │
│  [Código] [Nombre]       │  Permisos de "SUPERVISOR" │
│  [Usuarios] [Estado]     │  ─────────────────────── │
│  [Acciones]              │  □ admin  > users > read  │
│                          │  □ admin  > users > create│
│  OWNER     12  ✓  ✏️🗑️  │  □ plant  > orders > ...  │
│  SUPERVISOR 8  ✓  ✏️    │  ...                      │
│  ...                     │  [Guardar cambios]        │
└──────────────────────────┴──────────────────────────┘
```

**Mobile:** tabla a pantalla completa, panel de permisos como drawer inferior o página separada.

---

## `RolePermissionsPanel.tsx`

Panel lateral que aparece al hacer click en un rol de la tabla.

**Estado local:**

- `selectedPermissionIds: Set<string>` — inicializado con los permisos actuales del rol
- `isDirty: boolean` — true si hay cambios sin guardar

**Comportamiento:**

- Checkboxes agrupados por `module` (e.g. "admin", "plant", "mes", "supply")
- Dentro de cada módulo, ordenados por `resource` y `action`
- Botón "Guardar cambios" (disabled si `!isDirty`) → `assignRolePermissions(roleId, [...selectedPermissionIds])` → toast success
- Botón "Descartar" → reset a permisos originales del rol
- Indicador de cambios pendientes: badge "X cambios" en el header del panel

**`PermissionCheckbox.tsx`:**

```tsx
// Props: { permission: PermissionCatalogItem, checked: boolean, onChange: () => void, disabled?: boolean }
// Display: checkbox + "module.resource.action" en monospace + nombre en texto normal
```

---

## `RoleFormModal.tsx`

**Modo crear:**

- Campos: `code` (UPPER_SNAKE_CASE, validado en cliente), `name`, `description` (opcional)
- Submit → `createRole(values)` → toast + cerrar

**Modo editar:**

- Campos: `name`, `description`, `isActive`
- `code` NO editable (readonly display)

---

## `DeactivateRoleDialog.tsx`

- "¿Desactivar rol {code}?"
- Si el rol tiene `userCount > 0`: mensaje adicional "Este rol tiene {N} usuarios activos. Deberás reasignarles un rol diferente."
- API devuelve 409 si hay usuarios activos → mostrar toast error con mensaje del servidor

---

## Columnas de tabla (`roles-columns.ts`)

| Col       | Desktop                                        | Mobile   |
| --------- | ---------------------------------------------- | -------- |
| code      | badge monospace                                | en card  |
| name      | texto                                          | en card  |
| userCount | número con icono                               | en card  |
| isActive  | chip verde/rojo                                | en card  |
| createdAt | fecha corta                                    | —        |
| acciones  | Edit + Deactivate + "Ver permisos" (click row) | menú `⋯` |

Hacer click en la fila → abre panel de permisos en estado "view" del rol seleccionado.

---

## Gate de acciones por roleCode

```typescript
const { data: me } = useMe();
const canManage = me?.roleCode === 'OWNER' || me?.roleCode === 'SUPERVISOR';
const canAssignPermissions = me?.roleCode === 'OWNER';
```

- Botón "Nuevo rol": visible si `canManage`
- Botón editar: visible si `canManage`
- Botón desactivar: visible si `canManage`
- Checkboxes de permisos: habilitados solo si `canAssignPermissions`; readonly para SUPERVISOR

---

## Criterios de Aceptación

- [ ] `/users/roles` muestra tabla de roles con `userCount` y badges de estado.
- [ ] Click en fila abre panel de permisos a la derecha.
- [ ] Panel de permisos agrupa por módulo y muestra checkboxes.
- [ ] "Guardar cambios" llama mutation y muestra toast.
- [ ] Modal "Nuevo rol" valida formato UPPER_SNAKE_CASE en cliente.
- [ ] Dialog "Desactivar" muestra warning si hay usuarios activos.
- [ ] Responsive: panel como drawer en mobile.
- [ ] SUPERVISOR ve checkboxes readonly (no puede asignar permisos).

## Validación

```bash
npm run typecheck --workspace=apps/web-app
npm run test --workspace=apps/web-app -- features/roles
```

## Riesgos

| Riesgo                                                            | Mitigación                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Panel split layout requiere estado compartido entre tabla y panel | Usar `useState` en `RolesListView` — `selectedRole` state. No Redux/Context por ahora |
| Muchos permisos — checkbox list lenta                             | Agrupar por módulo con `useMemo`; lista es corta (< 30 items)                         |
| `useAdminRoles` usado también en `UserFormModal` (Task 04)        | Hook reutilizable — `features/roles/hooks/useAdminRoles.ts` importable desde Task 04  |
