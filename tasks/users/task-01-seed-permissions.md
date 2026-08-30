# Task 01 — Seed: Nuevos permission codes para admin de usuarios y roles

**Objetivo:** Agregar 7 nuevos permission codes al catálogo de permisos y actualizar la matriz de roles en `apps/api/prisma/seed.ts`.

**Depends on:** `00-analysis-decisions.md` (D1 — IDs y códigos definidos)

---

## Scope

- `PERMISSION_SEEDS`: agregar entradas 16–22 con IDs fijos `cccccccc-0000-0000-0000-000000000016..022`.
  > IDs 014–015 ya ocupados por `plant.committees.read` / `plant.committees.manage`.
- `ROLE_PERMISSION_MATRIX`: separar SUPERVISOR y MANAGER (permisos distintos) + nuevos códigos.
- Comentario del archivo: actualizar el resumen de "13 permission codes" a "22 permission codes".

**No tocar:** schema Prisma, migraciones, código de `apps/api/src/**`, frontend.

---

## Archivos Permitidos

- `apps/api/prisma/seed.ts` — únicamente

## Archivos Prohibidos

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/src/**`
- `apps/web-app/**`
- `package.json` / `pnpm-lock.yaml`

---

## Cambios detallados

### 1. Append en `PERMISSION_SEEDS` (después de `cccccccc-0000-0000-0000-000000000015`)

```typescript
{
  id: 'cccccccc-0000-0000-0000-000000000014',
  code: 'admin.users.read',
  name: 'Read admin users',
  description: 'List and view global users in the tenant',
  module: 'admin',
  resource: 'users',
  action: 'read',
},
{
  id: 'cccccccc-0000-0000-0000-000000000015',
  code: 'admin.users.create',
  name: 'Create admin user',
  description: 'Create a new global user in the tenant',
  module: 'admin',
  resource: 'users',
  action: 'create',
},
{
  id: 'cccccccc-0000-0000-0000-000000000016',
  code: 'admin.users.update',
  name: 'Update admin user',
  description: 'Update profile, role, or status of a global user',
  module: 'admin',
  resource: 'users',
  action: 'update',
},
{
  id: 'cccccccc-0000-0000-0000-000000000017',
  code: 'admin.users.deactivate',
  name: 'Deactivate admin user',
  description: 'Soft-delete (deactivate) a global user in the tenant',
  module: 'admin',
  resource: 'users',
  action: 'deactivate',
},
{
  id: 'cccccccc-0000-0000-0000-000000000018',
  code: 'admin.roles.read',
  name: 'Read roles',
  description: 'List and view roles in the tenant',
  module: 'admin',
  resource: 'roles',
  action: 'read',
},
{
  id: 'cccccccc-0000-0000-0000-000000000019',
  code: 'admin.roles.manage',
  name: 'Manage roles',
  description: 'Create, update, and deactivate roles in the tenant',
  module: 'admin',
  resource: 'roles',
  action: 'manage',
},
{
  id: 'cccccccc-0000-0000-0000-000000000020',
  code: 'admin.roles.permissions.assign',
  name: 'Assign role permissions',
  description: 'Assign or revoke permissions on a role',
  module: 'admin',
  resource: 'roles.permissions',
  action: 'assign',
},
```

### 2. Actualizar `ROLE_PERMISSION_MATRIX`

```typescript
const ADMIN_USER_MANAGEMENT_CODES = [
  'admin.users.read',
  'admin.users.create',
  'admin.users.update',
  'admin.users.deactivate',
  'admin.roles.read',
  'admin.roles.manage',
  'admin.roles.permissions.assign',
] as const;

const SUPERVISOR_USER_MANAGEMENT_CODES = [
  'admin.users.read',
  'admin.users.create',
  'admin.users.update',
  'admin.roles.read',
] as const;

const MANAGER_USER_MANAGEMENT_CODES = ['admin.users.read'] as const;
```

Actualizar las entradas del objeto `ROLE_PERMISSION_MATRIX`:

- `OWNER`: spread de `ADMIN_USER_MANAGEMENT_CODES` al array existente (ya tiene todos los permisos via `PERMISSION_SEEDS.map`)
- `SUPERVISOR`: spread de `SUPERVISOR_USER_MANAGEMENT_CODES` al array `MANAGER_SUPERVISOR_PERMISSION_CODES`
- `MANAGER`: spread de `MANAGER_USER_MANAGEMENT_CODES` al array `MANAGER_SUPERVISOR_PERMISSION_CODES`
- `OPERATOR`: sin cambios
- `OPERATIONS_ADMIN`: sin cambios

> **Nota:** Si `OWNER` ya usa `PERMISSION_SEEDS.map((p) => p.code)`, los nuevos permisos quedan incluidos automáticamente al extender `PERMISSION_SEEDS`. Verificar esa línea antes de hacer cambios manuales.

### 3. Actualizar comentario del archivo

Cambiar `13 permission codes` → `20 permission codes` en el bloque de comentario inicial.

---

## Criterios de Aceptación

- [ ] `PERMISSION_SEEDS` tiene 20 entradas (IDs 001–020).
- [ ] `MANAGER_SUPERVISOR_PERMISSION_CODES` (o el array equivalente de SUPERVISOR) incluye los 4 nuevos códigos de supervisor.
- [ ] `MANAGER` tiene `admin.users.read`.
- [ ] `OWNER` tiene los 7 nuevos códigos (automático si usa `PERMISSION_SEEDS.map`).
- [ ] `pnpm db:seed` corre sin errores y upsert es idempotente.

## Validación

```bash
# Re-seed debe completar sin errores
cd apps/api && pnpm db:seed

# Verificar conteo en DB (requiere acceso a Prisma Studio o psql)
# SELECT COUNT(*) FROM permissions; -- debe ser >= 20
```

## Riesgos

| Riesgo                                            | Mitigación                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| IDs duplicados si ya existe un permiso con ese ID | `upsert` es idempotente por `code`; ID fijo solo se usa en primera inserción |
| OWNER usa `PERMISSION_SEEDS.map` — automático     | Confirmar que la línea existe; si no, agregar los 7 codes explícitamente     |
