# CONN-04b Task 08 — NOM-07: intersección y anti doble conteo

**Domain:** `[BACKEND]` `[PAYROLL]` `[REPORTS]`  
**Status:** `done`  
**Depends on:** [Task 03](./task-03-admin-create-service.md), cierre de pendientes P1–P3 del epic  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

Liquidar solo minutos de tiempo adicional **efectivamente marcados** que intersecten ventanas de solicitudes administrativas `APROBADA`, sin doble conteo respecto a `DETECCION_AUTOMATICA`.

---

## Scope

### Reglas definitivas (P1–P3 cerradas)

```
marked     = pares AttendanceLog markingScope=OVERTIME (CONN-11)
autoAuth   = marked  si DETECCION_AUTOMATICA.status = APROBADA  else ∅
adminAuth  = marked ∩ (unión de ventanas admin APROBADA)
liquidable = merge(autoAuth ∪ adminAuth)   // semiabierto [start, end); sin doble conteo
```

| Caso                                               | Comportamiento                                 |
| -------------------------------------------------- | ---------------------------------------------- |
| Admin `APROBADA` sin marcación OVERTIME en ventana | **0** (no se usa `proposedMinutes`)            |
| Marcación parcial                                  | solo intersección                              |
| Marcación fuera de ventana                         | 0 para esa solicitud                           |
| Auto + admin mismo período                         | unión temporal; minutos solapados una sola vez |
| Pendiente / objetada                               | 0 (repo solo carga admin `APROBADA`)           |
| Auto `APROBADA` sin pares OVERTIME                 | legacy CONN-04a (summary total−480)            |

### Implementación

- Motor puro: `overtime/utils/liquidable-overtime-intervals.util.ts`
- Decisión NOM-07: `overtime/utils/nom07-overtime-liquidation.util.ts`
- Bulk admin: `OvertimeRepository.findApprovedAdministrativeWindowsByEmployeeIdsForPeriod`
- Gate: `ReportsService.applyOvertimeApprovalGate` (rebuild `overtimeEntries` vía `classifyOvertimeSurcharge`)

### Trazabilidad interna

`fromAutomaticOnly` / `fromAdministrativeOnly` / `fromBoth` (no UI, no tablas nuevas).

---

## Out of scope

- Nueva tabla de recargos / UI / seeds / Postman.
- Cambiar motor legal OS-586 de tarifas (solo consumir minutos elegibles).
- Task-09 `pending-salary` heuristic.

---

## Files allowed

- `apps/api/src/overtime/repository/**`
- `apps/api/src/overtime/interfaces/**`
- `apps/api/src/overtime/utils/liquidable-overtime-intervals.util.ts`
- `apps/api/src/overtime/utils/nom07-overtime-liquidation.util.ts`
- `apps/api/src/overtime/test/**` (specs del motor + repo)
- `apps/api/src/reports/service/reports.service.ts`
- `apps/api/src/reports/test/**`
- Specs asociados

---

## Files forbidden

- Rediseño completo de OS-586.
- `apps/web-app/**`
- Seeds / Postman / tarjeta OS-551 / formulario admin.

---

## Acceptance criteria

- [x] Admin `APROBADA` sin marcación → 0 minutos.
- [x] Intersección parcial correcta.
- [x] Mismo intervalo no se liquida dos veces (auto+admin).
- [x] Detección automática sin admin sigue comportándose como CONN-04a.
- [x] Tests de regresión NOM-07/CONN-04a en verde.

---

## Riesgos residuales (Task-09+)

- Heurística incorrecta en `pending-salary` (admin ≠ 75% nocturno) — **Task-09**.
- Attribution `from*` no expuesta aún en UI/reporte.
- Legacy total−480 cuando auto APROBADA sin pares OVERTIME permanece hasta migración total a CONN-11.

---

## Validation commands

```bash
cd apps/api && pnpm exec jest src/reports/test/reports.service.spec.ts src/overtime/test --runInBand
cd apps/api && pnpm exec tsc --noEmit -p tsconfig.build.json
cd apps/api && pnpm run build
node scripts/validate-structure.js
```
