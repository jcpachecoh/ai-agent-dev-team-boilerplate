/** Re-export OS-612 registry — fuente canónica en `src/shared/payroll/payroll-concepts.registry`. */
export {
  GLOBAL_TENANT_SCOPE,
  toTenantScope,
  PAYROLL_CONCEPT_LINE_NATURES,
  PAYROLL_CONCEPT_DEFINITIONS,
  OS380_FIELD_TO_CONCEPT_CODE,
  isPayrollConceptCode,
  getPayrollConceptDefinition,
  listPayrollConceptCodes,
} from '../shared/payroll/payroll-concepts.registry';

export type {
  PayrollConceptLineNatureCode,
  PayrollConceptDefinition,
  PayrollConceptCode,
  Os380PayrollConceptField,
} from '../shared/payroll/payroll-concepts.registry';
