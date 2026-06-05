# Task: Backend — Tests, Postman, validation (BOX + stockActualBodega)

## Goal

Verify Task 01 behavior with automated tests and update backend API documentation artifacts (Postman + specs).

## Depends On

- `01-backend-stockunit-box-stockactual.md` implemented and migrated.

## Scope

### Unit / integration tests (apps/api)

| File                                                     | Cases to add/update                                                                 |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `supplyitems/test/supplyitems.repository.spec.ts`        | Create without `stockActualBodega` → DB 0; create with `"12.5"`; update patch       |
| `supplyitems/test/supplyitems.service.spec.ts`           | Reject `stockActualBodega: "-1"`; accept `BOX` on `unidadBase`                      |
| `supplyitems/test/supplyitems.controller.spec.ts`        | Response DTO includes `stockActualBodega`                                           |
| `supplyitems/test/supplyitems.resolver.spec.ts`          | GQL create input with `BOX` + stock field                                           |
| `supplyitems/mapper/test/supply-item.mapper.spec.ts`     | Maps `stockActualBodega` Decimal → number                                           |
| `inventory/test/inventory.service.spec.ts`               | Alert generated when `stockActualBodega` < `stockMinimoBodega`; no alert when above |
| `supplier-product/test/supplier-product.service.spec.ts` | Create/link with `unidadCompra: StockUnit.BOX` (smoke)                              |

### Postman

- `postman/restopsiq-api.collection.json`:
  - **Create Supply Item**: add optional `"stockActualBodega": "0"` in example body; second example or description for `"unidadBase": "BOX"`.
  - **Update Supply Item**: example patch `stockActualBodega`.
  - Test script (optional): assert response JSON has `stockActualBodega` number.
- `postman/README.md`:
  - Subsection under supply-items: `StockUnit` values include `BOX`; `stockActualBodega` manual until movements module.

### Specs (backend docs)

- `specs/supply-items-api.md`: fields `stockActualBodega`, enum `BOX`; note writable on create/update.
- `specs/suppliers-catalog.md`: `StockUnit` table + `BOX`.

## Out of Scope

- `apps/web-app/**`
- E2E Playwright
- New Postman environments files (unless variable docs only in README)
- MES plant recipe tests unless `BOX` breaks compile

## Files Allowed

- `apps/api/src/supplyitems/test/**`
- `apps/api/src/supplyitems/mapper/test/**`
- `apps/api/src/inventory/test/**`
- `apps/api/src/supplier-product/test/**`
- `postman/restopsiq-api.collection.json`
- `postman/README.md`
- `specs/supply-items-api.md`
- `specs/suppliers-catalog.md`

## Files Forbidden

- `apps/web-app/**`
- `apps/api/prisma/schema.prisma` (unless test DB drift — prefer no schema change in this task)
- Implementation files except test doubles/mocks inside test folders

## Acceptance Criteria

- [x] All tests in Scope table pass
- [x] `pnpm --filter api test` passes for touched suites
- [x] Postman Create/Update supply item examples use `{{categoryId}}`, `{{stockActualBodega}}`, BOX request (Empaque category seed id)
- [x] Specs reflect API contract for new field and enum value

## Validation Commands

```bash
cd apps/api
pnpm test supplyitems
pnpm test inventory.service.spec
pnpm test supplier-product.service.spec
```

Manual (document in PR notes):

```text
Postman → Supply Items → Create (unidadBase BOX, stockActualBodega 10) → Get by id
Postman → Inventory alerts (if exposed) — verify non-empty when stock below min
```

## Reporting (SDD)

After task completion report:

1. Files changed
2. Why each file belongs to this task
3. No unrelated files touched
4. Forbidden files not modified
5. Validation command results
6. Known deviations
