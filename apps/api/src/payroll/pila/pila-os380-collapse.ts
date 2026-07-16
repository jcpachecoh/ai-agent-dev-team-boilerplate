import type { PayrollEmployeeRowDto } from '../../reports/controller/dto/payroll-report-response.dto';

/**
 * Sentinel CONN-06 — fila de prorrateo sin sede asignada (reports.service).
 * No es un Location.id real; no se puede resolver DIVIPOLA.
 */
export const PILA_ROTANTE_PENDING_LOCATION_ID = '__PENDING_ASSIGNMENT__';

/** Campos monetarios que OS-380 reparte entre sedes al expandir ROTANTE. */
const SPLIT_MONEY_FIELDS = [
  'salaryBase',
  'transportSubsidy',
  'overtimePay',
  'grossPay',
  'healthDeduction',
  'pensionDeduction',
  'incomeTaxWithholding',
  'totalDeductions',
  'netPay',
  'employerHealthContribution',
  'employerPensionContribution',
  'employerArlContribution',
  'employerSenaContribution',
  'employerIcbfContribution',
  'employerCajaContribution',
  'totalEmployerContributions',
  'totalPayrollCost',
  'medicalLeaveEmployerPay',
  'medicalLeaveEpsArlPay',
] as const satisfies ReadonlyArray<keyof PayrollEmployeeRowDto>;

/**
 * OS-380 expande ROTANTE a 1 fila por sede. PILA necesita 1 cotizante por empleado
 * con montos totales y sede laboral = la de más días en el período.
 */
export function collapseOs380RowsForPila(rows: PayrollEmployeeRowDto[]): PayrollEmployeeRowDto[] {
  const byEmployee = new Map<string, PayrollEmployeeRowDto[]>();
  for (const row of rows) {
    const bucket = byEmployee.get(row.employeeId) ?? [];
    bucket.push(row);
    byEmployee.set(row.employeeId, bucket);
  }

  const collapsed: PayrollEmployeeRowDto[] = [];
  for (const group of byEmployee.values()) {
    if (group.length === 1) {
      collapsed.push(group[0]!);
      continue;
    }

    // Preferir sede real con más días; el bucket pendiente solo si no hay otra.
    const ranked = [...group].sort((a, b) => {
      const aPending = a.locationId === PILA_ROTANTE_PENDING_LOCATION_ID ? 1 : 0;
      const bPending = b.locationId === PILA_ROTANTE_PENDING_LOCATION_ID ? 1 : 0;
      if (aPending !== bPending) return aPending - bPending;
      return b.workedDays - a.workedDays;
    });
    const primary = ranked[0]!;

    const merged: PayrollEmployeeRowDto = {
      ...primary,
      workedDays: group.reduce((sum, r) => sum + r.workedDays, 0),
      // contributionBase viene completo en cada fila expandida — no sumar.
      contributionBase: primary.contributionBase,
    };

    for (const key of SPLIT_MONEY_FIELDS) {
      merged[key] = group.reduce((sum, r) => sum + Number(r[key]), 0) as never;
    }

    collapsed.push(merged);
  }

  return collapsed;
}
