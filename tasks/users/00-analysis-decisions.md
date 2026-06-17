# Users Admin — Task 00: Análisis y Decisiones

## Objetivo

Documentar el análisis del módulo de administración de usuarios y roles, y definir la secuencia de tareas de implementación. **No hay cambios de código en esta tarea.**

**Depends on:** USR-01 (User schema), USR-02 (RBAC permissions catalog), AUTH-09 (GraphQL RBAC guard + `PermissionsGuard`), AUTH-10 (audit testing)

---

## Alcance del módulo

Administración completa de usuarios y roles del tenant, con las siguientes operaciones:

### Backend (API NestJS)

- CRUD de Usuarios globales (`User`) — con password temporal + email de bienvenida
- CRUD de Roles (`Role`) + asignación de permisos a un rol (`RolePermission`)
- Overrides de permisos por usuario (`UserPermission`)
- Listado del catálogo de permisos (`Permission`) — solo lectura
- **Restricción:** solo roles `OWNER` y `SUPERVISOR` pueden ejecutar estas operaciones

### Frontend (web-app)

- Página `/users` — tabla CRUD de usuarios con modal de creación/edición
- Página `/users/roles` — tabla CRUD de roles + panel de asignación de permisos
- Página `/users/permissions` — catálogo de permisos (solo lectura + overrides por usuario)
- Sidebar: sección "Usuarios" ya definida en `navigation.ts` (no requiere cambios)
- Sidebar visible solo para `OWNER` / `SUPERVISOR` en runtime

---

## Decisiones registradas

### D1 — Autorización: Permission codes, no Role guard directo

**Decisión:** Usar `@RequirePermission('admin.users.read')` etc. con el `PermissionsGuard` existente, NO un guard de rol hardcoded.

**Razón:** Consistencia con el sistema RBAC ya implementado (USR-02 / AUTH-09). El seed asigna los nuevos códigos al OWNER y SUPERVISOR; la resolución es server-side via `PermissionsService.hasPermission`.

**Nuevos códigos (14-20):**

| ID seed                              | Code                             | Módulo | Resource          | Action     |
| ------------------------------------ | -------------------------------- | ------ | ----------------- | ---------- |
| cccccccc-0000-0000-0000-000000000014 | `admin.users.read`               | admin  | users             | read       |
| cccccccc-0000-0000-0000-000000000015 | `admin.users.create`             | admin  | users             | create     |
| cccccccc-0000-0000-0000-000000000016 | `admin.users.update`             | admin  | users             | update     |
| cccccccc-0000-0000-0000-000000000017 | `admin.users.deactivate`         | admin  | users             | deactivate |
| cccccccc-0000-0000-0000-000000000018 | `admin.roles.read`               | admin  | roles             | read       |
| cccccccc-0000-0000-0000-000000000019 | `admin.roles.manage`             | admin  | roles             | manage     |
| cccccccc-0000-0000-0000-000000000020 | `admin.roles.permissions.assign` | admin  | roles.permissions | assign     |

**Matriz de roles:**

| Role             | Nuevos permisos asignados                                                          |
| ---------------- | ---------------------------------------------------------------------------------- |
| OWNER            | todos los 7                                                                        |
| SUPERVISOR       | `admin.users.read`, `admin.users.create`, `admin.users.update`, `admin.roles.read` |
| MANAGER          | `admin.users.read`                                                                 |
| OPERATOR         | ninguno                                                                            |
| OPERATIONS_ADMIN | ninguno                                                                            |

### D2 — Transport: REST + GraphQL

**Decisión:** Exponer ambos. REST en `/api/admin/users` y `/api/admin/roles` (controller). GraphQL para la web-app (query/mutation en el resolver).

**Razón:** El front consume GraphQL; REST sirve para Postman/integración externa y consistencia con el patrón del proyecto.

### D3 — Password en creación de usuario

**Decisión:** Al crear un usuario desde admin, se genera contraseña temporal aleatoria (12 chars) y se envía email de bienvenida via `AuthEmailService.sendWelcome`. El usuario debe cambiar la contraseña en primer login.

**Razón:** No exponer la contraseña en la respuesta. Flujo ya soportado por `EmailModule`.

### D4 — Soft delete para usuarios y roles

**Decisión:** Deactivate (`isActive = false`, `deletedAt = now()`) no DELETE físico.

**Razón:** Integridad referencial y auditoría. Prisma schema ya tiene `deletedAt` en `User`.

### D5 — Frontend: no nuevo UI component library

**Decisión:** Usar `ResponsiveTable`, modales, y patterns ya presentes en inventario/recetas features.

**Razón:** Consistencia visual sin introducir nueva dependencia. Ver `apps/web-app/src/components/responsive-table/`.

### D6 — Sidebar gate por roleCode

**Decisión:** La sección "Usuarios" del sidebar solo se renderiza si `roleCode` es `OWNER` o `SUPERVISOR`. Leer desde `useMe` hook existente.

**Razón:** UX limpio. El guard backend protege de todos modos; el gate frontend es solo visual.

---

## Estructura de carpetas nueva en API

```
apps/api/src/admin/
  admin.module.ts
  users/
    controller/
      admin-users.controller.ts
      dto/
        create-user.dto.ts
        update-user.dto.ts
        assign-user-permissions.dto.ts
    service/
      admin-users.service.ts
    repository/
      admin-users.repository.ts
    resolver/
      admin-users.resolver.ts
    interfaces/
      admin-users.interfaces.ts
    test/
      admin-users.service.spec.ts
      admin-users.repository.spec.ts
      admin-users.controller.spec.ts
  roles/
    controller/
      admin-roles.controller.ts
      dto/
        create-role.dto.ts
        update-role.dto.ts
        assign-role-permissions.dto.ts
    service/
      admin-roles.service.ts
    repository/
      admin-roles.repository.ts
    resolver/
      admin-roles.resolver.ts
    interfaces/
      admin-roles.interfaces.ts
    test/
      admin-roles.service.spec.ts
      admin-roles.repository.spec.ts
```

---

## Secuencia de tareas

| #   | Tarea                                | Alcance                                                                   |
| --- | ------------------------------------ | ------------------------------------------------------------------------- |
| 01  | `task-01-seed-permissions.md`        | Agregar 7 nuevos permission codes al seed + matriz de roles               |
| 02  | `task-02-users-rest-api.md`          | `AdminUsersModule` — REST CRUD de Users + GraphQL resolver                |
| 03  | `task-03-roles-rest-api.md`          | `AdminRolesModule` — REST CRUD de Roles + permission assignment + GraphQL |
| 04  | `task-04-frontend-users-page.md`     | web-app `/users` — tabla + modal CRUD                                     |
| 05  | `task-05-frontend-roles-page.md`     | web-app `/users/roles` — tabla + panel de permisos                        |
| 06  | `task-06-frontend-routes-sidebar.md` | Routes, sidebar gate por roleCode, `/users/permissions` catálogo          |

---

## Riesgos

| Riesgo                                                          | Mitigación                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Seed idempotente — IDs fijos colisionan si ya existen           | Usar `upsert` con `where: { code }` igual que permisos existentes                 |
| `AuthEmailService` requiere SMTP configurado en dev             | Degradar a log+skip si `EMAIL_ENABLED=false` en env                               |
| `AdminModule` debe importar `PermissionsModule` y `EmailModule` | Verificar exports en `permissions.module.ts` y `email.module.ts` antes de Task 02 |
| Usuario autoadministra su propio rol                            | Service debe bloquear `roleId` update sobre el usuario autenticado                |
| Sidebar visible para roles no admin                             | Task 06 agrega gate en `AppSidebar` basado en `useMe().roleCode`                  |

## Stop rule

Stop after task files 00–06 exist. No implementar código del módulo admin en esta tarea.

## Validation

```bash
test -f tasks/users/task-01-seed-permissions.md
test -f tasks/users/task-02-users-rest-api.md
test -f tasks/users/task-03-roles-rest-api.md
test -f tasks/users/task-04-frontend-users-page.md
test -f tasks/users/task-05-frontend-roles-page.md
test -f tasks/users/task-06-frontend-routes-sidebar.md
```
