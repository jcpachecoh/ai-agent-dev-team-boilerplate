# MES-11 Task 08 — Tests & validation

## Goal

Cobertura y validación final del epic MES-11.

**Depends on:** Tasks 06, 07.

---

## Scope

- `operator-order-runtime.service.spec.ts` — flujo completo:
  - plan → start → pause → resume → complete-step (×N) → finish
  - errores 409 en transiciones inválidas
  - logs creados con eventos correctos
- `plant.controller.spec.ts` — rutas nuevas.
- `production-log.repository.spec.ts` (si no en task 03).
- Postman folder `MES-11 Operator Runtime` en `postman/restopsiq-api.collection.json`.
- Seed opcional: OP `PLANNED` lista para start en `plant-supervisor.seed.ts` (solo si task lo permite).

---

## Out of Scope

- E2E Playwright tablet.
- `lint:fix`.

---

## Files allowed

- `apps/api/src/mes/plant/test/**`
- `postman/restopsiq-api.collection.json`
- `apps/api/prisma/seeds/plant-supervisor.seed.ts` — opcional

---

## Files forbidden

- `package.json`
- `pnpm-lock.yaml`
- Cambios fuera de plant + postman

---

## Acceptance criteria

- [ ] Test flujo completo pasa (service).
- [ ] Branches coverage plant module no baja bajo 80%.
- [ ] Postman: 6 requests documentadas con variables `orderId`, `stepId`.
- [ ] Comandos epic en verde.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter api typecheck
pnpm --filter api test -- --testPathPattern="operator-runtime|production-log|plant.controller"
pnpm --filter api run test:cov
```
