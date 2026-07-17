# CONN-04b Task 02 — Interfaces y repository

**Domain:** `[BACKEND]`  
**Status:** `completed`  
**Depends on:** [Task 01](./task-01-schema-migration.md)  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

Extender contratos TypeScript y `OvertimeRepository` para crear/consultar solicitudes administrativas y operaciones de batch, sin lógica de negocio de autorización.

---

## Scope

### Interfaces (`overtime.interfaces.ts`)

- Extender `OvertimeRequestRecord` / summary / detail con: `type` (ya existe), `workDate`, `proposed*`, `reasonOptionId`, `requestedByUserId`, `batchId`.
- Input create admin (datos ya validados por service): `CreateAdministrativeOvertimeRequestData` (una fila; el service arma N filas + `batchId`).
- Métodos repo:
  - `createAdministrativeRequest(tenantId, data, tx?)`
  - `createAdministrativeRequests(tenantId, rows[], tx)` — usa `Prisma.TransactionClient` provisto por el service (no abre `$transaction` propia).
  - `findAdministrativeByEmployeeWorkDate(...)`
  - `findOverlappingAdministrativeWindows(...)` — solape por intervalos; excluye `deletedAt` y `OBJETADA`.
  - `findByBatchId(tenantId, batchId)`
  - `mapRequest` incluye campos admin sin coerciones.

### Repository

- Solo Prisma/data access.
- Toda query con `tenantId` y `deletedAt: null` donde corresponda.
- No lanzar HTTP exceptions.
- Detección (`findActiveAutomaticByPeriod`, etc.) **sin cambios de comportamiento**.

### Catálogo OVERTIME_REASON

- **No** se duplica acceso en `OvertimeRepository`.
- Task-03 valida `reasonOptionId` vía `EmployeeCatalogRepository.findAll(tenantId, OVERTIME_REASON)` (ya filtra `isActive: true` + `tenantId`). No hay `findActiveById` hoy; membership por `id` en la lista es suficiente hasta que exista un getter por id en payroll.

---

## Out of scope

- Service de create / authz.
- Controller POST.
- Frontend.
- Seeds / permisos / NOM-07.

---

## Files allowed

- `apps/api/src/overtime/interfaces/**`
- `apps/api/src/overtime/repository/**`
- `apps/api/src/overtime/test/overtime.repository.spec.ts`
- Fixtures mínimas de specs CONN-04a (solo `null` en columnas admin) para typecheck tras extender `OvertimeRequestRecord`:
  - `apps/api/src/overtime/test/overtime-approval.service.spec.ts`
  - `apps/api/src/overtime/test/overtime-detection.service.spec.ts`
  - `apps/api/src/overtime/test/overtime-notification.service.spec.ts`
  - `apps/api/src/overtime/test/overtime.controller.spec.ts`
  - `apps/api/src/overtime/test/overtime.service.spec.ts`

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/api/src/overtime/controller/**` (salvo que GET lo exija; no se tocó)
- `apps/web-app/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] Tipos alineados al schema task-01.
- [x] Create batch vía `TransactionClient` (service abre `$transaction`).
- [x] Tests repo con mocks Prisma: create N filas, lookup por workDate, overlap, batchId, sin coerciones.
- [x] Queries detection intactas.
- [x] Catálogo reutilizado (no duplicado en overtime repo).

---

## Limitación documentada

Extender `OvertimeRequestRecord` con campos admin requeridos rompe fixtures tipadas de specs CONN-04a. Se actualizaron solo con `null` en columnas admin (sin cambiar comportamiento de tests).

---

## Validation commands

```bash
cd apps/api && pnpm exec jest src/overtime/test/overtime.repository.spec.ts --runInBand
cd apps/api && pnpm exec tsc --noEmit -p tsconfig.json
```
