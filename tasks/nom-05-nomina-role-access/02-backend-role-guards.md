# NOM-05 Task 02 — Backend: rol NOMINA y guards

**Domain:** `[BACKEND]` `[API]` `[RBAC]` `[PAYROLL]`  
**Status:** `pending`  
**Depends On:** [01-rbac-config-matrix.md](./01-rbac-config-matrix.md)

---

## Goal

Crear el rol `NOMINA` en seed y aplicar guards que restrinjan acceso por módulo y por método HTTP (solo lectura para nómina).

---

## Scope

### Seed y rol

- [ ] Agregar rol `NOMINA` en `apps/api/prisma/seed.ts` (upsert idempotente).
- [ ] Asignar permisos mínimos de lectura de nómina si se integra con `PermissionsGuard` (opcional; no bloqueante si se usa solo `RolesGuard`).
- [ ] Crear usuario de prueba `nomina@palos-de-lena.dev` (documentar credenciales en comentario del seed).

### Guards y decoradores

- [ ] Crear o extender `apps/api/src/common/guards/roles.guard.ts`:
  - Lee `roleCode` del JWT (`request.user`).
  - Valida contra `@Roles(...)` o metadata de módulo.
  - Siempre valida `tenantId` (JWT + header `x-tenant-id` coherentes).
- [ ] Crear `apps/api/src/common/decorators/roles.decorator.ts` con `@Roles(...roleCodes: RoleCode[])`.
- [ ] Crear decorador `@ReadOnlyForNomina()` o lógica en guard que bloquee `POST`/`PATCH`/`DELETE` para rol `NOMINA` en módulo nómina.

### Aplicar guards

**Nómina — permitir NOMINA (lectura):**

| Controller             | Rutas GET                                 | Mutaciones                            |
| ---------------------- | ----------------------------------------- | ------------------------------------- |
| `PayrollController`    | `GET /employees`, `GET /employees/:id`, … | Solo `OWNER`, `SUPERVISOR`, `MANAGER` |
| `AttendanceController` | listados / reportes                       | Idem                                  |
| `ReportsController`    | `/reports/payroll`, `/reports/attendance` | Export POST solo roles con escritura  |

**GraphQL (si aplica en payroll):**

- [ ] `EmployeesResolver` queries → `NOMINA` permitido.
- [ ] `EmployeesResolver` mutations → `NOMINA` → `ForbiddenException`.

**Otros módulos — rechazar NOMINA:**

- [ ] Aplicar `@Roles()` excluyendo `NOMINA` en al menos:
  - `SupplyItemsController` o equivalente inventario
  - `SupplierController`
  - Un resolver GraphQL de inventario/proveedores

- [ ] Token `NOMINA` contra endpoint inventario → `403 Forbidden`.

## Out of scope

- Cambios en frontend (Tasks 03–04).
- Refactor global de todos los controllers del monorepo (solo módulos representativos + todos los de nómina).
- Nuevo schema Prisma (rol vive en tabla `Role` existente).

## Files allowed

- `apps/api/src/common/guards/roles.guard.ts`
- `apps/api/src/common/decorators/roles.decorator.ts`
- `apps/api/src/common/config/rbac.config.ts` (consumo desde guard)
- `apps/api/src/payroll/controller/payroll.controller.ts`
- `apps/api/src/payroll/resolver/employees.resolver.ts`
- `apps/api/src/attendance/controller/**`
- `apps/api/src/reports/controller/**`
- `apps/api/src/supplyitems/controller/**` (o módulo inventario elegido para test negativo)
- `apps/api/src/supplier/controller/**` (opcional, negativo)
- `apps/api/prisma/seed.ts`
- `apps/api/src/common/guards/test/roles.guard.spec.ts` (o `apps/api/src/common/test/`)
- `apps/api/src/payroll/test/**` (ajustes mínimos)

## Files forbidden

- `apps/api/src/app.module.ts` (salvo que sea estrictamente necesario registrar guard global — documentar y pedir aprobación)
- `packages/**`
- `apps/web-app/**`
- Migraciones Prisma nuevas

---

## Acceptance criteria

- [ ] Rol `NOMINA` existe en seed y es idempotente.
- [ ] `GET /api/employees` con JWT `NOMINA` → `200`.
- [ ] `POST /api/employees` con JWT `NOMINA` → `403`.
- [ ] `GET /api/supply-items` (o equivalente) con JWT `NOMINA` → `403`.
- [ ] Guard valida `tenantId`; request sin tenant coherente → `400`/`403` según patrón existente.
- [ ] `OWNER`/`MANAGER` siguen pudiendo mutar empleados.

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter @restopsiq/api test -- --testPathPattern=roles.guard
pnpm --filter @restopsiq/api typecheck
pnpm --filter @restopsiq/api exec prisma db seed   # entorno local
```

## Notes

- Preferir `@UseGuards(JwtAuthGuard, RolesGuard)` en controllers REST (patrón ya usado en admin con `PermissionsGuard`).
- Documentar en Postman carpeta nueva “NOMINA RBAC” (opcional en Task 05).
