# Task 04 — Frontend: Página de Usuarios (`/users`)

**Objetivo:** Implementar la página de administración de usuarios en `apps/web-app/src`, reemplazando el `ModulePlaceholderPage` actual por una vista funcional con tabla CRUD, modal de creación y panel de edición. Consumir el GraphQL del backend (Task 02).

**Depends on:** Task 02 (GraphQL mutations/queries de users disponibles), patrón existente en `features/inventario` e `features/produccion`.

---

## Scope

- Feature `features/usuarios/` — types, columns, hooks, API client.
- Página `pages/UsersPage/` — tabla responsive + modal crear/editar.
- La página reemplaza el `ModulePlaceholderPage` en `UsersPage.tsx`.
- Sin cambios en routing ni sidebar (ya configurados en `navigation.ts`).

---

## Archivos Permitidos

```
apps/web-app/src/features/usuarios/
  types.ts                                                 (nuevo)
  users-columns.ts                                         (nuevo)
  hooks/
    useAdminUsers.ts                                       (nuevo)
    useAdminCreateUser.ts                                  (nuevo)
    useAdminUpdateUser.ts                                  (nuevo)
    useAdminDeactivateUser.ts                              (nuevo)
  api/
    admin-users.graphql.ts                                 (nuevo — queries/mutations GQL)
  components/
    UserFormModal.tsx                                      (nuevo)
    UserTableRow.tsx                                       (nuevo — desktop)
    UserListCard.tsx                                       (nuevo — mobile)
    DeactivateUserDialog.tsx                               (nuevo)
apps/web-app/src/pages/UsersPage/
  UsersPage.tsx                                            (modificar — reemplazar placeholder)
  UsersListView.tsx                                        (nuevo)
```

## Archivos Prohibidos

- `apps/web-app/src/constants/navigation.ts`
- `apps/web-app/src/App.tsx` (routing ya definido)
- `apps/api/**`

---

## Types (`features/usuarios/types.ts`)

```typescript
import type { DocumentType } from './constants';

export type AdminUserRole = {
  id: string;
  code: string;
  name: string;
};

export type AdminUser = {
  id: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  role: AdminUserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type CreateUserFormValues = {
  cedula: string;
  documentType: DocumentType;
  email: string;
  roleId: string;
};

export type UpdateUserFormValues = {
  email?: string;
  roleId?: string;
  isActive?: boolean;
};

export type DocumentType = 'CC' | 'CE' | 'PASAPORTE' | 'NIT';
```

---

## GraphQL queries/mutations (`api/admin-users.graphql.ts`)

```typescript
// Definir como template strings para el cliente GraphQL existente en el proyecto
export const ADMIN_USERS_QUERY = `
  query AdminUsers($includeInactive: Boolean) {
    adminUsers(includeInactive: $includeInactive) {
      id cedula documentType email isActive emailVerified lastLoginAt createdAt
      role { id code name }
    }
  }
`;

export const ADMIN_CREATE_USER_MUTATION = `
  mutation AdminCreateUser($input: CreateAdminUserInput!) {
    adminCreateUser(input: $input) {
      id cedula documentType email isActive
      role { id code name }
    }
  }
`;

export const ADMIN_UPDATE_USER_MUTATION = `
  mutation AdminUpdateUser($id: ID!, $input: UpdateAdminUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      id cedula documentType email isActive
      role { id code name }
    }
  }
`;

export const ADMIN_DEACTIVATE_USER_MUTATION = `
  mutation AdminDeactivateUser($id: ID!) {
    adminDeactivateUser(id: $id)
  }
`;
```

> Seguir el patrón de `apps/web-app/src/api/` ya existente para el cliente GraphQL (ver `features/inventario/api/` o equivalente en el proyecto).

---

## Hooks

### `useAdminUsers.ts`

```typescript
// useQuery wrapping ADMIN_USERS_QUERY
// Retorna: { users, loading, error, refetch }
// Params: { includeInactive?: boolean }
```

### `useAdminCreateUser.ts`

```typescript
// useMutation wrapping ADMIN_CREATE_USER_MUTATION
// Retorna: { createUser, loading, error }
// On success: invalida/refetch de useAdminUsers
```

### `useAdminUpdateUser.ts`

```typescript
// useMutation wrapping ADMIN_UPDATE_USER_MUTATION
```

### `useAdminDeactivateUser.ts`

```typescript
// useMutation wrapping ADMIN_DEACTIVATE_USER_MUTATION
// On success: toast + refetch
```

---

## `UserFormModal.tsx`

Modal con `react-hook-form` + `zod` (o el validador que usa el proyecto):

**Modo crear:**

- Campos: `cedula`, `documentType` (select), `email`, `roleId` (select con roles desde `useAdminRoles`)
- Submit → `createUser(values)` → toast success + cerrar modal

**Modo editar:**

- Campos: `email`, `roleId`, `isActive` (checkbox)
- Prellena con valores del usuario seleccionado

**Comportamiento compartido:**

- Spinner en submit
- Error inline bajo cada campo con mensaje del servidor
- Botón "Cancelar" cierra modal sin guardar

---

## `UsersListView.tsx`

```tsx
// Layout:
// - Header: título "Usuarios" + botón "Nuevo usuario" (solo si hasPermission('admin.users.create'))
// - Filtro: checkbox "Mostrar inactivos"
// - ResponsiveTable con columnas:
//   desktop: Cédula | Tipo doc | Email | Rol | Estado | Último acceso | Acciones
//   mobile: UserListCard
// - Empty state si no hay usuarios
// - Loading skeleton mientras carga
```

### Columnas (`users-columns.ts`)

| Col          | Desktop                           | Mobile   |
| ------------ | --------------------------------- | -------- |
| cedula       | `string`                          | en card  |
| documentType | badge                             | en card  |
| email        | `string`                          | en card  |
| role.name    | badge accent                      | en card  |
| isActive     | chip verde/rojo                   | en card  |
| lastLoginAt  | formatted date                    | —        |
| acciones     | Edit (lapiz) + Deactivate (trash) | menú `⋯` |

### Gate de acciones por permiso

- Botón "Nuevo usuario": visible solo si `roleCode` es `OWNER` o `SUPERVISOR`.
- Botón editar: visible solo si `roleCode` es `OWNER` o `SUPERVISOR`.
- Botón desactivar: visible solo si `roleCode` es `OWNER`.
- Usar `useMe()` para obtener `roleCode`.

---

## `DeactivateUserDialog.tsx`

- Dialog de confirmación: "¿Desactivar a {email}?"
- Botón "Confirmar" llama `deactivateUser(id)` → toast → cierra
- Botón "Cancelar"

---

## `UsersPage.tsx` (modificación)

```tsx
// Reemplazar:
// return <ModulePlaceholderPage title={title} />;
// Por:
// return <UsersListView />;
```

---

## Criterios de Aceptación

- [ ] `/users` muestra tabla de usuarios del tenant.
- [ ] Modal "Nuevo usuario" crea usuario y aparece en tabla sin reload de página.
- [ ] Modal "Editar" prellena campos y actualiza fila en tabla.
- [ ] Dialog "Desactivar" pide confirmación y mueve usuario a inactivo.
- [ ] Checkbox "Mostrar inactivos" muestra usuarios desactivados.
- [ ] Acciones de escritura no visibles para roles sin permiso.
- [ ] Responsive: tabla en desktop, cards en mobile.
- [ ] Toast success/error en cada operación.

## Validación

```bash
npm run typecheck --workspace=apps/web-app
npm run test --workspace=apps/web-app -- features/usuarios
```

## Riesgos

| Riesgo                                           | Mitigación                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `useAdminRoles` no existe aún (task 05)          | `UserFormModal` puede recibir `roles` como prop hasta que Task 05 implemente el hook                         |
| Cliente GraphQL del proyecto usa Apollo vs fetch | Seguir exactamente el patrón de `features/inventario` — no introducir nueva librería                         |
| Gate por `roleCode` no cubre permisos granulares | El backend es la autoridad real; el gate frontend es solo UX. Un 403 del backend debe mostrar toast de error |
