# CONN-06 Task 03 — Repository Prisma

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `completed`  
**Depends on:** [Task 02](./task-02-interfaces.md)  
**Epic:** [CONN-06](./00-epic-and-decisions.md)

---

## Goal

Implementar `DailyCostCenterAssignmentRepository` con acceso Prisma, upsert con respeto de prioridad de `source`, y consultas por empleado/período.

---

## Scope

### `DailyCostCenterAssignmentRepository`

Implementa `IDailyCostCenterAssignmentRepository`.

### Upsert con prioridad de fuente (D2)

Al recibir `upsertForDay`:

| Estado existente | Fuente entrante  | Acción                                 |
| ---------------- | ---------------- | -------------------------------------- |
| Sin fila         | Cualquiera       | Crear                                  |
| `MANUAL`         | Automática       | **No actualizar** (retornar existente) |
| `MARCACION_*`    | `TURNO_ASIGNADO` | Actualizar                             |
| `MARCACION_*`    | `MARCACION_*`    | Actualizar si misma o mayor prioridad  |
| Automática       | `MANUAL`         | Actualizar siempre                     |

Prioridad numérica sugerida: `MANUAL=3`, `TURNO_ASIGNADO=2`, `MARCACION_ASISTENCIA=1`.

### Consultas

- `findByEmployeeAndDateRange`: filtrar `tenantId`, rango inclusive en `date`.
- `findByTenantAndDateRange`: opcional filtro `employeeId`, `locationId`, `source`.
- `findPendingDays`: requiere definición acordada — días en rango donde empleado es `ROTANTE` y no existe fila en `DailyCostCenterAssignment`. Puede delegar a query raw o post-proceso según calendario laboral disponible en CONN-03.

### Tenant safety

Todas las queries incluyen `tenantId` en `where`.

---

## Out of scope

- Lógica de negocio de resolución (task 04).
- HTTP endpoints (task 06).
- Prorrateo NOM-24 (task 07).

---

## Files allowed

- `apps/api/src/daily-cost-center/repository/**`
- `apps/api/src/daily-cost-center/test/daily-cost-center-assignment.repository.spec.ts`
- `apps/api/src/daily-cost-center/daily-cost-center.module.ts` (registrar repository)

---

## Files forbidden

- `schema.prisma` (salvo bugfix de task 01)
- `apps/web-app/**`
- Hooks attendance/turnos

---

## Acceptance criteria

- [x] Upsert respeta que `MANUAL` no sea sobrescrito por automático.
- [x] Unique `(tenantId, employeeId, date)` no genera duplicados en concurrencia (manejo Prisma `P2002` si aplica).
- [x] Tests repository con mocks Prisma: crear, upsert prioridad, rango fechas.
- [x] Todas las queries filtran `tenantId`.

---

## Validation commands

```bash
pnpm --filter=api test -- daily-cost-center-assignment.repository
pnpm --filter=api typecheck
node scripts/validate-structure.js
```
