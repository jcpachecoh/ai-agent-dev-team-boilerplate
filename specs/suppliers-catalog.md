# Spec: Suppliers Catalog Schema

## Overview

This specification defines the database schema for the Suppliers Catalog, which includes Suppliers, minimal Insumo (Supply Items) definitions, and the relationship between them via Supplier Products.

## Business Requirements

- Multi-tenancy: Every record must be scoped by `tenantId`.
- Suppliers: Manage basic information, payment conditions, and ratings.
- **Insumos:** Implemented as `SupplyItem` (materia prima / raw materials). `stockActualBodega` holds MVP on-hand quantity; `BOX` is a valid `StockUnit` for base and purchase units.
- Supplier Products: Define which suppliers provide which insumos, including pricing and conversion factors.

## Database Schema (Prisma)

### Enums

#### SupplierTipo

- `PERSONA_NATURAL`
- `PERSONA_JURIDICA`

#### CondicionPago

- `CONTADO`
- `DIAS_15`
- `DIAS_30`
- `DIAS_60`

#### StockUnit

- `UNIT`
- `GRAMS`
- `KILOGRAMS`
- `ML`
- `LITERS`
- `BOX`

### Models

#### Supplier

- `id`: String (CUID), Primary Key
- `tenantId`: String
- `razonSocial`: String
- `nit`: String
- `dv`: String (Optional)
- `tipo`: SupplierTipo
- `direccion`: String (Optional)
- `ciudad`: String (Optional)
- `telefono`: String (Optional)
- `email`: String (Optional)
- `contactoNombre`: String (Optional)
- `condicionPago`: CondicionPago
- `cupoCredito`: Int
- `calificacion`: Decimal
- `isActive`: Boolean (Default: true)
- `createdAt`: DateTime (Default: now)
- `updatedAt`: DateTime (Updated automatically)

**Constraints & Indexes:**

- `@@map("suppliers")`
- `@@unique([tenantId, nit])`
- `@@index([tenantId, isActive])`

#### Insumo

- `id`: String (CUID), Primary Key
- `tenantId`: String
- `nombre`: String
- `isActive`: Boolean (Default: true)
- `createdAt`: DateTime (Default: now)
- `updatedAt`: DateTime (Updated automatically)

**Constraints & Indexes:**

- `@@map("insumos")`
- `@@index([tenantId, isActive])`

#### SupplierProduct

- `id`: String (CUID), Primary Key
- `tenantId`: String
- `supplierId`: String (FK to Supplier)
- `insumoId`: String (FK to Insumo)
- `precioUnitario`: Decimal
- `unidadCompra`: StockUnit
- `factorConversion`: Decimal
- `tiempoEntregaDias`: Int
- `esProveedorPrincipal`: Boolean (Default: false)
- `createdAt`: DateTime (Default: now)
- `updatedAt`: DateTime (Updated automatically)

**Constraints & Indexes:**

- `@@map("supplier_products")`
- `@@index([tenantId, supplierId])`
- `@@index([tenantId, insumoId])`
- `@@unique([tenantId, supplierId, insumoId])`

## Relations

- `Supplier` has many `SupplierProduct`
- `Insumo` has many `SupplierProduct`
- `SupplierProduct` belongs to `Supplier` and `Insumo`

## Rules

- `tenantId` is mandatory and must be used in all unique/compound indexes.
- No Float types; use `Decimal` for financial or precise numeric fields.
- Mapping to snake_case table names using `@@map`.

## Testing Strategy

This feature follows a staged validation approach:

1. **Schema Validation (Tasks 01-03):**
   - Structural integrity is verified using Prisma CLI tools (`validate`, `format`, `generate`).
   - Database compatibility is verified via `prisma migrate dev` (only after Task 03).
   - No unit or API tests are required for these tasks as they contain no executable logic.

2. **Logic & API Validation (Tasks 04-06):**
   - **Service TDD:** Unit tests for services will mock the repository to verify business logic.
   - **Repository TDD:** Unit tests for repositories will verify Prisma query generation.
   - **API/E2E:** Controller tests and E2E tests will verify HTTP behavior and DTO validation.
