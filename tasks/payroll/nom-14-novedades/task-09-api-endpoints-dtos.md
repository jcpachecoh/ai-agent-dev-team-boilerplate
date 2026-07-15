# NOM-14 Task 09 — API REST, controller y DTOs

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 06](./task-06-storage-support-doc.md), [Task 08](./task-08-notifications.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Exponer endpoints REST documentados con Swagger para el ciclo de vida de novedades y configuración por tipo.

---

## Scope

### Estructura módulo

```
apps/api/src/payroll-novedades/
├── controller/
│   ├── payroll-novedades.controller.ts
│   └── dto/
│       ├── submit-novedad.dto.ts
│       ├── reject-novedad.dto.ts
│       ├── list-novedades-query.dto.ts
│       └── update-novedad-type-config.dto.ts
```

### Endpoints `PayrollNovedadesController`

| Método  | Ruta                                        | Rol / permiso                           |
| ------- | ------------------------------------------- | --------------------------------------- |
| `POST`  | `/payroll-novedades`                        | Empleado (CONN-07) / `NOMINA`           |
| `GET`   | `/payroll-novedades`                        | Listado con filtros (bandeja/histórico) |
| `GET`   | `/payroll-novedades/:id`                    | Detalle                                 |
| `POST`  | `/payroll-novedades/:id/approve/supervisor` | `SUPERVISOR`/`MANAGER`                  |
| `POST`  | `/payroll-novedades/:id/reject/supervisor`  | `SUPERVISOR`/`MANAGER`                  |
| `POST`  | `/payroll-novedades/:id/approve/rrhh`       | `NOMINA`                                |
| `POST`  | `/payroll-novedades/:id/reject/rrhh`        | `NOMINA`                                |
| `POST`  | `/payroll-novedades/:id/support`            | Upload soporte                          |
| `GET`   | `/payroll-novedades/:id/support/download`   | Presigned URL                           |
| `PATCH` | `/payroll-novedades/:id`                    | Editar novedad (`NOMINA`) — task 12     |
| `GET`   | `/payroll-novedades/:id/audit`              | Historial auditoría — task 12           |

### Endpoints `NovedadTypeConfigController` (o sub-ruta)

| Método  | Ruta                                   | Rol      |
| ------- | -------------------------------------- | -------- |
| `GET`   | `/payroll-novedades/type-config`       | `NOMINA` |
| `PATCH` | `/payroll-novedades/type-config/:type` | `NOMINA` |

### DTOs

- Validación `class-validator`: fechas, enum, `rejectionReason` min 1 char en reject.
- **Nunca** aceptar `tenantId` en body.
- Cursor pagination en list: `cursor`, `take` (default 20).

### Guards

- `JwtAuthGuard` en todos los endpoints.
- Permisos RBAC según `rbac.config` (añadir en task 10 si aplica).

### Postman

- Carpeta `NOM-14 Payroll Novedades` en colección existente.

---

## Out of scope

- GraphQL.
- Wire en `app.module.ts` (registrar en módulo importado por feature module padre si existe patrón).

---

## Files allowed

- `apps/api/src/payroll-novedades/controller/**` — create
- `apps/api/src/payroll-novedades/payroll-novedades.module.ts` — modify
- `postman/restopsiq-api.collection.json` — modify (solo carpeta NOM-14)

---

## Files forbidden

- `apps/api/src/app.module.ts` (salvo instrucción explícita)
- `apps/web-app/**`
- `prisma/schema.prisma`

---

## Acceptance criteria

- [ ] Swagger documenta todos los endpoints.
- [ ] Listado soporta filtros de bandeja RRHH y supervisor.
- [ ] Reject sin motivo retorna 400.
- [ ] Supertest o e2e smoke en task 11.

---

## Validation commands

```bash
pnpm --filter=api test -- payroll-novedades.controller
node scripts/validate-structure.js
```
