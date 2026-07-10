# NOM-14 Task 11 — Tests y validación final

**Domain:** `[BACKEND]` `[FRONTEND]` `[QA]`  
**Status:** `pending`  
**Depends on:** [Task 10](./task-10-frontend-novedades.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Cerrar criterios de aceptación del epic con tests de integración, casos legales y validación de pipeline local.

---

## Scope

### Tests backend (obligatorios)

| Caso                                                              | Esperado                             |
| ----------------------------------------------------------------- | ------------------------------------ |
| `PERMISO_REMUNERADO` empleado → supervisor aprueba → RRHH aprueba | Estados intermedios correctos        |
| `LICENCIA_MATERNIDAD` empleado                                    | Directo `PENDIENTE_RRHH`             |
| Supervisor requerido, sin supervisor resoluble                    | `PENDIENTE_RRHH` + warning, no error |
| Rechazo supervisor / RRHH                                         | `RECHAZADA` + motivo + notificación  |
| Soporte obligatorio sin adjunto                                   | 400                                  |
| Solapamiento sin ack                                              | 409; con ack → 201                   |
| Novedad cruza julio-agosto                                        | Liquidación prorratea ambos meses    |
| `AUSENCIA_INJUSTIFICADA` por empleado                             | 403                                  |
| Multi-tenant                                                      | Tenant A no ve novedades de tenant B |

### Tests frontend (mínimo)

- Render bandeja vacía / con datos.
- Modal rechazo valida motivo requerido.
- Hook mutations invalidan query keys.

### E2E / Supertest (si existe patrón en repo)

- Smoke: POST novedad → approve supervisor → approve RRHH.

### Postman

- Carpeta `NOM-14 Payroll Novedades` completa en `postman/restopsiq-api.collection.json`.

### Checklist epic

Marcar criterios de aceptación del [epic](./00-epic-and-decisions.md) en PR description.

---

## Out of scope

- Tests CONN-07 app empleado.
- Performance/load testing.

---

## Files allowed

- `apps/api/src/payroll-novedades/test/**` — modify/create
- `apps/api/test/**` — e2e si aplica
- `apps/web-app/src/features/payroll/**/test/**` — create
- `postman/restopsiq-api.collection.json` — modify

---

## Files forbidden

- `prisma/schema.prisma` (salvo fix bug crítico)
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Todos los casos de la tabla backend cubiertos.
- [ ] Cobertura service `payroll-novedades` ≥ 80%.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pasan en verde.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] Criterios de aceptación del epic verificados manualmente o en checklist PR.

---

## Validation commands

```bash
pnpm lint
pnpm typecheck
pnpm test --coverage
pnpm --filter=api test -- payroll-novedades --coverage
node scripts/validate-structure.js
```
