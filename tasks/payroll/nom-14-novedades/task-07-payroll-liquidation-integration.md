# NOM-14 Task 07 — Integración liquidación de nómina (OS-380)

**Domain:** `[BACKEND]` `[PAYROLL]` `[REPORTS]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-novedades-service.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Integrar novedades `APROBADA` en el motor de liquidación del período (OS-380 / `PayrollLiquidationService`) para aplicar descuentos y excluir días remunerados correctamente (epic PC-4).

---

## Scope

### Análisis (documentar en PR)

Motor actual (igual que NOM-13 task 07 / OS-589 task 10):

```
ReportsService.getPayrollReport(period)
  → PayrollCalculationService.calculateEmployeePeriod(...)
```

### Comportamiento

Para cada empleado y mes `period` (`YYYY-MM`):

1. Cargar novedades `APROBADA` que intersectan el mes (`findApprovedForPeriod`).
2. Por cada día del mes dentro del rango:
   - `AUSENCIA_INJUSTIFICADA` o `isPaid === false` → día descontable (`unpaidAbsenceDays`).
   - `isPaid === true` → día excluido de descuento ordinario (`paidLeaveDays`).
3. Extender `EmployeePayrollInput` con:
   - `payrollNovedadUnpaidDays` / `payrollNovedadUnpaidDeduction`
   - `payrollNovedadPaidDays` (informativo — no descuenta salario base)
4. En `calculateEmployeePeriod`:
   - Reducir `salaryBase` proporcional por días no pagados del mes.

### Caso crítico: cruza dos períodos

Novedad `2026-07-28` → `2026-08-05`:

- Julio: 4 días con reglas correspondientes.
- Agosto: 5 días.
- **Test obligatorio** en task 11.

### Archivos probables

- `apps/api/src/payroll/interfaces/payroll-report.interfaces.ts`
- `apps/api/src/payroll/service/payroll-calculation.service.ts`
- `apps/api/src/reports/service/reports.service.ts`
- `apps/api/src/payroll-novedades/repository/payroll-novedades.repository.ts`

---

## Out of scope

- UI de liquidación.
- Reversión automática si novedad pasa a `RECHAZADA` post-cierre período.

---

## Files allowed

- `apps/api/src/payroll/**` — modify
- `apps/api/src/reports/**` — modify
- `apps/api/src/payroll-novedades/repository/**` — modify
- Tests en `apps/api/src/reports/test/` y/o `apps/api/src/payroll/test/`

---

## Files forbidden

- `apps/web-app/**`
- `apps/api/src/app.module.ts` (salvo wire imprescindible)

---

## Acceptance criteria

- [ ] `AUSENCIA_INJUSTIFICADA` aprobada descuenta en liquidación del período.
- [ ] Licencia remunerada aprobada no descuenta salario ordinario.
- [ ] Test novedad que cruza dos meses.

---

## Validation commands

```bash
pnpm --filter api test reports.service
pnpm --filter api test payroll-calculation
```
