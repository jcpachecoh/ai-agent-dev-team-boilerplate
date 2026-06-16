# Task: Supplier Products Schema Implementation

## Goal

Add the `SupplierProduct` model to the Prisma schema and link it to `Supplier` and `Insumo`.

## Scope

- Define `SupplierProduct` model in `apps/api/prisma/schema.prisma`.
- Configure foreign key relations to `Supplier` and `Insumo`.
- Configure indexes and database mapping.

## Testing Strategy

- This is a **schema-only task**.
- Validation is performed through Prisma structural checks and final migration verification.
- No NestJS unit tests are required at this stage.

## Requirements

- `id` must be CUID.
- `tenantId` is mandatory.
- `precioUnitario` and `factorConversion` must be `Decimal`.
- Table mapping: `@@map("supplier_products")`.
- Unique constraint on `[tenantId, supplierId, insumoId]`.

## Acceptance Criteria

- `npx prisma format` runs without errors.
- `npx prisma validate` passes.
- `npx prisma generate` runs successfully.
- `npx prisma migrate dev --name add_suppliers_catalog --create-only` or full migrate succeeds in a local environment.

## Files Likely Affected

- `apps/api/prisma/schema.prisma`

## Out of Scope

- API controllers, services, or unit tests.

## Validation Commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name add_suppliers_catalog
```
