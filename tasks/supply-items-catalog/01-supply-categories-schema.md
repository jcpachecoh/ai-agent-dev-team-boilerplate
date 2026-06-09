# Task: Supply Categories Schema

## Goal

Add the `SupplyCategory` model to the Prisma schema to allow tenant-customizable categorization.

## Scope

- Define `SupplyCategory` model in `apps/api/prisma/schema.prisma`.
- Configure tenant-scoped unique constraints and indexes.

## Testing Strategy

- **Schema-only task.**
- Validation via Prisma CLI structural checks.

## Requirements

- `id` must be CUID.
- `tenantId` is mandatory.
- `nombre` must be unique per tenant.
- Table mapping: `@@map("supply_categories")`.

## Acceptance Criteria

- `npx prisma format` runs without errors.
- `npx prisma validate` passes.
- `npx prisma generate` runs successfully.

## Files Likely Affected

- `apps/api/prisma/schema.prisma`

## Validation Commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```
