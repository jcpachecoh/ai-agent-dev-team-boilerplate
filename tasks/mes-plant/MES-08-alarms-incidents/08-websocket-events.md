# MES-08 Task 08 — WebSocket Events

## Goal

Extend plant WebSocket layer to emit `alarm:triggered` and `incident:created` to tenant rooms.

**Depends on:** Task 02 (payload types).  
**Blocks:** Tasks 06, 07, 09.

---

## Scope

- Extend `PlantGateway` with emit methods.
- Extend `PlantEventsService` with public methods used by worker + incident service.
- Document payload contracts matching ticket (not legacy plant app shapes).

---

## Out of Scope

- New Socket.IO auth mechanism (reuse MES JWT handshake from MES-05).
- `operator:connected` event (follow-up).
- Client changes in `apps/plant/**`.

---

## Files allowed

- `apps/api/src/mes/plant/gateway/plant.gateway.ts` — extend
- `apps/api/src/mes/plant/service/plant-events.service.ts` — extend
- `apps/api/src/mes/plant/test/plant.gateway.spec.ts` — extend (or defer to 09)

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/api/src/mes/auth/**`
- `apps/plant/**`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### `PlantGateway`

```typescript
emitAlarmTriggered(tenantId: string, payload: AlarmTriggeredPayload): void {
  this.server.to(`tenant:${tenantId}`).emit('alarm:triggered', payload);
}

emitIncidentCreated(tenantId: string, payload: IncidentCreatedPayload): void {
  this.server.to(`tenant:${tenantId}`).emit('incident:created', payload);
}
```

Optional: also emit to `station:{stationId}` when `payload.stationId` present.

### `PlantEventsService`

- `emitAlarmTriggered(tenantId, payload)`
- `emitIncidentCreated(tenantId, payload)`

Keep `emitPhaseStatusChanged` unchanged.

### Payload alignment (D9)

Ticket minimum fields — do not require client-specific fields from `apps/plant/src/services/plant-socket.service.ts` if they differ. Document canonical API payload in task 02.

Reference client expects:

```typescript
{ stationId, message, severity: 'info' | 'warning' | 'critical' }
```

Map enum `AlarmSeverity` → lowercase for WS if needed (`WARNING` → `warning`).

---

## Acceptance criteria

- [x] Both events emitted to `tenant:{tenantId}` room.
- [x] Gateway spec asserts event name + payload shape.
- [x] No regression to `phase:status_changed`.
- [x] Single WS path for `alarm:triggered`: `PLANT_ALARM_EVENTS` → `PlantEventsService` → `PlantGateway`.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant.gateway
```
