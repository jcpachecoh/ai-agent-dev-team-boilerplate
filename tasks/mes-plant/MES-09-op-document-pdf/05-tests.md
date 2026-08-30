# MES-09 Task 05 — Tests & Validation

## Goal

Unit and integration tests for document model, route PATCH, material snapshot, and PDF endpoint.

**Depends on:** Tasks 01–04

---

## Scope

- Service tests: material aggregation on plan.
- Service tests: document PATCH status rules.
- Execution route PATCH tests.
- PDF service smoke: returns non-empty buffer, contains expected text (OP number, recipe name).
- Controller test: PDF route returns 200 + `application/pdf`.
- Run validation gates.

---

## Out of Scope

- Visual PDF pixel diff.
- E2E browser download (web-app task).

---

## Files allowed

- `apps/api/src/mes/plant/**/*.spec.ts`
- `apps/api/src/mes/plant/**/test/**`

---

## Test cases

### Material snapshot

- Recipe with 2 phases sharing one input → merged quantity = sum(phaseQty) × batchCount.
- Plan twice (if supported) → materials replaced idempotently.

### Document PATCH

- DRAFT: update lotNumber + quality check row.
- COMPLETED: reject or read-only per D11.
- Upsert quality: same checkType updates in place.

### Route PATCH

- Set operatorCount + deliveredQuantity on IN_PROCESS execution.
- Cross-tenant execution id → 404.

### PDF

- Mock order detail → buffer length > 1000.
- String contains `ORDEN DE PRODUCCIÓN`, order number, first material name.
- GET `/api/plant/orders/:id/pdf` auth: 401 without token, 403 wrong role.

---

## Validation commands

```bash
pnpm --filter api test -- --testPathPattern=plant
pnpm --filter api exec tsc --noEmit
node scripts/validate-structure.js
```

---

## Acceptance criteria

- [ ] All new tests pass.
- [ ] No regression in MES-05 order tests.
- [ ] Epic checklist in task 00 updated.
