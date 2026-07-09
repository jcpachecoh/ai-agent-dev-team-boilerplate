# OS-589 Task 10 — Integración compensación en liquidación de nómina

**Domain:** `[BACKEND]` `[PAYROLL]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-request-approval-service.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Reflejar las solicitudes de vacaciones tipo **COMPENSACION** aprobadas en la **siguiente liquidación de nómina** del empleado (D8).

---

## Scope

### Análisis previo (documentar en PR)

**Motor de liquidación en RestOpsIQ hoy** = cálculo al vuelo del reporte de nómina, no un proceso batch persistido:

```
ReportsService.getPayrollReport(period)
  → findActiveEmployees + attendance logs del mes
  → PayrollCalculationService.calculateEmployeePeriod(employee, attendance)
  → grossPay = salaryBase + transportSubsidy + overtimePay
```

Archivos:

| Archivo                                                        | Rol                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| `apps/api/src/reports/service/reports.service.ts`              | Orquesta empleados + asistencia + cálculo por periodo |
| `apps/api/src/payroll/service/payroll-calculation.service.ts`  | Fórmulas de devengos/deducciones (función pura)       |
| `apps/api/src/payroll/interfaces/payroll-report.interfaces.ts` | Tipos `EmployeePayrollInput`, `EmployeePayrollPeriod` |

**No hay** tabla `PayrollRun` ni conceptos de nómina persistidos todavía.

### Comportamiento esperado

Cuando una solicitud `COMPENSACION` pasa a `APROBADA`:

1. Persistir monto pendiente (días × valor día; MVP: `salaryAmount / 30` por día) con `targetPeriod` = mes siguiente a la aprobación.
2. En `getPayrollReport`, antes de `calculateEmployeePeriod`, cargar compensaciones pendientes del periodo para cada empleado.
3. Pasar `vacationCompensationPay` en `EmployeePayrollInput` (extender interface).
4. En `calculateEmployeePeriod`, sumar al `grossPay`: `grossPay = salaryBase + transportSubsidy + overtimePay + vacationCompensationPay`.
5. Marcar compensación como liquidada al incluirla en el reporte (evitar doble pago).

### Archivos a modificar

- `apps/api/src/payroll/interfaces/payroll-report.interfaces.ts` — `vacationCompensationPay?` en input/output
- `apps/api/src/payroll/service/payroll-calculation.service.ts` — sumar al `grossPay`
- `apps/api/src/reports/service/reports.service.ts` — cargar pendientes y pasar al cálculo
- `apps/api/src/vacations/service/vacations.service.ts` — crear pendiente al aprobar COMPENSACION
- Tests en `apps/api/src/reports/test/` y/o `apps/api/src/payroll/test/`

### Alternativa si se requiere persistencia explícita

- Agregar modelo `VacationCompensationPending` en migración separada (campos: `tenantId`, `employeeId`, `requestId`, `amount`, `targetPeriod`, `settledAt`).
- Esta task puede requerir extensión de **task 01** si se elige esta vía.

---

## Out of scope

- Cálculo de vacaciones DISFRUTE en nómina (solo compensación en dinero).
- Generación de carta (task 06).
- UI de liquidación (solo backend).
- Cambios retroactivos a liquidaciones ya cerradas.

---

## Nota de implementación

Q3 resuelta: integración en `getPayrollReport` + `calculateEmployeePeriod`. Si se necesita tabla `VacationCompensationPending`, coordinar extensión de **task 01** antes de implementar.

---

## Files allowed

- `apps/api/src/payroll/service/**` — modify
- `apps/api/src/payroll/interfaces/**` — modify
- `apps/api/src/payroll/test/**` — modify/create
- `apps/api/src/vacations/service/vacations.service.ts` — modify (trigger compensación)

---

## Files forbidden

- `prisma/schema.prisma` (salvo escalación explícita para tabla pending)
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/web-app/**`
- `packages/**`

---

## Acceptance criteria

- [ ] COMPENSACION aprobada genera ítem pendiente en payroll.
- [ ] Ítem aparece en la **siguiente** liquidación del empleado (test con periodo mockeado).
- [ ] No se paga dos veces la misma compensación.
- [ ] DISFRUTE aprobado no genera ítem de compensación.
- [ ] Tests unitarios del hook de liquidación pasan.

---

## Validation commands

```bash
pnpm --filter=api test -- payroll
pnpm --filter=api test -- vacations.service.spec
```
