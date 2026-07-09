# NOM-13 Task 07 — Integración liquidación de nómina (NOM-13)

**Domain:** `[BACKEND]` `[PAYROLL]` `[REPORTS]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-medical-leave-service.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Integrar incapacidades médicas en la liquidación del período para no pagar salario ordinario completo en días cubiertos por EPS/ARL (epic PC-2, D3).

---

## Scope

### Análisis (documentar en PR)

Motor actual (igual que OS-589 task 10):

```
ReportsService.getPayrollReport(period)
  → PayrollCalculationService.calculateEmployeePeriod(...)
```

### Comportamiento

Para cada empleado y mes `period` (`YYYY-MM`):

1. Cargar incapacidades activas que intersectan el mes.
2. Por cada día del mes dentro del rango de incapacidad, aplicar split (reutilizar utils task 04).
3. Extender `EmployeePayrollInput` con:
   - `medicalLeaveEmployerDays` / `medicalLeaveEmployerPay`
   - `medicalLeaveEpsArlDays` / `medicalLeaveEpsArlPay` (informativo / no suma a gross ordinario)
   - `medicalLeaveOrdinaryDaysExcluded` — días sin salario base completo
4. En `calculateEmployeePeriod`:
   - Reducir `salaryBase` proporcional por días EPS/ARL del mes.
   - Sumar `medicalLeaveEmployerPay` según días 1–2 común pagados por empleador.

### Caso crítico: cruza dos períodos

Incapacidad `2026-07-28` → `2026-08-05`:

- Julio: 4 días (28–31) con split correspondiente.
- Agosto: 5 días (1–5) con split correspondiente.
- Test obligatorio en task 11.

### Archivos probables

- `apps/api/src/payroll/interfaces/payroll-report.interfaces.ts`
- `apps/api/src/payroll/service/payroll-calculation.service.ts`
- `apps/api/src/reports/service/reports.service.ts`
- `apps/api/src/medical-leaves/repository/medical-leaves.repository.ts` — query período

---

## Out of scope

- UI de liquidación.
- Reversión automática si incapacidad pasa a `RECHAZADA` (ver Q3 epic).

---

## Files allowed

- `apps/api/src/payroll/**` — modify
- `apps/api/src/reports/**` — modify
- `apps/api/src/medical-leaves/repository/**` — modify (queries período)
- Tests en `apps/api/src/reports/test/` y/o `apps/api/src/payroll/test/`

---

## Files forbidden

- `apps/web-app/**`
- `apps/api/src/app.module.ts` (salvo wire módulo si imprescindible — preferir import en ReportsModule)

---

## Acceptance criteria

- [ ] Período con incapacidad común refleja días 1–2 empleador y resto sin salario ordinario completo.
- [ ] Período con incapacidad laboral: 0 salario ordinario en días ARL.
- [ ] Test incapacidad que cruza dos meses.

---

## Validation commands

```bash
pnpm --filter api test reports.service
pnpm --filter api test payroll-calculation
```
