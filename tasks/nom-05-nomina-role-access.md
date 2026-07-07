# NOM-05 — Rol NOMINA: acceso restringido al módulo de Nómina

**Epic padre:** OS-478  
**Módulo relacionado:** OS-376  
**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[RBAC]` `[PAYROLL]`  
**Status:** `pending`  
**Created:** 2026-06-17  
**Story Points (estimado):** 5

---

## Historia de usuario

Como usuario con rol **NOMINA**,  
quiero ver únicamente las vistas del módulo de Nómina al entrar a la web app,  
para que no pueda acceder ni visualizar información de otros módulos del sistema.

---

## Definición del rol NOMINA (fase 1 — solo lectura)

| Permitido                                         | No permitido                                                |
| ------------------------------------------------- | ----------------------------------------------------------- |
| Ver empleados, asistencia y reportes de nómina    | Crear, editar ni eliminar registros de nómina               |
| Menú lateral limitado a Nómina                    | Inventarios, Proveedores, Producción, Sedes, Usuarios, etc. |
| Queries REST/GraphQL de lectura en dominio nómina | Mutations de nómina ni endpoints de otros módulos           |

---

## Tareas (orden de implementación)

| #   | Archivo                                                                                        | Descripción                               |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 00  | [00-epic-and-decisions.md](./nom-05-nomina-role-access/00-epic-and-decisions.md)               | Análisis, decisiones y mapeo al codebase  |
| 01  | [01-rbac-config-matrix.md](./nom-05-nomina-role-access/01-rbac-config-matrix.md)               | Matriz centralizada de módulos y roles    |
| 02  | [02-backend-role-guards.md](./nom-05-nomina-role-access/02-backend-role-guards.md)             | Guards REST + GraphQL para rol NOMINA     |
| 03  | [03-frontend-sidebar-filter.md](./nom-05-nomina-role-access/03-frontend-sidebar-filter.md)     | Filtro del menú lateral (`Sidebar`)       |
| 04  | [04-frontend-protected-routes.md](./nom-05-nomina-role-access/04-frontend-protected-routes.md) | Rutas protegidas y página `/unauthorized` |
| 05  | [05-tests-validation.md](./nom-05-nomina-role-access/05-tests-validation.md)                   | Unit tests, E2E y validación manual       |

---

## Criterios de aceptación (épico)

- [ ] Usuario con rol `NOMINA` solo ve el módulo de Nómina en el menú lateral.
- [ ] Navegar manualmente a `/inventory/**` (u otra ruta fuera de nómina) redirige a `/unauthorized`.
- [ ] Requests con token `NOMINA` a endpoints de otros módulos retornan `403 Forbidden`.
- [ ] Endpoints de lectura de nómina aceptan rol `NOMINA`.
- [ ] Mutations de nómina rechazan rol `NOMINA` (solo `OWNER`, `SUPERVISOR`, `MANAGER` según matriz).
- [ ] El guard valida `tenantId` en todos los accesos (multi-tenant).
- [ ] La matriz de permisos está centralizada (no hardcode por componente).
- [ ] Sin regresiones para `OWNER`, `SUPERVISOR` y `MANAGER` en módule de nómina.

---

## Notas técnicas

- Stack: NestJS · GraphQL code-first · Prisma · React + Vite · PostgreSQL · pnpm.
- El rol `NOMINA` **no existe aún** en `prisma/seed.ts`; debe crearse en Task 02.
- Rutas actuales de nómina en web-app: `/payroll`, `/payroll/employees`, `/payroll/attendance` (no `/nomina/*`).
- Nómina en backend usa principalmente **REST** (`PayrollController`, `AttendanceController`, `ReportsController`), además de resolvers GraphQL en `payroll/`.

---

## Regla SDD

Implementar **una task a la vez**. No avanzar a la siguiente hasta validar la anterior.
