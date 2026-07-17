import {
  OS380_FIELD_TO_CONCEPT_CODE,
  type Os380PayrollConceptField,
  type PayrollConceptCode,
  getPayrollConceptDefinition,
} from '../payroll-concepts.constants';

/**
 * OS-612 Fase 4 — única matriz tipada campo OS-380 → concept code.
 *
 * No persiste líneas mensuales. No reescribe PayrollCalculationService.
 * Fuente de labels de exports regenerables (Excel/PDF) y cobertura estática del reporte.
 */
export const OS380_CONCEPT_FIELDS = Object.keys(
  OS380_FIELD_TO_CONCEPT_CODE,
) as Os380PayrollConceptField[];

export type Os380ConceptFieldCoverage = {
  field: Os380PayrollConceptField;
  conceptCode: PayrollConceptCode;
  displayName: string;
  lineNature: string;
};

/** Mapping canónico (15 campos). Alias tipado del const del registry. */
export function getOs380ConceptCode(field: Os380PayrollConceptField): PayrollConceptCode {
  return OS380_FIELD_TO_CONCEPT_CODE[field];
}

/** Label GLOBAL del registry (sin override tenant). */
export function getOs380ConceptDisplayName(field: Os380PayrollConceptField): string {
  const code = getOs380ConceptCode(field);
  const def = getPayrollConceptDefinition(code);
  if (!def) {
    throw new Error(`OS-612: concept code ${code} missing from registry for field ${field}`);
  }
  return def.displayName;
}

/** Cobertura estática completa campo → code → displayName GLOBAL. */
export function listOs380ConceptFieldCoverage(): readonly Os380ConceptFieldCoverage[] {
  return OS380_CONCEPT_FIELDS.map((field) => {
    const conceptCode = getOs380ConceptCode(field);
    const def = getPayrollConceptDefinition(conceptCode);
    if (!def) {
      throw new Error(`OS-612: missing registry entry for ${conceptCode}`);
    }
    return {
      field,
      conceptCode,
      displayName: def.displayName,
      lineNature: def.lineNature,
    };
  });
}

/**
 * Headers de columnas de nómina Excel/PDF que representan un campo OS-380 catalogado.
 * Totales agregados (Deducciones, Neto, Aportes Emp., Costo Total) no son conceptos.
 */
export const PAYROLL_EXPORT_CONCEPT_COLUMNS = {
  salaryBase: 'salaryBase',
  transportSubsidy: 'transportSubsidy',
  overtimePay: 'overtimePay',
} as const satisfies Record<string, Os380PayrollConceptField>;

export type PayrollExportConceptColumn = keyof typeof PAYROLL_EXPORT_CONCEPT_COLUMNS;

export function resolvePayrollExportConceptHeaders(
  overrides?: Partial<Record<PayrollExportConceptColumn, string>>,
): Record<PayrollExportConceptColumn, string> {
  return {
    salaryBase: overrides?.salaryBase ?? getOs380ConceptDisplayName('salaryBase'),
    transportSubsidy: overrides?.transportSubsidy ?? getOs380ConceptDisplayName('transportSubsidy'),
    overtimePay: overrides?.overtimePay ?? getOs380ConceptDisplayName('overtimePay'),
  };
}

export { OS380_FIELD_TO_CONCEPT_CODE };
export type { Os380PayrollConceptField, PayrollConceptCode };
