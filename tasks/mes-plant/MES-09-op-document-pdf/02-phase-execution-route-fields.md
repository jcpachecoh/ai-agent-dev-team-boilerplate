# MES-09 Task 02 — PhaseExecution Route-of-Process Fields

## Goal

Store **Rutas de proceso** table data on each `PhaseExecution`: operarios, responsable, cantidad entregada (plus existing start/end times).

**Depends on:** Task 01  
**Blocks:** Tasks 03–05

---

## Scope

- Prisma columns on `PhaseExecution` (if not added in task 01).
- DTOs, validation, repository update method.
- `PATCH /api/plant/executions/:id/route`
- Include fields in order detail response.

---

## Out of Scope

- Automatic population from `OperatorSession` count (optional enhancement — document as future).
- Phase start/complete HTTP (MES-06).

---

## Files allowed

- `apps/api/prisma/schema.prisma` (PhaseExecution columns only)
- `apps/api/src/mes/plant/**`

---

## Schema additions

```prisma
model PhaseExecution {
  // existing: startedAt, completedAt, producedQuantity ...

  operatorCount     Int?
  deliveredQuantity Decimal? @db.Decimal(10, 3)
  responsibleUserId String?

  responsible OperationalUser? @relation(fields: [responsibleUserId], references: [id])
}
```

### Field mapping (physical form)

| Form column        | Field                              |
| ------------------ | ---------------------------------- |
| HORA INICIAL       | `startedAt`                        |
| HORA FINAL         | `completedAt`                      |
| N° OPERARIOS       | `operatorCount`                    |
| CANTIDAD ENTREGADA | `deliveredQuantity`                |
| RESPONSABLE        | `responsibleUserId` → display name |

**Decision:** Keep `producedQuantity` for MES metrics; **`deliveredQuantity`** is the form’s “cantidad entregada” at phase handoff (may differ during partial batches).

---

## API

### `PATCH /api/plant/executions/:id/route`

**RBAC:** OPERATOR+ (station operator) or SUPERVISOR+

**Body (all optional):**

```typescript
{
  operatorCount?: number;      // min 0, max 99
  deliveredQuantity?: string;  // decimal string
  responsibleUserId?: string;
  notes?: string;
}
```

**Rules:**

- Execution must belong to tenant.
- Order status `IN_PROCESS` or `PAUSED` for operators; supervisors may edit on `COMPLETED` for corrections (audit log optional).
- Validate `responsibleUserId` exists in tenant operational users.

### Order detail enrichment

Each execution in `GET /api/plant/orders/:id`:

```typescript
{
  phaseName: string;
  phaseOrder: number;
  startedAt?: string;
  completedAt?: string;
  operatorCount?: number;
  deliveredQuantity?: string;
  responsibleUserId?: string;
  responsibleName?: string;
}
```

---

## Acceptance criteria

- [ ] Migration applied for PhaseExecution columns.
- [ ] PATCH route updates only route fields.
- [ ] Order detail exposes all route columns for PDF assembly.
- [ ] Unit tests: validation, tenant isolation, not-found cases.
