import { GLOBAL_TENANT_SCOPE, toTenantScope } from '../labor-legal/tenant-scope';

/** Re-export OS-585 scope helpers — misma estrategia GLOBAL / tenant (no inventar otra). */
export { GLOBAL_TENANT_SCOPE, toTenantScope };

/** Mirrors Prisma `PayrollConceptLineNature` (kept local so registry does not depend on generate). */
export const PAYROLL_CONCEPT_LINE_NATURES = [
  'DEVENGO',
  'DEDUCCION',
  'APORTE_PATRONAL',
  'INFORMATIVO',
] as const;

export type PayrollConceptLineNatureCode = (typeof PAYROLL_CONCEPT_LINE_NATURES)[number];

export type PayrollConceptDefinition = {
  readonly code: string;
  readonly displayName: string;
  readonly lineNature: PayrollConceptLineNatureCode;
};

/**
 * Registry cerrado OS-612 PR1 — fuente única del seed GLOBAL y del mapping OS-380.
 * Codes OS-591 se conservan tal cual (incl. PRIMA). Sin FSP / Ley 1607 / HE_*.
 */
export const PAYROLL_CONCEPT_DEFINITIONS = [
  // ── OS-591 liquidación definitiva ───────────────────────────────────────────
  {
    code: 'SAL_PENDIENTE',
    displayName: 'Salario pendiente',
    lineNature: 'DEVENGO',
  },
  {
    code: 'CESANTIAS',
    displayName: 'Cesantías (saldo pendiente)',
    lineNature: 'DEVENGO',
  },
  {
    code: 'INTERESES_CESANTIAS',
    displayName: 'Intereses sobre cesantías (saldo pendiente)',
    lineNature: 'DEVENGO',
  },
  {
    code: 'PRIMA',
    displayName: 'Prima de servicios (saldo pendiente)',
    lineNature: 'DEVENGO',
  },
  {
    code: 'VACACIONES',
    displayName: 'Vacaciones pendientes',
    lineNature: 'DEVENGO',
  },
  {
    code: 'INDEMNIZACION',
    displayName: 'Indemnización por terminación sin justa causa',
    lineNature: 'DEVENGO',
  },
  /**
   * Ajuste libre: el catálogo fija code + etiqueta base.
   * `SettlementLine.type` (DEVENGO|DEDUCCION) sigue discriminando el lado contable.
   */
  {
    code: 'AJUSTE_MANUAL',
    displayName: 'Ajuste manual',
    lineNature: 'DEVENGO',
  },

  // ── OS-380 campos tipados (mapping obligatorio) ─────────────────────────────
  {
    code: 'SALARIO_BASE',
    displayName: 'Salario base',
    lineNature: 'DEVENGO',
  },
  {
    code: 'AUXILIO_TRANSPORTE',
    displayName: 'Auxilio de transporte',
    lineNature: 'DEVENGO',
  },
  {
    code: 'HORAS_EXTRA',
    displayName: 'Horas extra',
    lineNature: 'DEVENGO',
  },
  {
    code: 'INCAPACIDAD_EMPLEADOR',
    displayName: 'Incapacidad — pago empleador',
    lineNature: 'DEVENGO',
  },
  {
    code: 'INCAPACIDAD_EPS_ARL',
    displayName: 'Incapacidad — EPS/ARL',
    lineNature: 'INFORMATIVO',
  },
  {
    code: 'DESCUENTO_NOVEDAD_NO_REMUNERADA',
    displayName: 'Descuento por novedad no remunerada',
    lineNature: 'DEDUCCION',
  },
  {
    code: 'APORTE_SALUD_EMPLEADO',
    displayName: 'Aporte salud empleado',
    lineNature: 'DEDUCCION',
  },
  {
    code: 'APORTE_PENSION_EMPLEADO',
    displayName: 'Aporte pensión empleado',
    lineNature: 'DEDUCCION',
  },
  {
    code: 'RETENCION_FUENTE',
    displayName: 'Retención en la fuente',
    lineNature: 'DEDUCCION',
  },
  {
    code: 'APORTE_SALUD_PATRONAL',
    displayName: 'Aporte salud patronal',
    lineNature: 'APORTE_PATRONAL',
  },
  {
    code: 'APORTE_PENSION_PATRONAL',
    displayName: 'Aporte pensión patronal',
    lineNature: 'APORTE_PATRONAL',
  },
  {
    code: 'APORTE_ARL_PATRONAL',
    displayName: 'Aporte ARL patronal',
    lineNature: 'APORTE_PATRONAL',
  },
  {
    code: 'APORTE_SENA',
    displayName: 'Aporte SENA',
    lineNature: 'APORTE_PATRONAL',
  },
  {
    code: 'APORTE_ICBF',
    displayName: 'Aporte ICBF',
    lineNature: 'APORTE_PATRONAL',
  },
  {
    code: 'APORTE_CCF',
    displayName: 'Aporte caja de compensación',
    lineNature: 'APORTE_PATRONAL',
  },
] as const satisfies readonly PayrollConceptDefinition[];

export type PayrollConceptCode = (typeof PAYROLL_CONCEPT_DEFINITIONS)[number]['code'];

/** Campos de `EmployeePayrollPeriod` → code canónico (OS-380). */
export const OS380_FIELD_TO_CONCEPT_CODE = {
  salaryBase: 'SALARIO_BASE',
  transportSubsidy: 'AUXILIO_TRANSPORTE',
  overtimePay: 'HORAS_EXTRA',
  medicalLeaveEmployerPay: 'INCAPACIDAD_EMPLEADOR',
  medicalLeaveEpsArlPay: 'INCAPACIDAD_EPS_ARL',
  payrollNovedadUnpaidDeduction: 'DESCUENTO_NOVEDAD_NO_REMUNERADA',
  healthDeduction: 'APORTE_SALUD_EMPLEADO',
  pensionDeduction: 'APORTE_PENSION_EMPLEADO',
  incomeTaxWithholding: 'RETENCION_FUENTE',
  employerHealthContribution: 'APORTE_SALUD_PATRONAL',
  employerPensionContribution: 'APORTE_PENSION_PATRONAL',
  employerArlContribution: 'APORTE_ARL_PATRONAL',
  employerSenaContribution: 'APORTE_SENA',
  employerIcbfContribution: 'APORTE_ICBF',
  employerCajaContribution: 'APORTE_CCF',
} as const satisfies Record<string, PayrollConceptCode>;

export type Os380PayrollConceptField = keyof typeof OS380_FIELD_TO_CONCEPT_CODE;

const CONCEPT_BY_CODE = new Map<string, PayrollConceptDefinition>(
  PAYROLL_CONCEPT_DEFINITIONS.map((def): [string, PayrollConceptDefinition] => [def.code, def]),
);

export function isPayrollConceptCode(value: string): value is PayrollConceptCode {
  return CONCEPT_BY_CODE.has(value);
}

export function getPayrollConceptDefinition(code: string): PayrollConceptDefinition | undefined {
  return CONCEPT_BY_CODE.get(code);
}

/** Unique codes from the closed registry (order = registry order). */
export function listPayrollConceptCodes(): readonly PayrollConceptCode[] {
  return PAYROLL_CONCEPT_DEFINITIONS.map((d): PayrollConceptCode => d.code);
}
