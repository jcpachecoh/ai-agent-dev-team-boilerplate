# MES-08 Task 07 — Incidents Service & API

## Goal

Implement manual incident reporting and supervisor resolution HTTP routes under `/api/plant/incidents`.

**Depends on:** Tasks 01–02.  
**Blocks:** Tasks 08–09.

---

## Scope

- `IncidentRepository` + `IncidentService` business rules.
- Controller routes on `PlantController` (or `IncidentController` under `@Controller('plant')`).
- Tenant scoping via MES JWT; RBAC per D11.
- Emit `incident:created` via events service on POST (task 08 method).

---

## Out of Scope

- Alarm cron/worker.
- Photo upload multipart — accept `photoUrl` string only.
- Changes to `apps/plant/**`.

---

## Files allowed

- `apps/api/src/mes/plant/repository/incident.repository.ts` — create
- `apps/api/src/mes/plant/service/incident.service.ts` — create
- `apps/api/src/mes/plant/controller/plant.controller.ts` — add incident routes
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend
- DTOs from task 02 (if not created yet, this task may create them per 02 file list)

---

## Files forbidden

- `apps/api/prisma/**` (unless 01 incomplete — stop and finish 01)
- `apps/api/src/mes/auth/**` (logic changes)
- `package.json` / `pnpm-lock.yaml` (unless missing deps from 05)
- `apps/plant/**`

---

## Implementation notes

### POST `/api/plant/incidents`

- Auth: `MesJwtGuard`; reporter = `req.user.sub` / operational user id from JWT payload
- Validate `workStationId` belongs to tenant
- Optional `executionId` / `orderId` must belong to tenant
- Create `ProductionIncident` with `resolvedAt = null`
- Return 201 + incident DTO
- Trigger WS via `PlantEventsService.emitIncidentCreated`

### GET `/api/plant/incidents`

- RBAC: `@Roles(SUPERVISOR, OWNER, MANAGER)` (adjust to match MesRolesGuard enums)
- Filters: `orderId`, `workStationId`, `type`, `severity`, `resolved` boolean
- Pagination: optional `limit`/`offset` — document default limit 50

### PATCH `/api/plant/incidents/:id/resolve`

- RBAC: supervisor+
- Body: `{ resolution: string }`
- Set `resolvedAt = now()`, `resolvedBy = req.user operational id`, `resolution`
- 409 if already resolved
- 404 if wrong tenant
- Repository resolve uses tenant-scoped `updateMany({ where: { id, tenantId } })`

### Separation from alarms

- Incidents service must **not** write to `PlantAlarmDispatch`.
- Manual incident does **not** suppress automatic alarms unless business rule added later (not in MES-08).

---

## Acceptance criteria

- [x] Three HTTP routes implemented per ticket.
- [x] Tenant enforced on all operations.
- [x] Separate `ProductionIncident` persistence only.
- [x] POST emits `incident:created` via `PlantEventsService`.
- [ ] Controller tests mock service (extended in task 07; full table in task 09).

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='incident|plant.controller'
```
