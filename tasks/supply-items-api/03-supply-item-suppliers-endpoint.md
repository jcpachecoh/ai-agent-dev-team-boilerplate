# Task: Supply Item Suppliers Endpoint

## Goal

Implement the specialized endpoint to view suppliers associated with a specific supply item.

## Scope

- **Endpoint**: `GET /supply-items/:id/suppliers`.
- Implementation in repository, service, and controller.

## Requirements

- Return a list of suppliers linked via `SupplierProduct`.
- Include: `supplierId`, `razonSocial`, `nit`, `precioUnitario`, `unidadCompra`, `factorConversion`, `tiempoEntregaDias`, `esProveedorPrincipal`.
- Query must be tenant-scoped.

## Acceptance Criteria

- Endpoint returns correct data for a given supply item.
- Returns empty list if no suppliers are associated.
- Throws `NotFoundException` if the supply item does not exist or belongs to another tenant.

## Files Likely Affected

- `apps/api/src/supply-items/repository/supply-items.repository.ts`
- `apps/api/src/supply-items/service/supply-items.service.ts`
- `apps/api/src/supply-items/controller/supply-items.controller.ts`

## Out of Scope

- Updating supplier prices from this endpoint.

## Validation Commands

```bash
cd apps/api
npm run test supply-items
```
