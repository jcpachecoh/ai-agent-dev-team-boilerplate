# MES-10 Task 05 — Tests & Validation

## Goal

Cobertura unitaria del comité de producción: consecutivo, miembros, integración con órdenes.

**Depends on:** Tasks 01–04

---

## Scope

- Tests en `apps/api/src/mes/plant/test/`.
- Smoke manual opcional vía curl/Postman.
- Validación estructura + typecheck.

---

## Out of Scope

- E2E Playwright web.
- Cambios de producción en schema.

---

## Files allowed

- `apps/api/src/mes/plant/test/committee.service.spec.ts` — new
- `apps/api/src/mes/plant/test/plant.service.spec.ts` — extend (createOrder + committee)
- `apps/api/src/mes/plant/test/plant.controller.spec.ts` — extend (committee routes)

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/web-app/**`

---

## Test cases

### `CommitteeService`

| #   | Case                          | Expect                |
| --- | ----------------------------- | --------------------- |
| 1   | Primer comité tenant          | `number === 'OP0001'` |
| 2   | Segundo comité                | `number === 'OP0002'` |
| 3   | Miembro con rol SUPERVISOR    | `BadRequestException` |
| 4   | `memberUserIds` vacío         | `BadRequestException` |
| 5   | `closeCommittee` desde ACTIVE | `status === CLOSED`   |
| 6   | `closeCommittee` desde DRAFT  | error                 |

### `createOrder` + committee

| #   | Case                 | Expect                             |
| --- | -------------------- | ---------------------------------- |
| 7   | `committeeId` ACTIVE | OP.committeeId set; ordersCount +1 |
| 8   | `committeeId` CLOSED | 400                                |
| 9   | Sin `committeeId`    | ordersCount del comité sin cambio  |

### Controller (mock service)

| #   | Case                               | Expect |
| --- | ---------------------------------- | ------ |
| 10  | POST committees sin rol SUPERVISOR | 403    |
| 11  | GET committees/:id not found       | 404    |

---

## Acceptance criteria

- [ ] Todos los casos anteriores implementados.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=plant` verde.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
```
