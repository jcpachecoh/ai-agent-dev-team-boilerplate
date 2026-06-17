# MES-02 Task 03 — Service: Workstations

## Goal

Implement workstation business logic in `PlantService` (or a dedicated partial class/file if preferred — single `PlantService` implementing `IPlantService` is required by structure validator).

**Depends on:** Tasks 01–02.

---

## Scope

- Workstation methods in `apps/api/src/mes/plant/service/plant.service.ts`:
  - `createWorkStation`
  - `findAllWorkStations`
  - `updateWorkStation`
  - `softDeleteWorkStation` (DELETE soft)

---

## Out of Scope

- Recipe, phase, input methods (tasks 04–05).
- Controller, DTOs, module wiring.
- Tests (task 09).
- Changes to repository beyond using existing methods.

---

## Files allowed

- `apps/api/src/mes/plant/service/plant.service.ts` — create or extend (workstation methods only in this task)

---

## Files forbidden

- `apps/api/src/mes/auth/**`
- `apps/api/src/supplyitems/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- Controller, DTO, module files

---

## Implementation notes

### Inject

- `PlantRepository` only (no `PrismaService` in service).

### `createWorkStation`

- Enforce unique `code` per tenant: if repository finds duplicate → `ConflictException`.
- Validate `workStationId` references not needed on create.
- Pass `tenantId` from argument into repository create data.

### `updateWorkStation`

- `findOne` pattern: load by `tenantId` + `id` → `NotFoundException` if null.
- If updating `code`, check uniqueness excluding current id.

### `softDeleteWorkStation`

- Load workstation; `NotFoundException` if missing.
- Call `hasActiveExecutionsForWorkStation(tenantId, id)`:
  - If `true` → `ConflictException` (or `BadRequestException`) with clear message: cannot deactivate while executions are active.
- Repository: `update` `isActive: false` (do not hard delete).

### List

- Return active-only vs all: default list all for tenant unless product specifies `?isActive` (optional; document in follow-up if omitted).

---

## Acceptance criteria

- [ ] `PlantService` implements workstation methods on `IPlantService`.
- [ ] Soft delete sets `isActive: false`.
- [ ] Soft delete blocked when active executions exist on station.
- [ ] Tenant enforced on all operations.
- [ ] Service does not inject `PrismaService`.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
