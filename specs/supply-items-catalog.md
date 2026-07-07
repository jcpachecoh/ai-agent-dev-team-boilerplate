# Spec: Supply Items Catalog

## Overview

This specification defines the evolution of the supply catalog, transforming the minimal `Insumo` model into a comprehensive `SupplyItem` entity and introducing tenant-customizable categories.

## Business Requirements

- **Multi-tenancy:** Every record must be scoped by `tenantId`.
- **Supply Categories:** Tenants can define their own categories for supplies.
- **Supply Items:** Comprehensive tracking of items with internal codes, units, and inventory properties.
- **Weighted Average Cost:** Track `costoPromedioPonderado` using `Decimal` for precision.
- **Inventory Safety:** Define minimum and maximum stock levels per item.

## Database Schema (Prisma)

### Models

#### SupplyCategory

- `id`: String (CUID), Primary Key
- `tenantId`: String
- `nombre`: String
- `createdAt`: DateTime (Default: now)
- `updatedAt`: DateTime (Updated automatically)

**Constraints & Indexes:**

- `@@map("supply_categories")`
- `@@index([tenantId])`
- `@@unique([tenantId, nombre])`

#### SupplyItem (Evolved from Insumo)

- `id`: String (CUID), Primary Key
- `tenantId`: String
- `nombre`: String
- `codigoInterno`: String
- `categoriaId`: String (FK to SupplyCategory)
- `descripcion`: String?
- `unidadBase`: StockUnit (Existing Enum)
- `factorConversion`: Decimal (Default: 1.0)
- `costoPromedioPonderado`: Decimal (Default: 0.0)
- `stockMinimoBodega`: Int (Default: 0)
- `stockMaximoBodega`: Int (Default: 0)
- `aplicaVencimiento`: Boolean (Default: false)
- `aplicaLote`: Boolean (Default: false)
- `isActive`: Boolean (Default: true)
- `createdAt`: DateTime (Default: now)
- `updatedAt`: DateTime (Updated automatically)

**Constraints & Indexes:**

- `@@map("supply_items")`
- `@@unique([tenantId, codigoInterno])`
- `@@index([tenantId, categoriaId])`
- `@@index([tenantId, isActive])`

### Relations

- `SupplyCategory` has many `SupplyItem`.
- `SupplyItem` belongs to `SupplyCategory`.
- `SupplierProduct` (Existing) will be updated to reference `SupplyItem` instead of `Insumo`.

## Rules

- `tenantId` is mandatory and must be part of all compound unique/index constraints.
- Use `Decimal` for all financial or precise calculations (`factorConversion`, `costoPromedioPonderado`).
- No `Float` types.
- Rename the existing `Insumo` model to `SupplyItem` to preserve existing relations.

## Testing Strategy

- **Schema Validation (Tasks 01-03):** Verified via `prisma format`, `prisma validate`, and `prisma generate`. Final verification via `prisma migrate dev`.
- **Logic & API (Tasks 04-05):** Service layer unit tests with mocked repositories; Controller tests with DTO validation.
