# MES-09 Task 03 — Order Document API, DTOs & Material Snapshot

## Goal

Wire document models into plant services: material snapshot on plan, document PATCH, enriched order detail.

**Depends on:** Tasks 01–02  
**Blocks:** Tasks 04–05

---

## Scope

- Interfaces + DTOs for materials, byproducts, quality checks, document header fields.
- Repository transactions for snapshot and upserts.
- Extend `planOrder` to create `ProductionOrderMaterial` rows.
- `PATCH /api/plant/orders/:id/document`
- Extend create/update draft DTOs with optional `productionDate`, `deliveryDate`, `packageWeight`, `batchWeight`, `lotNumber`.

---

## Out of Scope

- PDF rendering (task 04).
- Stock deduction on `consumedQuantity`.

---

## Files allowed

- `apps/api/src/mes/plant/**`

---

## Material snapshot on plan

When `POST /api/plant/orders/:id/plan` succeeds:

1. Load recipe phases with `PhaseInput` + `supplyItem`.
2. Aggregate quantities: sum `quantityPerBatch * order.batchCount` per `supplyItemId`.
3. Delete existing `ProductionOrderMaterial` for order (idempotent re-plan if ever allowed).
4. Insert rows with `materialName`, `requiredQuantity`, `unit`, `sortOrder` (BOM order).

If same supply appears in multiple phases, **merge into one line** (sum quantities).

---

## Document PATCH

### `PATCH /api/plant/orders/:id/document`

**RBAC:** SUPERVISOR+

**Body:**

```typescript
{
  lotNumber?: string | null;
  productionDate?: string | null;  // ISO date
  deliveryDate?: string | null;
  packageWeight?: string | null;
  batchWeight?: string | null;
  notes?: string | null;
  materials?: Array<{
    id: string;
    lotNumber?: string | null;
    consumedQuantity?: string | null;
  }>;
  byproducts?: Array<{
    id?: string;           // omit for create
    itemName: string;
    unit: StockUnit;
    actualQuantity?: string | null;
    lotNumber?: string | null;
    expirationDate?: string | null;
    _delete?: boolean;     // if id present
  }>;
  qualityChecks?: Array<{
    checkType: ProductionQualityCheckType;
    temperature?: string | null;
    color?: string | null;
    smell?: string | null;
    texture?: string | null;
    notes?: string | null;
  }>;
}
```

**Status rules (D11):**

| Order status        | Allowed updates                                                                |
| ------------------- | ------------------------------------------------------------------------------ |
| DRAFT               | All fields including weights/dates                                             |
| PLANNED             | dates, lot, materials (lot/consumed), byproducts, quality                      |
| IN_PROCESS / PAUSED | materials consumed, byproducts, quality, route via execution PATCH             |
| COMPLETED           | quality + notes read-only unless supervisor override flag (default: read-only) |
| CANCELLED           | reject                                                                         |

---

## Detail response shape

Extend existing order detail:

```typescript
interface ProductionOrderDetail {
  // ... existing ...
  lotNumber?: string | null;
  productionDate?: string | null;
  deliveryDate?: string | null;
  packageWeight?: string | null;
  batchWeight?: string | null;
  materials: ProductionOrderMaterialDto[];
  byproducts: ProductionByproductDto[];
  qualityChecks: ProductionQualityCheckDto[];
  executions: PhaseExecutionDetailDto[]; // includes route fields from task 02
}
```

---

## Create / update draft (optional in this task)

If low effort, allow setting `productionDate`, `deliveryDate`, `packageWeight`, `batchWeight`, `lotNumber` on:

- `POST /api/plant/orders`
- `PATCH /api/plant/orders/:id` (existing draft update)

---

## Acceptance criteria

- [ ] Plan creates material lines matching recipe BOM × batchCount.
- [ ] Document PATCH upserts quality checks by `checkType`.
- [ ] Byproducts CRUD via document PATCH.
- [ ] Order detail returns full document graph.
- [ ] Service tests cover plan snapshot aggregation and PATCH rules.
