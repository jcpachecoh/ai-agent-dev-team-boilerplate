# Spec: Supply Items API

## Overview

This specification defines the RESTful API for managing Supply Items, including CRUD operations and visibility into associated suppliers.

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
- `unidadBase`: StockUnit (Enum)
- `factorConversion`: Numeric String (Decimal)
- `costoPromedioPonderado`: Numeric String (Decimal)
- `stockMinimoBodega`: Numeric String (Decimal)
- `stockMaximoBodega`: Numeric String (Decimal)
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
