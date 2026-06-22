# MES-11 Task 03 — Repository: production logs

## Goal

Capa de datos para `production_logs` (append-only).

**Depends on:** Tasks 01, 02.

---

## Scope

- `IProductionLogRepository` + implementación Prisma.
- Métodos: `append`, `findByOrder`, `findLastByOrder`, `findByIdempotencyKey`.
- Registrar en `plant.module.ts`.

---

## Out of Scope

- Reglas de negocio de transiciones.
- HTTP.

---

## Files allowed

- `apps/api/src/mes/plant/repository/production-log.repository.ts`
- `apps/api/src/mes/plant/interfaces/production-log.interfaces.ts`
- `apps/api/src/mes/plant/plant.module.ts` — provider only
- `apps/api/src/mes/plant/test/production-log.repository.spec.ts`

---

## Files forbidden

- `apps/api/prisma/schema.prisma` (salvo task 01 ya aplicada)
- `plant.controller.ts`
- `package.json`

---

## Implementation notes

- `append` nunca hace update/delete.
- Calcular `durationSeconds` en **service** (task 04), no en repository.
- Filtrar siempre `tenantId`.
- `findByIdempotencyKey` para D15 idempotencia.

---

## Acceptance criteria

- [ ] Repository no lanza HTTP exceptions.
- [ ] Tests con Prisma mock (AAA).
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter api test -- production-log.repository
```
