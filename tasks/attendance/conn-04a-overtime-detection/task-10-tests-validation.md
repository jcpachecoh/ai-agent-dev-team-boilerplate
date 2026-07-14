# CONN-04a Task 10 — Tests y validación final

**Domain:** `[BACKEND]` `[FRONTEND]` `[QA]`  
**Status:** `completed`  
**Depends on:** [Task 09](./task-09-frontend-approval-inbox.md)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Cerrar criterios de aceptación del epic con tests de integración, casos de umbral y validación de pipeline local.

---

## Scope

### Tests backend (obligatorios)

| Caso                                           | Esperado                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Salida 5 min tarde aislada                     | No solicitud                                                                    |
| Dos salidas 20 min tarde en mismo período      | No solicitud (40 min acumulados internos si se trackea; solicitud solo si > 30) |
| Acumulado exactamente 30 min                   | No solicitud                                                                    |
| Acumulado 31 min                               | `PENDIENTE_ADMIN`                                                               |
| Cascada completa 3 niveles                     | `APROBADA`                                                                      |
| Objeción en `PENDIENTE_ADMIN`                  | `OBJETADA`, no liquida                                                          |
| Objeción en `PENDIENTE_GERENCIA_OPERACIONES`   | `OBJETADA`, no liquida                                                          |
| Objeción en `PENDIENTE_GERENCIA_GENERAL`       | `OBJETADA`, no liquida                                                          |
| Liquidación NOM-07                             | Solo minutos `APROBADA` en `overtimePay`                                        |
| Tras objeción, nuevo EXIT tardío mismo período | No crea nueva solicitud automática (D1b)                                        |
| Multi-tenant                                   | Tenant A no ve solicitudes de tenant B                                          |
| Cierre nómina con pendientes                   | Advertencia visible; liquidación no bloqueada (D8)                              |

### Tests frontend (mínimo)

- Render bandeja vacía / con datos.
- Modal objeción valida comentario.
- Indicador en tarjeta para estado pendiente.

### Postman

- Carpeta `CONN-04a Overtime Detection` en `postman/restopsiq-api.collection.json`:
  - List inbox
  - Approve nivel 1 → 2 → 3
  - Object en cada nivel
  - Summary pendientes por período

### Checklist epic

Marcar criterios de aceptación del [epic](./00-epic-and-decisions.md) en PR description.

---

## Out of scope

- E2E app móvil CONN-01.
- Performance/load testing.
- CONN-04b.

---

## Files allowed

- `apps/api/src/overtime/test/**` — modify/create
- `apps/api/src/attendance/test/**` — modify
- `apps/api/src/reports/test/**` — modify
- `apps/web-app/src/features/attendance/**/test/**` — create
- `postman/restopsiq-api.collection.json` — modify

---

## Files forbidden

- `prisma/schema.prisma` (salvo fix bug crítico)
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Todos los casos de la tabla backend cubiertos.
- [ ] Cobertura services `overtime` ≥ 80%.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pasan en verde.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] Postman folder documentado.

---

## Validation commands

```bash
pnpm lint
pnpm typecheck
pnpm test --coverage
pnpm --filter=api test -- overtime
node scripts/validate-structure.js
```
