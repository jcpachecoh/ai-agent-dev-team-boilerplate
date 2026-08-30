# MES-05 Task 07 — WebSocket Phase Events

## Goal

Add Socket.IO WebSocket gateway emitting `phase:status_changed` when phase execution status changes.

**Depends on:** Tasks 03, 05, 06.

---

## Scope

- Install WebSocket dependencies (**this task only**).
- Create gateway under `apps/api/src/mes/plant/gateway/`.
- Emit on plan, internal chain complete, qa-approve, pause, resume.
- Wire into `PlantModule` (and `main.ts` adapter if required).

---

## Out of Scope

- Other event types (`alarm:triggered`, etc.).
- Schema changes.
- Complete-phase HTTP.
- Postman (task 10).

---

## Files allowed

- `apps/api/package.json` — add dependencies (this task only)
- `pnpm-lock.yaml` — from install
- `apps/api/src/mes/plant/gateway/plant.gateway.ts` — create
- `apps/api/src/mes/plant/service/plant-events.service.ts` — create (optional)
- `apps/api/src/mes/plant/plant.module.ts` — register gateway
- `apps/api/src/main.ts` — IoAdapter if required
- `apps/api/src/mes/plant/service/plant.service.ts` — inject emitter (plan/pause/resume)
- `apps/api/src/mes/plant/service/phase-chain.service.ts` — inject emitter

---

## Files forbidden

- `apps/api/src/mes/auth/**` (logic changes)
- `apps/api/prisma/**`
- `scripts/validate-structure.js`

---

## Implementation notes

### Missing packages (document + install here)

Current `apps/api/package.json` has **no** WebSocket stack. Add:

- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`

Run `pnpm install` after editing package.json.

### Event contract

- Name: **`phase:status_changed`**
- Payload:

```typescript
{
  orderId: string;
  phaseId: string;
  stationId: string; // workStationId
  status: string; // PhaseExecutionStatus
}
```

### Emit triggers

- Plan: first phase → `READY`
- `PhaseChainService.completeExecution`: changed executions
- QA approve: next → `READY`
- Pause/resume: affected executions

### Rooms

- Join clients by tenant (and optionally station).
- Broadcast status changes to tenant scope (ticket: all plant KDS).

### Auth

Validate MES JWT on connection handshake without modifying auth module logic.

---

## Acceptance criteria

- [ ] Packages installed successfully.
- [ ] Gateway starts with Nest app.
- [ ] Status mutations emit `phase:status_changed` with required payload fields.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm install
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
node scripts/validate-structure.js
```
