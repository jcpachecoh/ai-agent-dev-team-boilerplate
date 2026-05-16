# Task: Insumos Minimal Schema Implementation

## Goal

Add the minimal `Insumo` model and `StockUnit` enum to the Prisma schema.

## Scope

- Define `StockUnit` enum.
- Define `Insumo` model in `apps/api/prisma/schema.prisma`.
- Configure indexes and database mapping.

## Testing Strategy

- This is a **schema-only task**.
- Validation is performed through Prisma structural checks.
- No NestJS unit tests are required at this stage.

## Requirements

- `id` must be CUID.
- `tenantId` is mandatory.
- Table mapping: `@@map("insumos")`.
- Index on `[tenantId, isActive]`.

## Acceptance Criteria

- `npx prisma format` runs without errors.
- `npx prisma validate` passes.
- `npx prisma generate` runs successfully.

## Files Likely Affected

- `apps/api/prisma/schema.prisma`

## Out of Scope

- Running migrations (deferred to Task 03).
- API controllers, services, or unit tests.

## Validation Commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```
