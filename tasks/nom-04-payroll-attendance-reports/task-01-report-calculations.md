# Task 01 — Cálculos de Nómina y Asistencia (Core)

## Objetivo

Implementar el motor de cálculo mensual de nómina y asistencia como servicios puros
(`PayrollCalculationService`, `AttendanceReportService`). Sin endpoints REST, sin exports,
sin PDF/Excel. Solo cálculos con cobertura de tests unitarios.

---

## Contexto del análisis previo

### Qué existe que NOM-04 puede reutilizar

| Artefacto                                                                                        | Ubicación                                  | Relevancia                                 |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------ |
| `EmployeeDetails` (salaryAmount, salaryType, contractType, hasTransportSubsidy, isExemptFromTax) | `schema.prisma` l. 410-447                 | Fuente de todos los datos de nómina        |
| `AttendanceLog` (eventType, shift, timestamp, workDate)                                          | `schema.prisma` l. 983-1007                | Fuente de horas trabajadas                 |
| `AttendanceOvertimeType` enum (REGULAR, DIURNO, NOCTURNO, FESTIVO_DIURNO, FESTIVO_NOCTURNO)      | `schema.prisma`                            | Clasificación de recargos CST ya definida  |
| `SMLV_2025` + `TRANSPORT_SUBSIDY_THRESHOLD`                                                      | `payroll/payroll.constants.ts`             | Constantes de referencia legal 2025        |
| `REGULAR_DAY_MINUTES`, `MAX_WEEKLY_MINUTES`, `NOCTURNO_START_HOUR`                               | `attendance/attendance.constants.ts`       | Umbrales de jornada ya parametrizados      |
| `calculateDaySummary(logs, now)`                                                                 | `attendance/service/attendance.service.ts` | Cálculo de pares ENTRY/EXIT y overtime raw |
| `PayrollService` validaciones SMLV                                                               | `payroll/service/payroll.service.ts`       | Thresholds de salario mínimo ya validados  |

### Qué NO existe y debe crearse

- Ningún servicio de cálculo de nómina mensual (liquidación, deducciones, aportes).
- Recargos de overtime no se aplican monetariamente (solo se detectan como boolean).
- Porcentajes de descuentos (salud 4%, pensión 4%, ARL según nivel) no están implementados.
- Aportes patronales (salud 8.5%, pensión 12%, ARL, SENA, ICBF, caja) no existen.
- Auxilio de transporte 2025 no está como constante (solo threshold de 2 SMLV existe).
- Calendario de festivos colombianos: **no existe** (gap legal crítico, ver Riesgos).

### Constantes de aportes en Colombia (2025)

A implementar en `payroll.constants.ts`:

```
Descuentos empleado:
  salud:    4.0%
  pensión:  4.0%
  (fondo solidaridad: 1% sobre base > 4 SMLV — Gap Task 04)

Aportes patronales:
  salud:    8.5%
  pensión: 12.0%
  ARL:      según ArlRiskLevel (I=0.522%, II=1.044%, III=2.436%, IV=4.350%, V=6.960%)
  SENA:     2.0%  (exento si salario ≤ 10 SMLV — Ley 590/2000, verificar)
  ICBF:     3.0%  (exento si salario ≤ 10 SMLV — Ley 590/2000, verificar)
  caja:     4.0%

Salario integral:
  Base de aportes = 70% del salario integral
  No aplica auxilio transporte

Recargos CST (porcentajes a calcular si overtime está clasificado):
  DIURNO:          25%  (art. 168)
  NOCTURNO:        75%  (art. 168)
  FESTIVO_DIURNO:  75%  (art. 179)
  FESTIVO_NOCTURNO: 150% (art. 179)
```

---

## Scope

### Archivos a crear

```
apps/api/src/payroll/
  service/
    payroll-calculation.service.ts    ← motor principal
  interfaces/
    payroll-report.interfaces.ts      ← tipos de resultado
  test/
    payroll-calculation.service.spec.ts

apps/api/src/payroll/payroll.constants.ts   ← MODIFICAR: agregar constantes
apps/api/src/payroll/payroll.module.ts      ← MODIFICAR: declarar nuevo servicio
```

### Archivos prohibidos

- `schema.prisma` — sin cambios de schema
- `apps/api/prisma/migrations/` — sin nuevas migraciones
- `apps/web-app/` — sin frontend
- `package.json` / lockfiles

---

## Interfaces a definir (`payroll-report.interfaces.ts`)

```typescript
interface EmployeePayrollPeriod {
  employeeId: string;
  userId: string;
  tenantId: string;
  locationId: string;
  period: { year: number; month: number }; // 1-12
  contractType: EmployeeContractType;
  salaryType: SalaryType;
  salaryAmount: number; // COP
  workedDays: number; // días efectivos en el periodo
  calendarDays: number; // días del mes (28-31)

  // Devengos
  salaryBase: number; // prorrateado por días trabajados
  transportSubsidy: number; // 0 si no aplica o integral
  overtimePay: number; // suma de recargos monetarios
  overtimeBreakdown: OvertimeBreakdownItem[];

  // Deducciones empleado
  healthDeduction: number; // 4% base
  pensionDeduction: number; // 4% base
  totalDeductions: number;

  // Neto empleado
  netPay: number;

  // Aportes patronales (no descuentos del empleado, pero se reportan)
  employerHealthContribution: number; // 8.5%
  employerPensionContribution: number; // 12%
  employerArlContribution: number; // según nivel
  employerSenaContribution: number; // 2%
  employerIcbfContribution: number; // 3%
  employerCajaContribution: number; // 4%
  totalEmployerContributions: number;
}

interface OvertimeBreakdownItem {
  type: AttendanceOvertimeType;
  minutes: number;
  hourlyRate: number;
  amount: number;
}

interface AttendanceMonthSummary {
  employeeId: string;
  period: { year: number; month: number };
  presentDays: number;
  absentDays: number;
  totalWorkedMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  overtimeByType: Record<AttendanceOvertimeType, number>; // minutos por tipo
}

interface TenantPayrollSummary {
  tenantId: string;
  period: { year: number; month: number };
  employeeCount: number;
  totalNetPay: number;
  totalEmployerContributions: number;
  totalPayrollCost: number;
  byLocation: LocationPayrollSummary[];
}
```

---

## Métodos del servicio

### `PayrollCalculationService`

```typescript
// Liquidación de un empleado en un periodo
calculateEmployeePeriod(
  employee: EmployeeDetails,
  attendanceSummary: AttendanceMonthSummary,
  period: { year: number; month: number },
): EmployeePayrollPeriod

// Consolidado de todos los empleados del tenant en un periodo
calculateTenantPeriod(
  tenantId: string,
  period: { year: number; month: number },
  locationId?: string,
): Promise<TenantPayrollSummary>
```

### Reglas de cálculo en Task 01

- **Salario prorrateado:** `salaryAmount * (workedDays / calendarDays)`
  - `calendarDays` = días del mes
  - `workedDays` = días con al menos 1 par ENTRY/EXIT en el periodo
- **Subsidio de transporte:** Solo si `hasTransportSubsidy === true` y no es `INTEGRAL`
  - Constante `TRANSPORT_SUBSIDY_2025` = **162000 COP** (verificar decreto anual)
  - Prorrateado igual que salario
- **Base de aportes:** `salaryAmount` para ORDINARIO; `salaryAmount * 0.70` para INTEGRAL
- **Descuentos empleado:** `base * 0.04` para salud; `base * 0.04` para pensión
- **Aportes patronales:** Porcentajes fijos más ARL según `arlRiskLevel`
- **PRESTACION / APRENDIZAJE:** No hay aportes patronales regulares (documentar, no lanzar error)
- **Overtime:** Solo calcular si `overtimeSummary` tiene minutos > 0; sin festivos en Task 01

---

## Criterios de aceptación

- [ ] `PayrollCalculationService` calcula `netPay` correcto para un empleado ORDINARIO con 30 días trabajados
- [ ] Auxilio transporte se incluye solo cuando `hasTransportSubsidy === true`
- [ ] Salario integral usa base del 70% para aportes y no incluye auxilio transporte
- [ ] PRESTACION y APRENDIZAJE devuelven `totalEmployerContributions = 0` (documentado)
- [ ] `calculateTenantPeriod` agrupa por `locationId` y suma correctamente
- [ ] Todos los cálculos usan enteros (centavos) o `Decimal` para evitar errores de punto flotante
- [ ] Tests cubren: ORDINARIO, INTEGRAL, PRESTACION, días parciales, subsidio sí/no, ARL por nivel

---

## Validaciones a ejecutar

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm exec jest --testPathPattern="payroll-calculation" --no-coverage
```

---

## Riesgos y gaps

| Gap                                                    | Impacto                                              | Destino   |
| ------------------------------------------------------ | ---------------------------------------------------- | --------- |
| Festivos colombianos no existen                        | `overtimeByType.FESTIVO_*` siempre 0 en Task 01      | Task 04   |
| Retención en la fuente (RENTA)                         | `netPay` no descuenta RENTA; documentado             | Task 04   |
| Fondo de solidaridad pensional (>4 SMLV)               | No calculado                                         | Task 04   |
| SENA/ICBF exención para micro-empresas                 | Aplicado siempre sin verificar; documentar           | Task 04   |
| `workedDays` basado solo en attendance                 | Permisos, licencias, vacaciones no existen en schema | Follow-up |
| `TRANSPORT_SUBSIDY_2025` debe validarse contra decreto | Hardcodear con comentario de fuente                  | Task 04   |

---

## Notas de implementación

- No usar `number` para montos. Usar `Decimal` de `@prisma/client/runtime/library` o redondear a entero COP al final.
- El cálculo de recargos de overtime (`overtimePay`) depende de que `AttendanceService.calculateDaySummary` clasifique por tipo. En Task 01, si el tipo no se puede determinar (sin festivos), calcular solo extra DIURNO y dejar FESTIVO en 0.
- `PayrollCalculationService` no accede a Prisma directamente: recibe DTOs ya hidratados. La consulta a BD se hace en el repositorio que construirán los endpoints de Task 02.
