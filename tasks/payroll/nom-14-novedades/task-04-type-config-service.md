# NOM-14 Task 04 — NovedadTypeConfigService

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 03](./task-03-repository.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Implementar servicio de configuración por tenant para tipos de novedad: lectura, actualización y garantía de defaults al primer acceso.

---

## Scope

### Archivos

- `apps/api/src/payroll-novedades/service/novedad-type-config.service.ts`
- `apps/api/src/payroll-novedades/test/novedad-type-config.service.spec.ts`

### Métodos

#### `getConfigForTenant(tenantId, type)`

- Retorna config del tipo; si no existe → `ensureDefaults(tenantId)` y reintenta.

#### `listConfigs(tenantId)`

- Lista los 8 tipos con flags actuales.

#### `updateConfig(tenantId, type, input)`

- Solo rol `NOMINA` (validar en controller task 09; service puede asumir caller autorizado).
- Campos editables: `requiresSupervisorApproval`, `requiresSupportDocument`, `isPaidDefault`, `autoSolicitable` (task 12).
- **No** permitir crear tipos fuera del enum.

#### `ensureDefaults(tenantId)` (privado o público para seed)

Idempotente — defaults MVP:

| Tipo                   | requiresSupervisorApproval | requiresSupportDocument | autoSolicitable | isPaidDefault                  |
| ---------------------- | -------------------------- | ----------------------- | --------------- | ------------------------------ |
| PERMISO_REMUNERADO     | true                       | false                   | true            | true                           |
| LICENCIA_NO_REMUNERADA | true                       | false                   | true            | false                          |
| LICENCIA_LUTO          | false                      | true                    | true            | **true** (remunerada Ley 1280) |
| LICENCIA_PATERNIDAD    | false                      | true                    | true            | true                           |
| LICENCIA_MATERNIDAD    | false                      | true                    | true            | true                           |
| CALAMIDAD_DOMESTICA    | false                      | true                    | **false**       | true                           |
| DIA_FAMILIA            | false                      | true                    | true            | true                           |
| AUSENCIA_INJUSTIFICADA | false                      | false                   | false           | false                          |

---

## Out of scope

- UI de edición (task 10).
- Endpoints HTTP (task 09).

---

## Files allowed

- `apps/api/src/payroll-novedades/service/novedad-type-config.service.ts` — create
- `apps/api/src/payroll-novedades/test/novedad-type-config.service.spec.ts` — create
- `apps/api/src/payroll-novedades/payroll-novedades.module.ts` — modify

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Defaults seeded on-demand si faltan filas.
- [ ] Update no permite tipos desconocidos.
- [ ] Tests con repository mockeado.

---

## Validation commands

```bash
pnpm --filter=api test -- novedad-type-config.service.spec
node scripts/validate-structure.js
```
