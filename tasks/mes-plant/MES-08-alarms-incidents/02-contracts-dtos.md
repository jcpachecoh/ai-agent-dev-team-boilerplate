# MES-08 Task 02 — Contracts & DTOs

## Goal

Define TypeScript interfaces and Swagger DTOs for alarm pipeline (internal) and incidents HTTP API.

**Depends on:** Task 01.  
**Blocks:** Tasks 03–08.

---

## Scope

- Extend `plant.interfaces.ts` with alarm/incident types and service/repository signatures.
- Create DTO/response files under `controller/dto/` for incidents routes.
- Document BullMQ job payload types (TypeScript interfaces only).

---

## Out of Scope

- Service/repository/controller implementation.
- Prisma migration.
- Gateway implementation.
- Tests (task 09).

---

## Files allowed

- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts` — extend
- `apps/api/src/mes/plant/interfaces/alarm.interfaces.ts` — create (optional split)
- `apps/api/src/mes/plant/controller/dto/create-incident.dto.ts` — create
- `apps/api/src/mes/plant/controller/dto/list-incidents-query.dto.ts` — create
- `apps/api/src/mes/plant/controller/dto/resolve-incident.dto.ts` — create
- `apps/api/src/mes/plant/controller/dto/incident.response.ts` — create
- `apps/api/src/mes/plant/controller/dto/alarm-triggered.payload.ts` — create (WS doc type)

---

## Files forbidden

- `apps/api/src/mes/auth/**` (logic changes)
- `apps/api/src/mes/plant/repository/**`
- `apps/api/src/mes/plant/service/**` (except type-only files if split)
- `apps/api/src/mes/plant/controller/plant.controller.ts`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/plant/**`

---

## Implementation notes

### Internal interfaces

**`IAlarmEvaluator`** (pure):

```typescript
evaluateTenantAlarms(input: AlarmEvaluationContext, now: Date): AlarmCandidate[];
```

**`IAlarmRepository`**:

- `findActiveExecutionsForAlarmScan(tenantId): Promise<ExecutionAlarmRow[]>`
- `findDelayedOrdersForAlarmScan(tenantId, now): Promise<OrderAlarmRow[]>`
- `findRecentDispatch(tenantId, key): Promise<PlantAlarmDispatch | null>`
- `createDispatch(record): Promise<PlantAlarmDispatch>`

**`IIncidentRepository`** / **`IIncidentService`**:

- `createIncident`, `listIncidents`, `resolveIncident`

**Adapters (interfaces only):**

- `IAlarmPushAdapter.send(params): Promise<void>`
- `IEmergencyAlertAdapter.notify(params): Promise<void>`

### BullMQ job payload

```typescript
interface PlantAlarmNotificationJob {
  tenantId: string;
  alarmType: PlantAlarmType;
  severity: AlarmSeverity;
  message: string;
  stationId: string;
  orderId?: string;
  executionId?: string;
  dispatchId: string;
}
```

### Incidents HTTP DTOs

**POST `/api/plant/incidents`**

| Field           | Validation                    |
| --------------- | ----------------------------- |
| `workStationId` | required string               |
| `executionId`   | optional string               |
| `orderId`       | optional string               |
| `type`          | IncidentType enum             |
| `severity`      | AlarmSeverity enum            |
| `description`   | required string, min length 1 |
| `photoUrl`      | optional URL string           |

**GET query**

| Param           | Type                                       |
| --------------- | ------------------------------------------ |
| `orderId`       | optional                                   |
| `workStationId` | optional                                   |
| `type`          | optional enum                              |
| `severity`      | optional enum                              |
| `resolved`      | optional boolean (`true` = has resolvedAt) |

**PATCH resolve body**

| Field        | Validation                    |
| ------------ | ----------------------------- |
| `resolution` | required string, min length 1 |

### WS payload types (document)

**`alarm:triggered`**

```json
{
  "alarmType": "TIEMPO_EXCEDIDO",
  "severity": "warning",
  "stationId": "ws-uuid",
  "orderId": "order-uuid",
  "executionId": "exec-uuid",
  "message": "Fase excedió tiempo estándar"
}
```

**`incident:created`**

```json
{
  "incidentId": "inc-uuid",
  "stationId": "ws-uuid",
  "orderId": "order-uuid",
  "executionId": "exec-uuid",
  "type": "QUALITY",
  "severity": "warning"
}
```

Align with ticket; do not mirror legacy `apps/plant` payload shapes if they differ.

---

## Acceptance criteria

- [ ] Interfaces cover evaluator, repository, incident service, adapters.
- [ ] Incident DTOs match ticket routes with class-validator rules.
- [ ] WS payload types documented in dto or interfaces file.
- [ ] No HTTP DTO for alarm creation (alarms are system-only).

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
