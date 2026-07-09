# NOM-13 Task 11 — Tests y validación final

**Domain:** `[BACKEND]` `[FRONTEND]`  
**Status:** `pending`  
**Depends on:** Tasks 01–10  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Cerrar criterios de aceptación del epic con tests de integración y checklist de validación.

---

## Scope

### Tests backend obligatorios

| Caso                           | Archivo sugerido                                                  |
| ------------------------------ | ----------------------------------------------------------------- |
| Split común 5 días             | `medical-leave-payment.utils.spec.ts`                             |
| Split laboral 10 días          | idem                                                              |
| Registro + estados             | `medical-leaves.service.spec.ts`                                  |
| Incapacidad cruza julio–agosto | `reports.service.spec.ts` o `payroll-calculation.service.spec.ts` |
| Acumulado 180 días             | `medical-leaves.service.spec.ts`                                  |
| Controller auth tenant         | `medical-leaves.controller.spec.ts`                               |

### Tests frontend (mínimo)

- Form modal valida fechas.
- Muestra alerta 180 días cuando API lo indica.

### Postman (obligatorio)

- Carpeta `NOM-13 Medical Leaves` en `postman/restopsiq-api.collection.json`

### Checklist epic

Marcar en PR los ítems de **Criterios de aceptación** del `00-epic-and-decisions.md`.

---

## Out of scope

- E2E Playwright (fase posterior).
- Performance/load tests.

---

## Files allowed

- `apps/api/src/medical-leaves/test/**`
- `apps/api/src/reports/test/**`
- `apps/api/src/payroll/test/**`
- `apps/web-app/src/features/payroll/**/*.test.ts`
- `postman/**`

---

## Files forbidden

- Cambios de funcionalidad no cubiertos por fixes de tests.

---

## Acceptance criteria

- [ ] `pnpm --filter api test medical-leaves` en verde.
- [ ] Cobertura service medical-leaves > 80%.
- [ ] `pnpm lint` y `pnpm typecheck` en verde.
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter api test medical-leaves --coverage
pnpm --filter web-app test
pnpm lint
pnpm typecheck
```
