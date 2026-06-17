# Task: Supplier Products Relation Alignment

## Goal

Align the `SupplierProduct` model to reference the renamed `SupplyItem` model.

## Scope

- Update `SupplierProduct` model fields and relations in `apps/api/prisma/schema.prisma`.
- Rename `insumoId` to `supplyItemId` (optional but recommended for consistency) or just update the relation type.

## Testing Strategy

- **Schema-only task.**
- Final database verification via migration.

## Requirements

- Update `SupplierProduct` to point to `SupplyItem`.
- Update `@@unique` and `@@index` to reflect renamed fields.
- Execute `npx prisma migrate dev` to apply all changes (Categories, SupplyItems, and Alignment).

## Acceptance Criteria

- `npx prisma format` and `validate` pass.
- `npx prisma migrate dev --name evolve_insumos_to_supply_items` runs successfully.

## Files Likely Affected

- `apps/api/prisma/schema.prisma`

## Validation Commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name evolve_insumos_to_supply_items
```
