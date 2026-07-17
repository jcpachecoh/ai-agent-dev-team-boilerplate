# CONN-04b Task 06A — Catálogo editable OVERTIME_REASON

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PAYROLL]`  
**Status:** `completed`  
**Depends on:** [Task 05](./task-05-seeds.md)  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)  
**Ticket:** OS-606

---

## Goal

Cerrar el Acceptance Criterion de motivos editables reutilizando `EmployeeCatalogOption`. **No** incluye el formulario de solicitud administrativa (task-06).

---

## Scope

- Extender CRUD HTTP del módulo `employee-catalogs` (list + create + update + soft-deactivate).
- `includeInactive` para administración; default active-only para formularios.
- FE admin en `/payroll/catalogs` (fuera de bandeja de aprobación).
- Tests de permisos, tenant, duplicados, desactivación referenciada y seeds.

## Out of scope

- Formulario batch de solicitud (task-06).
- Tarjeta OS-551, NOM-07, pending-salary, Postman.
- Catálogo paralelo `OvertimeReasonCatalog`.
- Ampliar `attendance.overtime.request` para administrar catálogos.

---

## Auth

| Acción                       | Roles                  |
| ---------------------------- | ---------------------- |
| Listar (activos / inactivos) | `PAYROLL_MODULE_ROLES` |
| Crear / editar / desactivar  | `PAYROLL_WRITE_ROLES`  |

`attendance.overtime.request` **no** autoriza escritura de catálogo.

---

## Routes

| Method  | Path                                            |
| ------- | ----------------------------------------------- |
| `GET`   | `/api/employee-catalogs?type=&includeInactive=` |
| `POST`  | `/api/employee-catalogs`                        |
| `PATCH` | `/api/employee-catalogs/:id`                    |
| `PATCH` | `/api/employee-catalogs/:id/deactivate`         |

FE: `/payroll/catalogs`
