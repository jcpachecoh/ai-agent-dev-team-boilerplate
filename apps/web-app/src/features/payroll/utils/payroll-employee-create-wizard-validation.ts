import type {
  PayrollEmployeeCreateBankDraft,
  PayrollEmployeeCreateTaxDraft,
} from '../types/payroll-employee-create-wizard.types';
import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { validateAccountNumberForBank } from './bank-account-validation';
import { validateBeneficiaryForm } from './beneficiary';
import { parseWithholdingRatePercent } from './financial-profile-display';

const REQUIRED_CATALOG_FIELDS: Array<{
  key: keyof Pick<
    PayrollEmployeeFormValues,
    | 'department'
    | 'epsName'
    | 'pensionFundName'
    | 'cesantiasFundName'
    | 'arlName'
    | 'cajaCompensacion'
  >;
  label: string;
}> = [
  { key: 'department', label: 'Departamento' },
  { key: 'epsName', label: 'EPS' },
  { key: 'pensionFundName', label: 'Fondo de pensión' },
  { key: 'cesantiasFundName', label: 'Fondo de cesantías' },
  { key: 'arlName', label: 'ARL' },
  { key: 'cajaCompensacion', label: 'Caja de compensación' },
];

export function validatePayrollEmployeePersonalStep(
  values: PayrollEmployeeFormValues,
  options: {
    hasActivePositions: boolean;
    selectedPositionArea?: string;
  },
): string | null {
  if (
    !values.nombres.trim() ||
    !values.primerApellido.trim() ||
    !values.email.trim() ||
    !values.cedula.trim()
  ) {
    return 'Nombres, primer apellido, correo y cédula son obligatorios.';
  }

  if (!values.costCenter) {
    return 'Centro de Costos es obligatorio.';
  }

  // Rotante no tiene sede fija — la sede diaria se resuelve por turno/marcación (CONN-06).
  if (values.costCenter !== 'ROTANTE' && !values.locationId.trim()) {
    return 'El área (sede) es obligatoria.';
  }

  if (!values.laborClassification) {
    return 'Clasificación mano de obra es obligatoria.';
  }

  if (options.hasActivePositions && !values.positionId.trim()) {
    return 'Cargo es obligatorio.';
  }

  if (options.hasActivePositions && !options.selectedPositionArea?.trim()) {
    return 'El cargo seleccionado no tiene área configurada.';
  }

  const salary = Number(values.salaryAmount);
  if (!Number.isFinite(salary) || salary <= 0) {
    return 'El salario debe ser un número mayor que 0.';
  }

  if (values.nonSalaryAmount !== '') {
    const nonSalary = Number(values.nonSalaryAmount);
    if (!Number.isFinite(nonSalary) || nonSalary < 0) {
      return 'El valor no salarial debe ser un número positivo.';
    }
  }

  if (!values.department.trim()) {
    return 'Departamento es obligatorio.';
  }

  for (let index = 0; index < values.beneficiaries.length; index += 1) {
    const beneficiaryErrors = validateBeneficiaryForm(values.beneficiaries[index]);
    const firstError = Object.values(beneficiaryErrors)[0];
    if (firstError) {
      return `Beneficiario ${index + 1}: ${firstError}`;
    }
  }

  return null;
}

export function validatePayrollEmployeeSocialStep(
  values: PayrollEmployeeFormValues,
): string | null {
  const missingCatalogField = REQUIRED_CATALOG_FIELDS.find(
    (field) => field.key !== 'department' && !values[field.key].trim(),
  );
  if (missingCatalogField) {
    return `${missingCatalogField.label} es obligatorio.`;
  }
  return null;
}

export function validatePayrollEmployeeBankStep(draft: PayrollEmployeeCreateBankDraft): {
  message: string | null;
  fieldErrors: Partial<Record<keyof PayrollEmployeeCreateBankDraft, string>>;
} {
  if (!draft.bankCode.trim() && !draft.accountNumber.trim()) {
    return { message: null, fieldErrors: {} };
  }

  const fieldErrors: Partial<Record<keyof PayrollEmployeeCreateBankDraft, string>> = {};

  if (!draft.bankCode.trim()) {
    fieldErrors.bankCode = 'Selecciona un banco para registrar la cuenta.';
    return {
      message: fieldErrors.bankCode,
      fieldErrors,
    };
  }

  // Editing an existing account without changing the masked number — keep the current value.
  if (draft.bankAccountId && !draft.accountNumber.trim()) {
    return { message: null, fieldErrors: {} };
  }

  const accountError = validateAccountNumberForBank(draft.bankCode, draft.accountNumber);
  if (accountError) {
    fieldErrors.accountNumber = accountError;
    return { message: accountError, fieldErrors };
  }

  return { message: null, fieldErrors: {} };
}

/**
 * Decides what (if anything) should be sent to the backend for the bank step.
 * Returns undefined when there is nothing to persist, which is how the wizard
 * avoids creating a duplicate account when the user never touched the step.
 */
export function resolveBankDraftPayload(
  draft: PayrollEmployeeCreateBankDraft,
  initialDraft: PayrollEmployeeCreateBankDraft | null,
): PayrollEmployeeCreateBankDraft | undefined {
  const accountNumberDigits = draft.accountNumber.replace(/\D/g, '');

  if (draft.bankAccountId) {
    const changed =
      draft.bankCode !== (initialDraft?.bankCode ?? '') ||
      draft.accountType !== (initialDraft?.accountType ?? draft.accountType) ||
      accountNumberDigits.length > 0;

    if (!changed) return undefined;
    return { ...draft, accountNumber: accountNumberDigits };
  }

  if (!draft.bankCode.trim() || !accountNumberDigits) return undefined;
  return { ...draft, accountNumber: accountNumberDigits };
}

export function validatePayrollEmployeeTaxStep(
  draft: PayrollEmployeeCreateTaxDraft,
): string | null {
  if (!draft.taxId.trim()) {
    return null;
  }

  if (!/^\d{6,15}$/.test(draft.taxId.trim())) {
    return 'El NIT/RUT debe contener solo dígitos (6-15 caracteres).';
  }

  if (draft.withholdingApplicable) {
    const rate = parseWithholdingRatePercent(draft.withholdingRatePercent);
    if (rate == null) {
      return 'Ingresa un porcentaje de retención entre 0 y 100.';
    }
  }

  return null;
}

export function resolveEmployeeAreaForSubmit(
  values: PayrollEmployeeFormValues,
  positions: Array<{ id: string; area: string }> | undefined,
  hasActivePositions: boolean,
): string {
  if (!hasActivePositions) {
    return values.area;
  }
  const selected = (positions ?? []).find((position) => position.id === values.positionId);
  return selected?.area?.trim() ?? values.area;
}
