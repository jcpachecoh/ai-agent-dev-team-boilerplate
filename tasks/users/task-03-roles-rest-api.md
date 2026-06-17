# Task 03 — Admin Roles: REST API + GraphQL Resolver

**Objetivo:** Implementar `AdminRolesModule` con CRUD de Roles, asignación de permisos a roles (`RolePermission`), y listado del catálogo de permisos. Solo accesible para usuarios con permisos `admin.roles.*`.

**Depends on:** Task 01 (permission codes), Task 02 (`AdminModule` raíz ya creado), USR-02 (Role/Permission/RolePermission schema), AUTH-09 (PermissionsGuard).

---

## Scope

### `AdminRolesModule` — operaciones

| Operación                | REST                                   | GraphQL                               | Permission required              |
| ------------------------ | -------------------------------------- | ------------------------------------- | -------------------------------- |
| Listar roles             | `GET /api/admin/roles`                 | `query adminRoles`                    | `admin.roles.read`               |
| Ver rol                  | `GET /api/admin/roles/:id`             | `query adminRole(id)`                 | `admin.roles.read`               |
| Crear rol                | `POST /api/admin/roles`                | `mutation adminCreateRole`            | `admin.roles.manage`             |
| Actualizar rol           | `PATCH /api/admin/roles/:id`           | `mutation adminUpdateRole`            | `admin.roles.manage`             |
| Desactivar rol           | `DELETE /api/admin/roles/:id`          | `mutation adminDeactivateRole`        | `admin.roles.manage`             |
| Asignar permisos a rol   | `PUT /api/admin/roles/:id/permissions` | `mutation adminAssignRolePermissions` | `admin.roles.permissions.assign` |
| Listar permisos catálogo | `GET /api/admin/permissions`           | `query adminPermissions`              | `admin.roles.read`               |

---

## Archivos Permitidos

```
apps/api/src/admin/roles/
  admin-roles.module.ts                                    (nuevo)
  controller/
    admin-roles.controller.ts                              (nuevo)
    dto/
      create-role.dto.ts                                   (nuevo)
      update-role.dto.ts                                   (nuevo)
      assign-role-permissions.dto.ts                       (nuevo)
  service/
    admin-roles.service.ts                                 (nuevo)
  repository/
    admin-roles.repository.ts                              (nuevo)
  resolver/
    admin-roles.resolver.ts                                (nuevo)
  interfaces/
    admin-roles.interfaces.ts                              (nuevo)
  test/
    admin-roles.service.spec.ts                            (nuevo)
    admin-roles.repository.spec.ts                         (nuevo)
    admin-roles.controller.spec.ts                         (nuevo)
apps/api/src/admin/admin.module.ts                         (actualizar: agregar AdminRolesModule)
```

## Archivos Prohibidos

- `apps/api/prisma/**`
- `apps/api/src/permissions/**`
- `apps/api/src/user/**`
- `apps/api/src/auth/**`
- `apps/web-app/**`

---

## Interfaces (`admin-roles.interfaces.ts`)

```typescript
export interface AdminRoleListItem {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: Date;
}

export interface AdminRoleDetail extends AdminRoleListItem {
  permissions: PermissionRef[];
}

export interface PermissionRef {
  id: string;
  code: string;
  name: string;
  module: string | null;
  resource: string | null;
  action: string | null;
}

export interface PermissionCatalogItem extends PermissionRef {
  description: string | null;
  isActive: boolean;
}

export interface CreateRoleData {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface IAdminRolesRepository {
  findAll(tenantId: string, includeInactive?: boolean): Promise<AdminRoleListItem[]>;
  findById(tenantId: string, roleId: string): Promise<AdminRoleDetail | null>;
  findByCode(tenantId: string, code: string): Promise<{ id: string } | null>;
  hasActiveUsers(roleId: string): Promise<boolean>;
  create(data: CreateRoleData): Promise<AdminRoleListItem>;
  update(tenantId: string, roleId: string, data: UpdateRoleData): Promise<AdminRoleListItem>;
  deactivate(tenantId: string, roleId: string): Promise<void>;
  setRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;
  findAllPermissions(): Promise<PermissionCatalogItem[]>;
}

export interface IAdminRolesService {
  findAll(tenantId: string, includeInactive?: boolean): Promise<AdminRoleListItem[]>;
  findById(tenantId: string, roleId: string): Promise<AdminRoleDetail>;
  createRole(tenantId: string, data: CreateRoleData): Promise<AdminRoleListItem>;
  updateRole(tenantId: string, roleId: string, data: UpdateRoleData): Promise<AdminRoleListItem>;
  deactivateRole(tenantId: string, roleId: string): Promise<void>;
  assignRolePermissions(tenantId: string, roleId: string, permissionIds: string[]): Promise<void>;
  getPermissionCatalog(): Promise<PermissionCatalogItem[]>;
}
```

---

## DTOs

```typescript
// create-role.dto.ts
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be UPPER_SNAKE_CASE',
  })
  code!: string;

  @IsString() @IsNotEmpty() name!: string;

  @IsString() @IsOptional() description?: string;
}
```

```typescript
// update-role.dto.ts
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
```

```typescript
// assign-role-permissions.dto.ts
import { IsArray, IsString } from 'class-validator';

export class AssignRolePermissionsDto {
  @IsArray() @IsString({ each: true }) permissionIds!: string[];
}
```

---

## Service — lógica de negocio

### `createRole`

1. Verificar unicidad de `code` dentro del tenant → `ConflictException` si ya existe.
2. `code` debe ser `UPPER_SNAKE_CASE` (validado en DTO).
3. `repository.create(...)`.

### `deactivateRole`

- Verificar que el rol no tiene usuarios activos (`repository.hasActiveUsers(roleId)`).
- Si tiene usuarios activos → `ConflictException('Role has active users — reassign them first')`.
- `repository.deactivate(...)`.

### `assignRolePermissions`

- Reemplazar todos los `RolePermission` del rol (replace-all semántica).
- Transacción: `deleteMany({ where: { roleId } })` + `createMany(permissionIds.map(...))`.
- Validar que los `permissionId` existen en la tabla `Permission` → `NotFoundException` si alguno no existe.

### `getPermissionCatalog`

- Solo permisos activos (`isActive = true`) del catálogo global.

---

## Controller

```typescript
@ApiTags('admin-roles')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiHeader({ name: 'x-tenant-id', required: true })
export class AdminRolesController {
  // GET    /api/admin/roles                     @RequirePermission('admin.roles.read')
  // GET    /api/admin/roles/:id                 @RequirePermission('admin.roles.read')
  // POST   /api/admin/roles                     @RequirePermission('admin.roles.manage')
  // PATCH  /api/admin/roles/:id                 @RequirePermission('admin.roles.manage')
  // DELETE /api/admin/roles/:id                 @RequirePermission('admin.roles.manage')
  // PUT    /api/admin/roles/:id/permissions     @RequirePermission('admin.roles.permissions.assign')
  // GET    /api/admin/permissions               @RequirePermission('admin.roles.read')
}
```

---

## GraphQL Resolver

```typescript
@Resolver(() => AdminRoleType)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRolesResolver {
  // @Query adminRoles(includeInactive?: Boolean): [AdminRoleType!]!
  // @Query adminRole(id: ID!): AdminRoleType
  // @Query adminPermissions: [PermissionCatalogType!]!
  // @Mutation adminCreateRole(input: CreateRoleInput!): AdminRoleType!
  // @Mutation adminUpdateRole(id: ID!, input: UpdateRoleInput!): AdminRoleType!
  // @Mutation adminDeactivateRole(id: ID!): Boolean!
  // @Mutation adminAssignRolePermissions(roleId: ID!, permissionIds: [ID!]!): Boolean!
}
```

**GraphQL types:**

```typescript
@ObjectType('AdminRole')
class AdminRoleType {
  @Field(() => ID) id!: string;
  @Field() code!: string;
  @Field() name!: string;
  @Field(() => String, { nullable: true }) description?: string | null;
  @Field() isActive!: boolean;
  @Field() userCount!: number;
  @Field(() => [PermissionRefType]) permissions!: PermissionRefType[];
  @Field() createdAt!: Date;
}

@ObjectType('PermissionCatalog')
class PermissionCatalogType {
  @Field(() => ID) id!: string;
  @Field() code!: string;
  @Field() name!: string;
  @Field(() => String, { nullable: true }) description?: string | null;
  @Field(() => String, { nullable: true }) module?: string | null;
  @Field(() => String, { nullable: true }) resource?: string | null;
  @Field(() => String, { nullable: true }) action?: string | null;
}
```

---

## Tests requeridos

### `admin-roles.service.spec.ts`

- `createRole` — lanza `ConflictException` si `code` duplicado.
- `deactivateRole` — lanza `ConflictException` si hay usuarios activos en ese rol.
- `assignRolePermissions` — replace-all; lanza `NotFoundException` si `permissionId` no existe.
- `getPermissionCatalog` — retorna solo permisos activos.

### `admin-roles.repository.spec.ts`

- `findAll` — filtra por `tenantId`, incluye `userCount` y `permissionCount`.
- `hasActiveUsers` — retorna `true`/`false` correcto.
- `setRolePermissions` — deleteMany + createMany en transacción.

### `admin-roles.controller.spec.ts`

- `GET /api/admin/roles` — 200 OK.
- `PUT /api/admin/roles/:id/permissions` — 200 OK con body válido.
- `DELETE /api/admin/roles/:id` — 409 si hay usuarios activos.

---

## Criterios de Aceptación

- [ ] `GET /api/admin/roles` retorna roles con `userCount` y `permissionCount`.
- [ ] `POST /api/admin/roles` crea rol con `code` UPPER_SNAKE_CASE.
- [ ] `PUT /api/admin/roles/:id/permissions` reemplaza permisos del rol.
- [ ] `DELETE /api/admin/roles/:id` falla con 409 si hay usuarios activos.
- [ ] `GET /api/admin/permissions` retorna catálogo completo activo.
- [ ] GraphQL queries/mutations tipadas correctamente.
- [ ] Tests unitarios pasan con `> 80%` cobertura en service.

## Validación

```bash
npm run typecheck
npm run test -- apps/api/src/admin/roles
npm run lint
```

## Riesgos

| Riesgo                                                       | Mitigación                                                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `code` del rol puede colisionar con roles de otros tenants   | `@@unique([tenantId, code])` en schema ya lo cubre — el upsert lanzará `P2002`                      |
| Replace-all en permisos de rol puede romper sesiones activas | JWT no lleva permisos; resolución es server-side en cada request — sin impacto en tokens existentes |
