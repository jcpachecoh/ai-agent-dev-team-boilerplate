# Task: Supply Items Schema Evolution

## Goal

Evolve the existing `Insumo` model into `SupplyItem` with comprehensive supply chain fields.

## Scope

- Rename model `Insumo` to `SupplyItem` in `apps/api/prisma/schema.prisma`.
- Update `@@map` from `"insumos"` to `"supply_items"`.
- Add new fields: `codigoInterno`, `categoriaId`, `descripcion`, `unidadBase`, `factorConversion`, `costoPromedioPonderado`, `stockMinimoBodega`, `stockMaximoBodega`, `aplicaVencimiento`, `aplicaLote`.
- Configure unique constraint for `codigoInterno` per tenant.

## Testing Strategy

- **Schema-only task.**
- Validation via Prisma CLI structural checks.

## Requirements

- Preserve existing `id`, `tenantId`, `nombre`, `isActive`, and timestamps.
- `codigoInterno` must be unique per `tenantId`.
- `costoPromedioPonderado` and `factorConversion` must be `Decimal`.
- Link to `SupplyCategory` via `categoriaId`.

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
