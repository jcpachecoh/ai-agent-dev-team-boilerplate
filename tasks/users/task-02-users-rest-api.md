# Task 02 — Admin Users: REST API + GraphQL Resolver

**Objetivo:** Implementar `AdminUsersModule` con CRUD completo de usuarios globales (`User`), incluyendo REST controller, GraphQL resolver, service, repository, DTOs e interfaces. Solo accesible para usuarios con permisos `admin.users.*`.

**Depends on:** Task 01 (permission codes en seed), USR-01 (User schema), AUTH-09 (PermissionsGuard activo), `AuthEmailService` exportado desde `EmailModule`.

---

## Scope

### Carpeta nueva: `apps/api/src/admin/`

Crear `AdminModule` raíz que importa `AdminUsersModule` y `AdminRolesModule` (Task 03). Registrar `AdminModule` en `AppModule`.

### `AdminUsersModule` — operaciones

| Operación                 | REST                                   | GraphQL                               | Permission required      |
| ------------------------- | -------------------------------------- | ------------------------------------- | ------------------------ |
| Listar usuarios           | `GET /api/admin/users`                 | `query adminUsers`                    | `admin.users.read`       |
| Ver usuario               | `GET /api/admin/users/:id`             | `query adminUser(id)`                 | `admin.users.read`       |
| Crear usuario             | `POST /api/admin/users`                | `mutation adminCreateUser`            | `admin.users.create`     |
| Actualizar usuario        | `PATCH /api/admin/users/:id`           | `mutation adminUpdateUser`            | `admin.users.update`     |
| Desactivar usuario        | `DELETE /api/admin/users/:id`          | `mutation adminDeactivateUser`        | `admin.users.deactivate` |
| Asignar permisos override | `PUT /api/admin/users/:id/permissions` | `mutation adminAssignUserPermissions` | `admin.users.update`     |

---

## Archivos Permitidos

```
apps/api/src/admin/admin.module.ts                         (nuevo)
apps/api/src/admin/users/
  admin-users.module.ts                                    (nuevo)
  controller/
    admin-users.controller.ts                              (nuevo)
    dto/
      create-admin-user.dto.ts                             (nuevo)
      update-admin-user.dto.ts                             (nuevo)
      assign-user-permissions.dto.ts                       (nuevo)
      admin-users-query.dto.ts                             (nuevo)
  service/
    admin-users.service.ts                                 (nuevo)
  repository/
    admin-users.repository.ts                              (nuevo)
  resolver/
    admin-users.resolver.ts                                (nuevo)
  interfaces/
    admin-users.interfaces.ts                              (nuevo)
  test/
    admin-users.service.spec.ts                            (nuevo)
    admin-users.repository.spec.ts                         (nuevo)
    admin-users.controller.spec.ts                         (nuevo)
apps/api/src/app.module.ts                                 (agregar AdminModule)
```

## Archivos Prohibidos

- `apps/api/prisma/**`
- `apps/api/src/user/**` (módulo existente — no modificar)
- `apps/api/src/permissions/**`
- `apps/api/src/auth/**`
- `apps/web-app/**`

---

## Interfaces (`admin-users.interfaces.ts`)

```typescript
import type { DocumentType, PermissionEffect } from '@prisma/client';

export interface AdminUserListItem {
  id: string;
  tenantId: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface AdminUserDetail extends AdminUserListItem {
  loginAttempts: number;
  lockedUntil: Date | null;
  passwordChangedAt: Date | null;
}

export interface CreateAdminUserData {
  tenantId: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  roleId: string;
  createdBy: string;
}

export interface UpdateAdminUserData {
  email?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface UserPermissionOverrideInput {
  permissionId: string;
  effect: PermissionEffect;
}

export interface IAdminUsersRepository {
  findAll(tenantId: string, includeInactive?: boolean): Promise<AdminUserListItem[]>;
  findById(tenantId: string, userId: string): Promise<AdminUserDetail | null>;
  findByEmail(tenantId: string, email: string): Promise<{ id: string } | null>;
  findByCedula(tenantId: string, cedula: string): Promise<{ id: string } | null>;
  create(data: CreateAdminUserData & { passwordHash: string }): Promise<AdminUserListItem>;
  update(tenantId: string, userId: string, data: UpdateAdminUserData): Promise<AdminUserListItem>;
  deactivate(tenantId: string, userId: string): Promise<void>;
  setUserPermissionOverrides(
    userId: string,
    overrides: UserPermissionOverrideInput[],
  ): Promise<void>;
}

export interface IAdminUsersService {
  findAll(tenantId: string, includeInactive?: boolean): Promise<AdminUserListItem[]>;
  findById(tenantId: string, userId: string): Promise<AdminUserDetail>;
  createUser(
    tenantId: string,
    data: CreateAdminUserData,
    requesterId: string,
  ): Promise<AdminUserListItem>;
  updateUser(
    tenantId: string,
    userId: string,
    data: UpdateAdminUserData,
    requesterId: string,
  ): Promise<AdminUserListItem>;
  deactivateUser(tenantId: string, userId: string, requesterId: string): Promise<void>;
  assignUserPermissions(
    tenantId: string,
    userId: string,
    overrides: UserPermissionOverrideInput[],
  ): Promise<void>;
}
```

---

## DTOs (`create-admin-user.dto.ts`)

```typescript
import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { DocumentType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminUserDto {
  @ApiProperty() @IsString() @IsNotEmpty() cedula!: string;
  @ApiProperty({ enum: DocumentType }) @IsEnum(DocumentType) documentType!: DocumentType;
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @IsNotEmpty() roleId!: string;
}
```

```typescript
// update-admin-user.dto.ts
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAdminUserDto {
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() roleId?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
```

```typescript
// assign-user-permissions.dto.ts
import { IsArray, IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionEffect } from '@prisma/client';

class PermissionOverrideItem {
  @IsString() permissionId!: string;
  @IsEnum(PermissionEffect) effect!: PermissionEffect;
}

export class AssignUserPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideItem)
  overrides!: PermissionOverrideItem[];
}
```

---

## Service — lógica de negocio

### `createUser`

1. Verificar unicidad de `email` y `cedula` en el tenant → `ConflictException` si ya existe.
2. Generar contraseña temporal: `crypto.randomBytes(9).toString('base64url')` (12 chars URL-safe).
3. Hashear con `bcrypt` (reusar `bcrypt.hash(password, 10)` — mismo patrón que `AuthService`).
4. `repository.create(...)`.
5. Llamar `authEmailService.sendWelcome(...)` con el tenant context. Si falla, NO revertir usuario (log warning).
6. Retornar `AdminUserListItem` (sin exposer `passwordHash`).

### `deactivateUser`

- Bloquear si `userId === requesterId` → `ForbiddenException('Cannot deactivate own account')`.
- `repository.deactivate(...)` — `isActive = false`, `deletedAt = now()`.

### `updateUser`

- Bloquear cambio de `roleId` sobre el propio usuario si `userId === requesterId`.

### `assignUserPermissions`

- Reemplaza todos los `UserPermission` del usuario (no merge — replace-all semántica).
- Usar transacción: `deleteMany` + `createMany`.

---

## Controller (`admin-users.controller.ts`)

```typescript
@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiHeader({ name: 'x-tenant-id', required: true })
export class AdminUsersController {
  // GET    /api/admin/users          @RequirePermission('admin.users.read')
  // GET    /api/admin/users/:id      @RequirePermission('admin.users.read')
  // POST   /api/admin/users          @RequirePermission('admin.users.create')
  // PATCH  /api/admin/users/:id      @RequirePermission('admin.users.update')
  // DELETE /api/admin/users/:id      @RequirePermission('admin.users.deactivate')
  // PUT    /api/admin/users/:id/permissions  @RequirePermission('admin.users.update')
}
```

Inyectar `tenantId` desde `req.user.tenantId` (JWT claim) — NO desde header (ya validado en `PermissionsGuard`).

---

## GraphQL Resolver (`admin-users.resolver.ts`)

```typescript
@Resolver(() => AdminUserType)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersResolver {
  // @Query adminUsers(includeInactive?: Boolean): [AdminUserType!]!
  // @Query adminUser(id: ID!): AdminUserType
  // @Mutation adminCreateUser(input: CreateAdminUserInput!): AdminUserType!
  // @Mutation adminUpdateUser(id: ID!, input: UpdateAdminUserInput!): AdminUserType!
  // @Mutation adminDeactivateUser(id: ID!): Boolean!
  // @Mutation adminAssignUserPermissions(userId: ID!, overrides: [PermissionOverrideInput!]!): Boolean!
}
```

Usar `@CurrentUser()` para `requesterId` y `getTenantIdFromContext(context)` para `tenantId`.

---

## Tests requeridos

### `admin-users.service.spec.ts`

- `createUser` — genera contraseña temporal, llama `sendWelcome`, retorna user sin `passwordHash`.
- `createUser` — lanza `ConflictException` si email duplicado.
- `deactivateUser` — lanza `ForbiddenException` si `userId === requesterId`.
- `updateUser` — bloquea cambio de rol sobre sí mismo.
- `assignUserPermissions` — replace-all (delete + create en transacción).

### `admin-users.repository.spec.ts`

- `findAll` — filtra por `tenantId`, excluye `deletedAt != null` por defecto.
- `deactivate` — setea `isActive=false` y `deletedAt`.

### `admin-users.controller.spec.ts`

- `GET /api/admin/users` — 200 con mock service.
- `POST /api/admin/users` — 201 con body válido.
- `DELETE /api/admin/users/:id` — 200 OK.

---

## Criterios de Aceptación

- [ ] `GET /api/admin/users` retorna lista paginable de usuarios del tenant.
- [ ] `POST /api/admin/users` crea usuario con contraseña temporal y dispara `sendWelcome`.
- [ ] `PATCH /api/admin/users/:id` actualiza email o roleId.
- [ ] `DELETE /api/admin/users/:id` soft-delete (`isActive=false`, `deletedAt=now()`).
- [ ] Un rol no autorizado recibe 403 en todos los endpoints.
- [ ] GraphQL mutations retornan el tipo correcto.
- [ ] Tests unitarios pasan con `> 80%` cobertura en service.

## Validación

```bash
npm run typecheck
npm run test -- apps/api/src/admin/users
npm run lint
```

## Riesgos

| Riesgo                                                  | Mitigación                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `EmailModule` no exporta `AuthEmailService`             | Verificar `email.module.ts` exports antes de importar en `AdminUsersModule`       |
| `PermissionsModule` no visible en `AdminModule`         | Importar `PermissionsModule` en `AdminModule` (o en `AppModule` globalmente)      |
| Contraseña temporal expuesta en logs                    | No loggear `passwordHash` ni el temporal raw; usar variable local sin persistirla |
| `UserPermission` replace-all borra overrides históricos | Comportamiento intencional — documentar en endpoint description                   |
