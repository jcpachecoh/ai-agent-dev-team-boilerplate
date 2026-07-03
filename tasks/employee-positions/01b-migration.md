# EMP-POS-01 Task 01b — Migration + backfill

## Goal

Crear migración SQL para `employee_positions`, `employee_position_history` y columna `positionId` en `employee_details`.

**Depends on:** Task 01.

---

## Scope

- Crear migración Prisma `add_employee_positions`.
- Script SQL de backfill opcional en la misma migración o comentado para ejecución manual.

---

## Out of scope

- Cambios al schema Prisma (ya en Task 01).
- Implementación de services/controllers.

---

## Files allowed

- `apps/api/prisma/migrations/<timestamp>_add_employee_positions/migration.sql`

---

## Files forbidden

- `apps/api/src/**`
- Otras migraciones existentes

---

## Implementation notes

```bash
cd apps/api
npx prisma migrate dev --name add_employee_positions
```

La migración debe incluir:

1. `CREATE TABLE employee_positions`
2. `CREATE TABLE employee_position_history`
3. `ALTER TABLE employee_details ADD COLUMN position_id` (nullable FK)
4. Índices y constraints del schema

### Backfill opcional (post-migración, script separado o seed)

Para empleados existentes con `position` texto libre:

1. Crear `EmployeePosition` por cada `position` distinto por tenant (área desde `EmployeeDetails.area`).
2. Actualizar `employee_details.position_id`.
3. Insertar fila inicial en `employee_position_history` con `effectiveFrom = hireDate`.

> Si el backfill automático es riesgoso, documentar como paso manual en staging y dejar `positionId` null hasta asignación explícita.

---

## Acceptance criteria

- [ ] Migración solo contiene cambios de employee positions.
- [ ] `npx prisma migrate deploy` exit 0 en local.
- [ ] `npx prisma validate` exit 0.

---

## Validation commands

```bash
cd apps/api
npx prisma migrate dev --name add_employee_positions
npx prisma validate
```
