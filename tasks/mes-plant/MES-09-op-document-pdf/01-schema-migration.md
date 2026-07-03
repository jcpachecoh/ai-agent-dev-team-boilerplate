# MES-09 Task 01 — Schema & Migration

## Goal

Add Prisma models and columns so `ProductionOrder` supports the full physical OP document.

**Depends on:** Task 00 decisions  
**Blocks:** Tasks 02–05

---

## Scope

- Update `apps/api/prisma/schema.prisma`.
- Generate and apply migration.
- Regenerate Prisma client.

---

## Out of Scope

- Service/repository logic (task 03).
- PDF generation (task 04).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`

---

## Files forbidden

- `apps/api/src/**` (except types re-export if build requires — prefer task 03)
- `apps/web-app/**`

---

## Implementation

### 1. Extend `ProductionOrder`

Add nullable columns:

```prisma
lotNumber      String?
productionDate DateTime?
deliveryDate   DateTime?
packageWeight  Decimal? @db.Decimal(10, 3)
batchWeight    Decimal? @db.Decimal(10, 3)
```

Add relations:

```prisma
materials     ProductionOrderMaterial[]
byproducts    ProductionByproduct[]
qualityChecks ProductionQualityCheck[]
```

### 2. `ProductionOrderMaterial`

| Column           | Type           | Notes                                |
| ---------------- | -------------- | ------------------------------------ |
| id               | cuid           | PK                                   |
| tenantId         | String         | index                                |
| orderId          | String         | FK → ProductionOrder, cascade delete |
| supplyItemId     | String?        | FK → SupplyItem optional             |
| materialName     | String         | Required snapshot                    |
| lotNumber        | String?        |                                      |
| requiredQuantity | Decimal(10,3)  |                                      |
| consumedQuantity | Decimal(10,3)? |                                      |
| unit             | StockUnit      |                                      |
| sortOrder        | Int            | default 0                            |

Unique constraint: optional `(orderId, supplyItemId)` where supplyItemId not null — or allow duplicate lines if BOM requires; **default: one row per supplyItemId per order**.

### 3. `ProductionByproduct`

| Column         | Type           |
| -------------- | -------------- |
| itemName       | String         |
| unit           | StockUnit      |
| actualQuantity | Decimal(10,3)? |
| lotNumber      | String?        |
| expirationDate | DateTime?      |

### 4. `ProductionQualityCheck`

```prisma
enum ProductionQualityCheckType {
  LIBERACION_MP
  CORRECCION
  ACCION_CORRECTIVA
  ENTREGA
  RECIBE
}
```

Columns: `checkType`, `temperature`, `color`, `smell`, `texture`, `notes` (all nullable strings except checkType).

Unique: `(orderId, checkType)`.

### 5. Indexes

- `@@index([orderId])` on all child tables
- `@@index([tenantId, orderId])` where useful for list queries

### 6. Migration notes

- All new columns nullable — no backfill required for existing OPs.
- Document in migration comment: materials populated on next `plan` action only.

---

## Acceptance criteria

- [ ] `pnpm --filter api prisma migrate dev` succeeds locally.
- [ ] Prisma client types include new models.
- [ ] No breaking change to existing `ProductionOrder` / `PhaseExecution` queries.
