# Spec: Supply Items API

## Overview

This specification defines the RESTful API for managing **Supply Items** (`SupplyItem` / table `supply_items`), the backend implementation of **Insumo / materia prima** in the supply catalog epic. Menu products (`MenuProduct`) and recipe BOM are **out of scope**.

**SupplyCategory** remains a tenant-scoped, flexible catalog (not a fixed enum). **Frontend** (`apps/web-app`) is not part of this backend closure track.

### Stock and units (MVP)

| Field                                     | Role                                                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `unidadBase`                              | `StockUnit` including `BOX` (English enum values)                                                  |
| `stockMinimoBodega` / `stockMaximoBodega` | Alert thresholds (unchanged names)                                                                 |
| `stockActualBodega`                       | MVP **current warehouse stock**; `Decimal`, default `0`; optional on create/update; must be `>= 0` |
| `stockDisponible` (response)              | Legacy alias of `stockActualBodega` for clients                                                    |

**Inventory** (`/api/inventory/*`) dashboard, alerts, and valuation reports read `stockActualBodega` (not a hardcoded zero). Automatic stock from **inventory movements** and **CPP recalculation on receipt** remain deferred.

## API Endpoints

### Supply Items CRUD

- **POST /supply-items**: Create a new supply item.
- **GET /supply-items**: List all supply items for the current tenant.
- **GET /supply-items/:id**: Get a specific supply item by ID.
- **PATCH /supply-items/:id**: Update an existing supply item.
- **DELETE /supply-items/:id**: Soft delete or deactivate a supply item.

### Specialized Endpoints

- **GET /supply-items/:id/suppliers**: List all suppliers that sell this specific supply item (via `SupplierProduct`).

## DTO Definitions

### CreateSupplyItemDto / UpdateSupplyItemDto

- `nombre`: String
- `codigoInterno`: String (Unique per tenant)
- `categoriaId`: String (UUID/CUID of a valid category)
- `descripcion`: String (Optional)
- `unidadBase`: StockUnit (Enum: `UNIT`, `GRAMS`, `KILOGRAMS`, `ML`, `LITERS`, `BOX`)
- `factorConversion`: Numeric String (Decimal)
- `costoPromedioPonderado`: Numeric String (Decimal)
- `stockMinimoBodega`: Numeric String (Decimal)
- `stockMaximoBodega`: Numeric String (Decimal)
- `stockActualBodega`: Numeric String (Decimal, optional on create; defaults to `0`)
- `aplicaVencimiento`: Boolean
- `aplicaLote`: Boolean
- `isActive`: Boolean

## Multi-Tenancy Rules

- `tenantId` must NEVER be accepted from the request body.
- It must be resolved from the authentication context (or a temporary header for early development).
- Every database query in the Repository layer MUST include a `where: { tenantId }` filter.

## Business Rules

- **Decimal Precision**: All fields involving measurements or money (`factorConversion`, `costoPromedioPonderado`, thresholds) must use `Decimal`. DTOs should accept them as numeric strings.
- **Uniqueness**: `codigoInterno` must be unique within the same `tenantId`.
- **Validation**: `categoriaId` must belong to the same `tenantId` as the supply item.
- **stockActualBodega**: Writable on create/update when provided; omitted on create → `0`. No cross-check against min/max in MVP.

## Architecture

Follow `docs/MODULE-STRUCTURE.md`:

- `interfaces/`: `ISupplyItemsRepository`, `ISupplyItemsService`.
- `repository/`: Prisma-specific implementation.
- `service/`: Business logic, CPP calculations (future), validations.
- `controller/`: Request/Response handling, DTO mapping.
- `test/`: Unit and integration tests.

## Future Scope (Deferred)

- Atomic Weighted Average Cost (CPP) calculation using Redlock.
- Cost variation history tracking.
- Stock movements and goods receipts.
