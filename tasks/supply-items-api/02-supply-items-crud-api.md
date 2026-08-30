# Task: Supply Items CRUD API

## Goal

Implement the CRUD API for Supply Items following the NestJS layered architecture.

## Scope

- Create `supply-items.module.ts`, `interfaces/`, `repository/`, `service/`, and `controller/`.
- Implement DTOs with `class-validator`.

## Requirements

- **Repository**:
  - Implements `ISupplyItemsRepository`.
  - All methods must be tenant-scoped.
  - No HTTP exceptions.
- **Service**:
  - Implements `ISupplyItemsService`.
  - Validates `codigoInterno` uniqueness per tenant.
  - Validates `categoriaId` belongs to the same tenant.
  - Throws appropriate `ConflictException` or `NotFoundException`.
- **Controller**:
  - Exposes standard CRUD endpoints.
  - Extracts `tenantId` from context.

## Acceptance Criteria

- All tests from Task 01 pass.
- `npx prisma validate` confirms schema compatibility.
- API documentation (Swagger) reflects the new endpoints.

## Files Likely Affected

- `apps/api/src/supply-items/` (New files)
- `apps/api/src/app.module.ts` (Registration)

## Out of Scope

- CPP calculation logic.
- Suppliers specialized endpoint.

## Validation Commands

```bash
cd apps/api
npm run test supply-items
npm run lint
```
