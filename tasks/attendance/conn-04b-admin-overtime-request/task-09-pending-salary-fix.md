# CONN-04b Task 09 — Fix pending-salary / variable-average: admin ≠ recargo nocturno

**Domain:** `[BACKEND]` `[PAYROLL]`  
**Status:** `done`  
**Depends on:** [Task 08](./task-08-payroll-liquidation.md) (motor NOM-07 de intervalos)  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

Eliminar la heurística incorrecta que trata `SOLICITUD_ADMINISTRATIVA` como recargo nocturno 75% en salario pendiente y asegurar que el promedio variable no infiera tarifa por `type`.

---

## Causa raíz

```ts
// pending-salary.service.ts (antes)
ot.type === 'SOLICITUD_ADMINISTRATIVA' ? EXTRA_NOCTURNA_RATE : EXTRA_DIURNA_RATE;
```

`OvertimeRequest.type` es el **origen** de la autorización (detección vs admin), no la clasificación legal del recargo.

---

## Fuente de verdad final

| Concepto            | Fuente                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| Minutos liquidables | NOM-07 Task-08 (`decideNom07OvertimeLiquidation` / intervalos)                        |
| Tarifa / tipo legal | `classifyOvertimeSurcharge` + parámetros legales vigentes + horario Bogotá + festivos |
| No usar             | `type`, `proposedMinutes`, motivo catálogo, pendiente/objetada                        |

Util compartido: `payroll/utils/approved-overtime-money.util.ts`.

---

## Consumidores corregidos

1. **PendingSalaryService** — valoriza solo minutos liquidables; admin sin marcación → 0.
2. **VariableAverageService** — misma valorización; ya no depende de metadata de detección sola para excluir admin con marcación real.

Seed demo `APROBADA` admin (Task-05): **conservado**; sin marcación → 0 pendiente / 0 variable (no 75%).

---

## Out of scope

- Rediseño general de recargos OS-586.
- Frontend / Postman / migración / permisos.
- Task-10.

---

## Files allowed

- `apps/api/src/payroll/service/pending-salary.service.ts`
- `apps/api/src/payroll/service/variable-average.service.ts`
- `apps/api/src/payroll/utils/approved-overtime-money.util.ts`
- `apps/api/src/payroll/test/pending-salary.service.spec.ts`
- `apps/api/src/payroll/test/variable-average.service.spec.ts`
- `apps/api/src/payroll/test/approved-overtime-money.util.spec.ts`
- Comentario en seed demo (sin cambiar datos) si hace falta
- SDD Task-09 / epic / OS-606

---

## Files forbidden

- Nuevos modelos Prisma de tarifas.
- `apps/web-app/**`
- Endpoints / permisos / Postman / migración.
- Motor temporal Task-08 (solo consumo).

---

## Acceptance criteria

- [x] `type === SOLICITUD_ADMINISTRATIVA` no implica `EXTRA_NOCTURNA_RATE`.
- [x] Admin sin marcación → 0 en pending salary y variable average.
- [x] Clasificación diurna/nocturna por horario legal.
- [x] Auto + admin sin doble conteo (vía Task-08).
- [x] Tests de regresión pending / variable average.

---

## Limitaciones residuales (Task-10)

- Aún no hay tabla de HE liquidadas/pagadas; se revaloriza desde solicitudes + marcaciones.
- Riesgo de doble pago de salario base (sin nóminas cerradas) permanece documentado.
- Smoke E2E / Postman → Task-10.

---

## Validation commands

```bash
cd apps/api && pnpm exec jest \
  src/payroll/test/pending-salary.service.spec.ts \
  src/payroll/test/variable-average.service.spec.ts \
  src/payroll/test/approved-overtime-money.util.spec.ts \
  --runInBand
```
