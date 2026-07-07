# MES-11 Task 06 — Controller routes

## Goal

Exponer rutas HTTP del runtime operario en `PlantController`.

**Depends on:** Tasks 04, 05.

---

## Scope

- Rutas con `PlantAuthGuard` + `PlantRolesGuard` + `@Roles(OPERATOR, ...)` en mutaciones.
- Delegar a `OperatorOrderRuntimeService`.
- Swagger completo.

---

## Out of Scope

- Tests (task 08).
- Postman (task 08).

---

## Files allowed

- `apps/api/src/mes/plant/controller/plant.controller.ts` — extend
- `apps/api/src/mes/plant/test/plant.controller.spec.ts` — extend

---

## Files forbidden

- `apps/api/prisma/**`
- `apps/api/src/app.module.ts`
- `package.json`

---

## Routes (D2, D6)

| Method | Path                         | Roles           |
| ------ | ---------------------------- | --------------- |
| GET    | `orders/:id/recipe`          | MES autenticado |
| POST   | `orders/:id/start`           | OPERATOR+       |
| POST   | `orders/:id/operator/pause`  | OPERATOR+       |
| POST   | `orders/:id/operator/resume` | OPERATOR+       |
| POST   | `orders/:id/complete-step`   | OPERATOR+       |
| POST   | `orders/:id/finish`          | OPERATOR+       |

- Tenant solo desde JWT.
- Controller sin lógica de negocio.
- Soporte header `Idempotency-Key` en POST (pasar a service).

**No modificar** comportamiento de `POST orders/:id/pause` supervisor (MES-05).

---

## Acceptance criteria

- [ ] Seis rutas registradas sin conflicto con MES-05.
- [ ] Controller tests mock service.
- [ ] `pnpm --filter api typecheck` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter api test -- plant.controller
```
