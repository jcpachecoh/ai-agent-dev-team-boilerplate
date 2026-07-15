import { payrollFetch } from './payroll.client';
import type {
  LegalFormulaValidation,
  ValidateLegalFormulaInput,
} from '../types/final-settlement.types';

export function validateLegalFormula(
  input: ValidateLegalFormulaInput,
): Promise<LegalFormulaValidation> {
  return payrollFetch<LegalFormulaValidation>('/legal-formula-validations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listLegalFormulaValidations(): Promise<LegalFormulaValidation[]> {
  return payrollFetch<LegalFormulaValidation[]>('/legal-formula-validations');
}

export function getActiveLegalFormulaValidation(
  formulaVersion: number,
): Promise<LegalFormulaValidation | null> {
  return payrollFetch<LegalFormulaValidation | null>(
    `/legal-formula-validations/active/${formulaVersion}`,
  );
}
