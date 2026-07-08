import type { EmployeeBankAccount } from '../types/bank-account.types';
import type { EmployeePersonalData } from '../types/personal-data.types';
import type { EmployeeTaxInformation } from '../types/financial-profile.types';
import type {
  DocumentType,
  PayrollEmployee,
  PayrollEmployeeFormValues,
} from '../types/payroll.types';
import type {
  PayrollEmployeeCreateBankDraft,
  PayrollEmployeeCreateTaxDraft,
} from '../types/payroll-employee-create-wizard.types';
import { formatMaskedAccountNumber, selectPrimaryBankAccount } from './bank-account-validation';
import { splitEmployeeNameForForm } from './employee-name';
import { formatWithholdingRate } from './financial-profile-display';

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function mapPersonalDataDocumentType(tipoDocumento: string | null | undefined): DocumentType {
  if (tipoDocumento === 'PASAPORTE') return 'PASSPORT';
  if (tipoDocumento === 'CC' || tipoDocumento === 'CE' || tipoDocumento === 'NIT') {
    return tipoDocumento;
  }
  return 'CC';
}

export function payrollEmployeeToFormValues(employee: PayrollEmployee): PayrollEmployeeFormValues {
  const nameParts = splitEmployeeNameForForm(employee.name);
  return {
    cedula: employee.user?.cedula ?? '',
    documentType: (employee.user?.documentType as DocumentType) ?? 'CC',
    email: employee.user?.email ?? '',
    locationId: employee.locationId,
    nombres: nameParts.nombres,
    primerApellido: nameParts.primerApellido,
    segundoApellido: nameParts.segundoApellido,
    positionId: employee.positionId ?? '',
    area: employee.area,
    department: employee.department,
    contractType: employee.contractType,
    hireDate: toDateInputValue(employee.hireDate),
    contractStart: toDateInputValue(employee.contractStart),
    contractEnd: toDateInputValue(employee.contractEnd),
    salaryType: employee.salaryType,
    salaryAmount: employee.salaryAmount,
    epsName: employee.epsName,
    pensionFundName: employee.pensionFundName,
    cesantiasFundName: employee.cesantiasFundName,
    arlName: employee.arlName,
    arlRiskLevel: employee.arlRiskLevel,
    cajaCompensacion: employee.cajaCompensacion,
    barrio: employee.barrio ?? '',
    localidad: employee.localidad ?? '',
    costCenter: (employee.costCenter as PayrollEmployeeFormValues['costCenter']) ?? 'OPERACIONES',
    laborClassification:
      (employee.laborClassification as PayrollEmployeeFormValues['laborClassification']) ??
      'ADMINISTRATIVO',
    nonSalaryAmount: employee.nonSalaryAmount ?? '',
    beneficiaries: (employee.beneficiaries ?? []).map((beneficiary) => ({
      documentType: beneficiary.documentType ?? '',
      documentNumber: beneficiary.documentNumber ?? '',
      relationshipType: beneficiary.relationshipType,
      primerNombre: beneficiary.primerNombre ?? '',
      segundoNombre: beneficiary.segundoNombre ?? '',
      primerApellido: beneficiary.primerApellido ?? '',
      segundoApellido: beneficiary.segundoApellido ?? '',
      fechaNacimiento: toDateInputValue(beneficiary.birthDate),
      disability: beneficiary.disability,
    })),
  };
}

export function mergePersonalDataIntoFormValues(
  values: PayrollEmployeeFormValues,
  personalData: EmployeePersonalData | null | undefined,
): PayrollEmployeeFormValues {
  if (!personalData) return values;

  return {
    ...values,
    documentType: personalData.tipoDocumento
      ? mapPersonalDataDocumentType(personalData.tipoDocumento)
      : values.documentType,
    cedula: personalData.numeroDocumento?.trim() || values.cedula,
    nombres: personalData.nombres?.trim() || values.nombres,
    primerApellido: personalData.primerApellido?.trim() || values.primerApellido,
    segundoApellido: personalData.segundoApellido?.trim() || values.segundoApellido,
    email: personalData.correo?.trim() || values.email,
    barrio: personalData.barrio?.trim() || values.barrio,
    localidad: personalData.localidad?.trim() || values.localidad,
  };
}

export function taxInformationToWizardDraft(
  taxInformation: EmployeeTaxInformation | null | undefined,
): PayrollEmployeeCreateTaxDraft {
  if (!taxInformation) {
    return {
      taxId: '',
      taxRegime: 'ORDINARIO',
      withholdingApplicable: false,
      withholdingRatePercent: '',
    };
  }

  return {
    taxId: '',
    taxRegime: taxInformation.taxRegime?.trim() || 'ORDINARIO',
    withholdingApplicable: taxInformation.withholdingApplicable,
    withholdingRatePercent: formatWithholdingRate(taxInformation.withholdingRate),
  };
}

export function bankAccountToWizardDraft(
  accounts: EmployeeBankAccount[] | null | undefined,
): PayrollEmployeeCreateBankDraft {
  const account = selectPrimaryBankAccount(accounts);
  if (!account) {
    return { bankCode: '', accountType: 'SAVINGS', accountNumber: '' };
  }

  return {
    bankAccountId: account.id,
    bankCode: account.bankCode ?? '',
    accountType: account.accountType,
    accountNumber: '',
    maskedAccountNumber: formatMaskedAccountNumber(
      account.maskedAccountNumber,
      account.accountLast4,
    ),
  };
}
