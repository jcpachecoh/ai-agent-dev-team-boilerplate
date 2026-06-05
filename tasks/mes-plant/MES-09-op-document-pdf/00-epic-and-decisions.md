# MES-09 Task 00 — Epic & Locked Decisions

## Goal

Lock schema and API decisions for the physical OP document before implementation tasks 01–05.

**References:** `../MES-09-op-document-pdf.md`, physical form screenshot (ORDEN DE PRODUCCIÓN — Palos de Leña).

---

## Scope

- Decision log + epic checklist.
- Reconciliation with existing `ProductionOrder` / `PhaseExecution` fields.

---

## Out of Scope

- Application code.
- Migrations.

---

## Files allowed

- `tasks/mes-plant/MES-09-op-document-pdf/00-epic-and-decisions.md` (this file)

---

## Files forbidden

- Everything under `apps/api/src/`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Locked decisions

| #   | Decision                   | Value                                                                                                                                                                                                              |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Module location            | Extend `apps/api/src/mes/plant/`                                                                                                                                                                                   |
| D2  | Material lines             | **`ProductionOrderMaterial`** snapshot at **plan** time; aggregate all `PhaseInput` rows for recipe × `batchCount`; denormalize `materialName`                                                                     |
| D3  | Expected / produced weight | Use existing **`plannedQuantity`** / **`producedQuantity`** (Decimal, same unit as recipe). **Do not** add `expectedUnits` / `producedUnits` Int columns — form “PRODUCCIÓN ESPERADA KG” maps to `plannedQuantity` |
| D4  | Package / batch weight     | Add **`packageWeight`** and **`batchWeight`** on `ProductionOrder`; optional on create/plan; editable via document PATCH                                                                                           |
| D5  | OP lot vs material lots    | **`ProductionOrder.lotNumber`** = finished-good lot (header); material lines have own **`lotNumber`**                                                                                                              |
| D6  | Process route timing       | **`startedAt`** / **`completedAt`** on `PhaseExecution` = HORA INICIAL / HORA FINAL; set by phase runtime (existing + future MES-06)                                                                               |
| D7  | Process route extras       | Add **`operatorCount`**, **`deliveredQuantity`**, **`responsibleUserId`** on `PhaseExecution`                                                                                                                      |
| D8  | Responsible display        | PDF/UI resolve `responsibleUserId` → `OperationalUser` name; allow null until operator fills form                                                                                                                  |
| D9  | Quality checks             | One row per **`ProductionQualityCheckType`** enum value per order (5 rows max per form section); sensory columns as nullable strings                                                                               |
| D10 | Byproducts                 | **`ProductionByproduct`** child rows; **`expirationDate`** per row (form column VENCE)                                                                                                                             |
| D11 | Document PATCH scope       | Supervisor may PATCH document fields on **DRAFT** freely; on **IN_PROCESS** / **PAUSED** only consumption, route rows, quality, byproducts — not recipe/batchCount                                                 |
| D12 | PDF library                | **`pdfkit`** (or `@pdf-lib/pdf-lib`) in `apps/api`; no headless browser in MES-09                                                                                                                                  |
| D13 | PDF logo                   | Embed PNG from `packages/ui/.../palos-de-lena-logo-dark.png` copied or imported at build time into API assets path `apps/api/assets/branding/`                                                                     |
| D14 | PDF route                  | **`GET /api/plant/orders/:id/pdf`** — sync generation, stream response                                                                                                                                             |
| D15 | Auth                       | MES JWT; tenant from token; RBAC SUPERVISOR+ for PDF and document PATCH                                                                                                                                            |

---

## Epic checklist

### Schema (task 01)

- [ ] `ProductionOrder`: `lotNumber`, `productionDate`, `deliveryDate`, `packageWeight`, `batchWeight`
- [ ] `ProductionOrderMaterial`, `ProductionByproduct`, `ProductionQualityCheck`
- [ ] `ProductionQualityCheckType` enum
- [ ] Migration applied

### Phase route (task 02)

- [ ] `PhaseExecution`: `operatorCount`, `deliveredQuantity`, `responsibleUserId`
- [ ] `PATCH /api/plant/executions/:id/route`
- [ ] Order detail includes responsible user display name

### API (task 03)

- [ ] Plan creates material snapshot
- [ ] `PATCH /api/plant/orders/:id/document`
- [ ] Detail DTO includes materials, byproducts, qualityChecks

### PDF (task 04)

- [ ] Template matches form sections
- [ ] `GET /api/plant/orders/:id/pdf`

### Tests (task 05)

- [ ] Snapshot + PDF smoke tests
- [ ] validate-structure + typecheck pass

### Web (external)

- [ ] `tasks/web-app/03-produccion-op-document-pdf.md`
