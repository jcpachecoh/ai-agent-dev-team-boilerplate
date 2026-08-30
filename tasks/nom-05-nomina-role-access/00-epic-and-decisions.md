# NOM-05 Task 00 — Análisis y decisiones

## Goal

Documentar el estado actual del codebase y las decisiones para restringir el acceso del rol `NOMINA` al módulo de Nómina en web-app y API.

**Epic:** OS-478 | **Módulo:** OS-376  
**Depends on:** USR-02 (RBAC), AUTH-09 (GraphQL guards), NOM-02/03/04 (payroll REST)

---

## Scope

- Inventario de roles existentes, navegación y rutas de nómina.
- Decisión sobre `RolesGuard` vs `PermissionsGuard` para este ticket.
- Mapeo de módulos web-app → roles permitidos.
- Definición de alcance solo lectura para `NOMINA`.

## Out of scope

- Implementación de código en este task.
- Cambios en schema Prisma (salvo seed de rol en Task 02 si se aprueba ahí).
- Kiosko MES / plant operator flows.

## Allowed files

- `tasks/nom-05-nomina-role-access/**`

## Forbidden files

- `apps/**`, `packages/**`, `postman/**`, `schema.prisma`

---

## Estado actual (codebase)

### Roles en seed (`apps/api/prisma/seed.ts`)

Hoy existen: `OWNER`, `SUPERVISOR`, `MANAGER`, `OPERATOR`, `OPERATIONS_ADMIN`.  
**No existe `NOMINA`.**

### JWT / sesión web-app

- `useMe()` expone `roleCode` del usuario autenticado.
- `Sidebar.tsx` ya filtra `usuarios` solo para `OWNER` y `SUPERVISOR` (`ADMIN_ONLY_NAV_IDS`).

### Navegación nómina (`apps/web-app/src/constants/navigation.ts`)

Módulo `id: 'nomina'` con hijos:

| id                 | label                 | path                  |
| ------------------ | --------------------- | --------------------- |
| payroll            | Reportes              | `/payroll`            |
| payroll-employees  | Empleados             | `/payroll/employees`  |
| payroll-attendance | Monitor de asistencia | `/payroll/attendance` |
| payroll-salaries   | Salarios              | `/payroll/salaries`   |

**Decisión:** En fase 1, `NOMINA` ve solo **Reportes, Empleados y Asistencia**. Ocultar **Salarios** hasta definición de producto.

### Backend nómina

| Capa              | Ubicación                                               | Auth actual    |
| ----------------- | ------------------------------------------------------- | -------------- |
| REST empleados    | `apps/api/src/payroll/controller/payroll.controller.ts` | `JwtAuthGuard` |
| REST asistencia   | `apps/api/src/attendance/`                              | `JwtAuthGuard` |
| REST reportes     | `apps/api/src/reports/`                                 | `JwtAuthGuard` |
| GraphQL empleados | `apps/api/src/payroll/resolver/employees.resolver.ts`   | `JwtAuthGuard` |

No hay restricción por rol de módulo hoy; cualquier usuario autenticado del tenant puede llamar endpoints si conoce la URL.

### RBAC existente (AUTH-09)

- `PermissionsGuard` + catálogo global `Permission` (USR-02).
- Payroll REST **no** usa `PermissionsGuard` aún.
- Para este ticket se prioriza **control por rol de módulo** (`NOMINA`) con matriz centralizada; extensión del catálogo `payroll.*` queda como mejora futura.

---

## Decisiones aprobadas

| Tema                 | Decisión                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Nombre del rol       | `NOMINA` (código en `Role.code`)                                                                                                |
| ADMIN del user story | Mapear a `OWNER` + `SUPERVISOR` en este repo                                                                                    |
| Rutas URL            | Mantener `/payroll/*` (no renombrar a `/nomina/*`)                                                                              |
| Config FE            | `apps/web-app/src/config/rbac.config.ts`                                                                                        |
| Config BE            | `apps/api/src/common/config/rbac.config.ts` (espejo de módulos/roles)                                                           |
| Guard BE             | Extender o crear `RolesGuard` en `apps/api/src/common/guards/`; aplicar en controllers REST de nómina y otros módulos sensibles |
| Solo lectura NOMINA  | `GET` permitido en payroll/attendance/reports; `POST`/`PATCH`/`DELETE` → 403                                                    |
| Menú                 | Ocultar entradas (no deshabilitar) fuera de nómina                                                                              |
| Deep link            | Redirigir a `/unauthorized`                                                                                                     |

---

## Matriz objetivo (resumen)

```typescript
// apps/web-app/src/config/rbac.config.ts (Task 01)
export enum AppModule {
  NOMINA = 'NOMINA',
  INVENTARIOS = 'INVENTARIOS',
  PROVEEDORES = 'PROVEEDORES',
  PRODUCCION = 'PRODUCCION',
  RECETAS = 'RECETAS',
  EMPRESA = 'EMPRESA',
  USUARIOS = 'USUARIOS',
  CONFIGURACION = 'CONFIGURACION',
}

export const MODULE_ROLES: Record<AppModule, RoleCode[]> = {
  [AppModule.NOMINA]: ['OWNER', 'SUPERVISOR', 'MANAGER', 'NOMINA'],
  [AppModule.INVENTARIOS]: ['OWNER', 'SUPERVISOR', 'MANAGER'],
  // ...
};
```

---

## Orden de implementación

1. Task 01 — Matriz RBAC (FE + BE)
2. Task 02 — Seed rol `NOMINA` + guards backend
3. Task 03 — Filtro `Sidebar` + hook `useModuleAccess`
4. Task 04 — `ProtectedRoute` + `/unauthorized`
5. Task 05 — Tests y validación

## Stop rule

Detenerse tras crear/validar archivos de task 00–05. No implementar código en este task.
