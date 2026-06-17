# Task: Supply Items Service & Controller Tests

## Goal

Establish a TDD foundation by creating failing unit tests for the Supply Items service and controller.

## Scope

- Create `apps/api/src/supply-items/test/supply-items.service.spec.ts`.
- Create `apps/api/src/supply-items/test/supply-items.controller.spec.ts`.
- Define mock interfaces for the repository.

## Requirements

- Tests must cover:
  - Successful creation (Happy Path).
  - Validation failures (e.g., duplicate `codigoInterno`).
  - Tenant isolation (ensuring queries always filter by `tenantId`).
  - Error handling (e.g., `NotFoundException`).
- Controller tests must verify that `tenantId` is NOT taken from the request body.

## Acceptance Criteria

- `npm run test` executes these tests and they fail as expected (since no implementation exists).
- Test suite follows the project's mocking patterns.

## Files Likely Affected

- `apps/api/src/supply-items/test/supply-items.service.spec.ts`
- `apps/api/src/supply-items/test/supply-items.controller.spec.ts`

## Out of Scope

- Implementing the actual service or repository logic.
- Integration tests with a live database.

## Validation Commands

```bash
cd apps/api
npm run test supply-items
```
