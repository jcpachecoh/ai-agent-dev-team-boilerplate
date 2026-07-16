# CONN-12 Task 08 — Tests de aceptación y validación

**Domain:** `[BACKEND]` `[TEST]` `[POSTMAN]`  
**Status:** `completed`  
**Depends on:** tasks 01–07  
**Epic:** [CONN-12](./00-epic-and-decisions.md)

---

## Goal

Cerrar el epic con tests de aceptación acordados en reunión y collection Postman mínima.

---

## Scope

### Tests obligatorios (AC)

1. **Turno same-day para rotante en otra sede**
   - Plan/asignación sede A; marcación sede B el mismo día → CONN-06 assignment en B.
2. **Malla sin aprobar no alimenta liquidación / corte**
   - Asignaciones en plan DRAFT/PENDING → `resolveForDay` no operativo; corte/liquidación no usan ese turno.

### Adicionales recomendados

- Transiciones de estado del plan (submit/approve/reject).
- Import Excel no auto-aprueba.
- Regresión marcación manual web (task-06).

### Postman

- Carpeta `CONN-12 Weekly Shift Plan Approval` con:
  - GET plan
  - submit / approve / reject
  - (opcional) import template ya existente OS-583
- Variables de collection si aplica.

### Seed (opcional)

- Plan draft + plan approved de demo para QA manual.

---

## Out of scope

- Nueva feature no cubierta en tasks 01–07.
- Bajar umbral de coverage global sin justificación.

---

## Files allowed

- `apps/api/src/**/test/**` de turnos, attendance, daily-cost-center
- `postman/restopsiq-api.collection.json`
- `apps/api/prisma/seed.ts` / seeds solo si se agrega demo CONN-12
- Epic + este archivo (marcar completed)

## Files forbidden

- Refactors ajenos
- `lint:fix` masivo

---

## Acceptance criteria

- [x] Tests AC del epic en verde.
- [x] Postman folder CONN-12 presente.
- [x] `pnpm --filter=api test:cov` no rompe umbral de branches (si se agrega código nuevo, cubrirlo).
- [x] Epic status → `completed` cuando todo lo anterior pase.

---

## Coverage map (AC)

| AC                           | Spec                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| Rotante sede A + marcación B | `daily-cost-center.service.spec` / `repository.spec` CONN-12    |
| Malla sin aprobar → no corte | `shift-resolution.service.spec` + `jornada-cutoff.service.spec` |
| Transiciones plan            | `weekly-shift-plan.service.spec` / `controller.spec`            |
| Import no auto-aprueba       | `turno-assignments-import.service.spec` CONN-12                 |
| Marcación manual web         | `attendance-card.service.spec` CONN-12 (task-06)                |

---

## Validation commands

```bash
pnpm --filter=api exec jest src/turnos/test src/daily-cost-center/test src/attendance/test/jornada-cutoff.service.spec.ts --silent
pnpm --filter=api exec tsc --noEmit
pnpm --filter=api run test:cov
node scripts/validate-structure.js
```

## Validation results (2026-07-16)

- Jest suites (turnos + daily-cost-center + jornada-cutoff): **23 passed / 232 tests**
- `tsc --noEmit`: **PASS**
- `validate-structure.js`: **PASS** (41 modules)
- `test:cov`: **PASS** — 307 suites / 3638 tests; umbral de branches OK
- Postman: folder `CONN-12 Weekly Shift Plan Approval` (GET / submit / approve / reject)
- Seed: `seed-weekly-plan-draft-conn12` + `seed-weekly-plan-approved-conn12`
