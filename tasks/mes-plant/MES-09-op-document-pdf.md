# MES-09 — Production Order Document Model & PDF Export

**Ticket:** MES-09  
**Branch:** `feature/mes-plant-core` (MES-05 orders + MES-02 recipes)  
**Status:** Planned  
**Priority:** High

---

## Goal

Extend the Prisma schema and plant API so a **Production Order (OP)** fully mirrors the physical **“ORDEN DE PRODUCCIÓN”** form used at Palos de Leña (materials, process route, quality release, byproducts, packaging weights), and expose a **PDF download** endpoint that renders the same layout with live data.

**Reference:** Physical OP form (AJIACO BASE example) — header, materiales, fechas, batches/pesos, rutas de proceso, liberación MP, coproductos, observaciones.

---

## Scope

- Prisma schema: new fields on `ProductionOrder`, new child models, extended `PhaseExecution` for route-of-process columns.
- Migration + seed/backfill notes for existing OP rows.
- Plant repository/service/DTO updates: create, plan, detail, and patch flows populate and return document fields.
- Material snapshot on OP plan (from recipe `PhaseInput` BOM aggregated per order).
- `GET /api/plant/orders/:id/pdf` — server-generated PDF matching the physical form layout.
- Unit tests for schema mapping, PDF payload assembly, and HTTP route.
- Web-app task (separate): download action on OP detail/list — see `tasks/web-app/03-produccion-op-document-pdf.md`.

**Prerequisites (already on branch):**

- MES-05: `ProductionOrder`, `PhaseExecution`, order lifecycle APIs.
- MES-02: `ProductionRecipe`, `ProductionPhase`, `PhaseInput`, `SupplyItem`.
- Logo assets: `packages/ui/src/components/web-login/assets/palos-de-lena-logo-*.png` (and sidebar mark assets if present).

---

## Out of Scope

- Operator tablet UI for filling route-of-process cells during production (MES-06 / `apps/plant` — follow-up).
- Inventory stock movements when recording `consumedQuantity` on materials (audit-only snapshot in MES-09).
- Controlled-copy metadata box (CÓDIGO / VERSIÓN / EMISIÓN) — hardcode placeholders in PDF template unless tenant config exists later.
- Email delivery of PDF (download only in MES-09).
- `lint:fix`, repo-wide formatting.

---

## Physical Form → Data Model Mapping

| Form section / field                           | System source                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| Logo + “ORDEN DE PRODUCCIÓN”                   | PDF template (static)                                                         |
| ITEM                                           | `ProductionRecipe.finishedProduct` or recipe name                             |
| FECHA DE GENERACIÓN OP                         | `ProductionOrder.createdAt`                                                   |
| OP. N°                                         | `ProductionOrder.number`                                                      |
| **Materiales** table                           | `ProductionOrderMaterial[]`                                                   |
| — MATERIAL                                     | `supplyItem.name` or denormalized `materialName`                              |
| — LOTE                                         | `ProductionOrderMaterial.lotNumber`                                           |
| — CANTIDAD REQUERIDA                           | `requiredQuantity` (computed at plan from BOM × `batchCount`)                 |
| — CANTIDAD CONSUMIDA                           | `consumedQuantity` (filled during/at end of production)                       |
| — UNIDAD DE MEDIDA                             | `unit` (`StockUnit`)                                                          |
| FECHA DE PRODUCCIÓN                            | `ProductionOrder.productionDate`                                              |
| FECHA DE ENTREGA DE PRODUCCIÓN                 | `ProductionOrder.deliveryDate`                                                |
| PRODUCCIÓN ESPERADA (KG)                       | `ProductionOrder.plannedQuantity` (existing)                                  |
| PRODUCCIÓN OBTENIDA (KGS)                      | `ProductionOrder.producedQuantity` (existing)                                 |
| CANTIDAD DE BATCHES A PRODUCIR                 | `ProductionOrder.batchCount` (existing)                                       |
| PESO APROXIMADO POR PAQUETE                    | `ProductionOrder.packageWeight`                                               |
| PESO TOTAL DEL BATCHE                          | `ProductionOrder.batchWeight`                                                 |
| **Rutas de proceso**                           | `PhaseExecution[]` ordered by `ProductionPhase.order`                         |
| — OPERACIÓN                                    | `ProductionPhase.name`                                                        |
| — HORA INICIAL                                 | `PhaseExecution.startedAt`                                                    |
| — HORA FINAL                                   | `PhaseExecution.completedAt`                                                  |
| — N° OPERARIOS                                 | `PhaseExecution.operatorCount` (**new**)                                      |
| — CANTIDAD ENTREGADA                           | `PhaseExecution.deliveredQuantity` (**new**)                                  |
| — RESPONSABLE                                  | `PhaseExecution.responsibleUserId` → `OperationalUser` display name (**new**) |
| **Liberación MP** (TEMP, COLOR, OLOR, TEXTURA) | `ProductionQualityCheck[]` by `checkType`                                     |
| **Coproductos**                                | `ProductionByproduct[]`                                                       |
| — VENCE                                        | `ProductionByproduct.expirationDate`                                          |
| OBSERVACIONES                                  | `ProductionOrder.notes`                                                       |
| Lote producto terminado (header)               | `ProductionOrder.lotNumber` (**new**)                                         |

---

## Target Schema (minimum)

```prisma
model ProductionOrder {
  // ... existing fields ...

  lotNumber       String?
  productionDate  DateTime?
  deliveryDate    DateTime?

  packageWeight   Decimal? @db.Decimal(10, 3)
  batchWeight     Decimal? @db.Decimal(10, 3)

  qualityChecks   ProductionQualityCheck[]
  materials       ProductionOrderMaterial[]
  byproducts      ProductionByproduct[]
}

model ProductionOrderMaterial {
  id               String   @id @default(cuid())
  tenantId         String
  orderId          String
  supplyItemId     String?
  materialName     String   // snapshot for PDF if item deleted
  lotNumber        String?
  requiredQuantity Decimal  @db.Decimal(10, 3)
  consumedQuantity Decimal? @db.Decimal(10, 3)
  unit             StockUnit
  sortOrder        Int      @default(0)

  order ProductionOrder @relation(...)
  // optional supplyItem relation
}

model ProductionByproduct {
  id             String    @id @default(cuid())
  tenantId       String
  orderId        String
  itemName       String
  unit           StockUnit
  actualQuantity Decimal?  @db.Decimal(10, 3)
  lotNumber      String?
  expirationDate DateTime?

  order ProductionOrder @relation(...)
}

enum ProductionQualityCheckType {
  LIBERACION_MP
  CORRECCION
  ACCION_CORRECTIVA
  ENTREGA
  RECIBE
}

model ProductionQualityCheck {
  id          String                     @id @default(cuid())
  tenantId    String
  orderId     String
  checkType   ProductionQualityCheckType
  temperature String?
  color       String?
  smell       String?  // olor
  texture     String?  // textura
  notes       String?

  order ProductionOrder @relation(...)
}

model PhaseExecution {
  // ... existing fields ...

  operatorCount     Int?
  deliveredQuantity Decimal? @db.Decimal(10, 3)
  responsibleUserId String?
  responsible       OperationalUser? @relation(...)
}
```

**Note on quantities:** Keep `plannedQuantity` / `producedQuantity` (Decimal, KG) as canonical production totals. Do **not** add duplicate `expectedUnits` / `producedUnits` unless a follow-up ticket defines package-unit counting separate from weight — see task 00 decision D3.

---

## HTTP Route Contracts

| Method | Path                              | RBAC        | Description                                                                                                                                    |
| ------ | --------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/plant/orders/:id/pdf`       | SUPERVISOR+ | Returns `application/pdf` attachment (`Content-Disposition: attachment; filename="OP-{number}.pdf"`)                                           |
| PATCH  | `/api/plant/orders/:id/document`  | SUPERVISOR+ | Update document-only fields (dates, lot, weights, materials consumption, byproducts, quality checks) — **DRAFT + IN_PROCESS** rules in task 03 |
| PATCH  | `/api/plant/executions/:id/route` | OPERATOR+   | Update route-of-process row: operatorCount, deliveredQuantity, responsibleUserId, notes                                                        |

Existing order detail `GET /api/plant/orders/:id` must include nested `materials`, `byproducts`, `qualityChecks`, and extended `executions` for PDF and UI.

---

## Epic Acceptance Criteria

- [ ] Schema migrated; existing OPs remain readable (nullable new columns).
- [ ] On **plan**, materials snapshot created from recipe BOM × `batchCount`.
- [ ] Order detail returns all document sections needed for PDF.
- [ ] `PhaseExecution` stores operarios, responsable, cantidad entregada; PDF shows them in “Rutas de proceso”.
- [ ] PDF layout matches physical form sections (logo, tables, blank cells for unfilled data).
- [ ] PDF generation < 3s for typical OP (≤ 20 materials, ≤ 10 phases) in unit test smoke.
- [ ] `validate-structure.js`, typecheck, plant tests pass.

---

## Task Breakdown

| Task | File                                                        | Description                          |
| ---- | ----------------------------------------------------------- | ------------------------------------ |
| 00   | `MES-09-op-document-pdf/00-epic-and-decisions.md`           | Locked decisions + checklist         |
| 01   | `MES-09-op-document-pdf/01-schema-migration.md`             | Prisma models + migration            |
| 02   | `MES-09-op-document-pdf/02-phase-execution-route-fields.md` | Route fields + runtime PATCH         |
| 03   | `MES-09-op-document-pdf/03-api-services-dtos.md`            | Order document CRUD + plan snapshot  |
| 04   | `MES-09-op-document-pdf/04-pdf-generation-endpoint.md`      | PDF template + GET route             |
| 05   | `MES-09-op-document-pdf/05-tests.md`                        | Unit/integration tests               |
| WEB  | `tasks/web-app/03-produccion-op-document-pdf.md`            | Download PDF action in supervisor UI |

---

## Dependencies

- **Blocks:** Supervisor OP PDF download (web-app task 03).
- **Blocked by:** MES-05 order APIs (done).
