# NOM-14 Task 03 — Repository

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 02](./task-02-interfaces.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Implementar acceso Prisma para `PayrollNovedad` y `NovedadTypeConfig` con filtros multi-tenant, soft delete y queries de solapamiento y liquidación.

---

## Scope

### Archivos

- `apps/api/src/payroll-novedades/repository/payroll-novedades.repository.ts`
- `apps/api/src/payroll-novedades/repository/novedad-type-config.repository.ts`
- `apps/api/src/payroll-novedades/test/payroll-novedades.repository.spec.ts`

### `PayrollNovedadesRepository`

| Método                     | Descripción                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `create`                   | Insert con `tenantId`                                                                     |
| `findById`                 | `tenantId` + `id` + `deletedAt: null`                                                     |
| `updateStatus`             | Transición atómica con campos de aprobación                                               |
| `list`                     | Cursor-based pagination; filtros de `NovedadListFilters`                                  |
| `findOverlapping`          | Mismo `employeeId`, rangos que intersectan, estados no terminales rechazados o `APROBADA` |
| `findApprovedForPeriod`    | `status: APROBADA`, intersecta `YYYY-MM` (liquidación task 07)                            |
| `updateFields`             | Update parcial campos editables (task 12)                                                 |
| `createAuditLog`           | Insert `NovedadAuditLog` (task 12)                                                        |
| `listAuditLogsByNovedadId` | Historial de ediciones (task 12)                                                          |

### `NovedadTypeConfigRepository`

| Método                | Descripción                    |
| --------------------- | ------------------------------ |
| `findByTenantAndType` | Config de un tipo              |
| `listByTenant`        | Todos los tipos del tenant     |
| `upsert`              | Actualizar flags configurables |

### Reglas

- Nunca query sin `tenantId`.
- No lanzar excepciones HTTP — retornar `null` o arrays vacíos.
- Cursor pagination: `take + 1`, `orderBy: { createdAt: 'desc' }`.

---

## Out of scope

- Lógica de negocio (task 05).
- Controller.

---

## Files allowed

- `apps/api/src/payroll-novedades/repository/**` — create
- `apps/api/src/payroll-novedades/test/payroll-novedades.repository.spec.ts` — create
- `apps/api/src/payroll-novedades/payroll-novedades.module.ts` — modify (providers)

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Todos los métodos filtran `tenantId` y `deletedAt: null` donde aplique.
- [ ] `findOverlapping` detecta intersección inclusiva de fechas.
- [ ] `findApprovedForPeriod` prorratea query por mes calendario.
- [ ] Tests con Prisma mockeado.

---

## Validation commands

```bash
pnpm --filter=api test -- payroll-novedades.repository.spec
node scripts/validate-structure.js
```
