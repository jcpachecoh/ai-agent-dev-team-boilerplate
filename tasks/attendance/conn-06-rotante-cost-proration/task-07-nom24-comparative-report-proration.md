# CONN-06 Task 07 — NOM-24 prorrateo rotante en informe comparativo

**Domain:** `[BACKEND]` `[REPORTS]` `[PAYROLL]`  
**Status:** `completed`  
**Depends on:** [Task 03](./task-03-repository.md), [Task 04](./task-04-assignment-resolution-service.md)  
**Epic:** [CONN-06](./00-epic-and-decisions.md)

---

## Goal

Integrar prorrateo de costo laboral por sede real en `PayrollComparativeReportService` (NOM-24) para empleados con `costCenter = ROTANTE`, calculado al generar el informe — no en liquidación.

---

## Scope

### `RotanteProrationService`

Implementar `IRotanteProrationService` (task 02):

```
días_totales = COUNT(asignaciones en período)
por cada locationId:
  proporción = días_en_sede / días_totales
  costo_prorrateado = costo_total_empleado × proporción
```

- Usar `Decimal` para montos (convención payroll existente).
- Redondeo: alinear con reglas NOM-24 / informes existentes (documentar si último sede absorbe centavos).

### Integración NOM-24

- Localizar o crear `PayrollComparativeReportService` en `apps/api/src/reports/` (o módulo payroll reports).
- Para empleados **no rotantes**: mantener atribución a `locationId` fijo (sin cambio).
- Para empleados **rotantes**:
  - Obtener `costo_total` del empleado en el período (misma fuente que el informe usa hoy).
  - Llamar `RotanteProrationService`.
  - Distribuir líneas del informe por sede según `allocations`.
  - Si `pendingDaysCount > 0`: incluir fila/bucket **"Pendiente asignación"** con costo no prorrateado o advertencia en metadata del reporte (D5).

### API informe

- Response NOM-24 debe exponer desglose prorrateado por `locationId` para rotantes.
- Campo opcional `prorationMeta`: `{ totalDaysAssigned, pendingDaysCount, sources }` para UI.

### Reutilización NOM-18

- Exportar `RotanteProrationService` desde `DailyCostCenterModule` para consumo futuro contable — **sin** implementar asientos contables.

---

## Out of scope

- UI del informe NOM-24 completa (si NOM-24 FE es epic separado, solo contrato API + tests).
- Liquidación nómina NOM-07.
- Integración contable NOM-18.

---

## Files allowed

- `apps/api/src/daily-cost-center/service/rotante-proration.service.ts`
- `apps/api/src/daily-cost-center/test/rotante-proration.service.spec.ts`
- `apps/api/src/reports/**` (PayrollComparativeReportService o equivalente)
- `apps/api/src/reports/test/**`
- `apps/api/src/daily-cost-center/daily-cost-center.module.ts` (export service)

---

## Files forbidden

- `schema.prisma`
- Liquidación payroll calculation core (salvo punto de lectura de costo total)
- `apps/web-app/**` (salvo types compartidos si NOM-24 FE en mismo task — preferir epic NOM-24 separado)

---

## Acceptance criteria

- [x] Empleado rotante con 10 días en sede A y 5 en sede B: costo split 66.67% / 33.33% (tolerancia redondeo).
- [x] Empleado rotante sin asignaciones en período: advertencia/pending; no atribuir a sede falsa.
- [x] Empleado no rotante: informe idéntico al comportamiento pre-CONN-06.
- [x] Prorrateo ocurre en generación de informe, no muta liquidación.
- [x] Tests: 2 sedes proporciones distintas; 0 asignaciones; 1 sede 100%.

---

## Validation commands

```bash
pnpm --filter=api test -- rotante-proration
pnpm --filter=api test -- comparative-report
pnpm --filter=api typecheck
node scripts/validate-structure.js
```
