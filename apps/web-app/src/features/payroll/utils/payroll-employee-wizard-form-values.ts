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
import { DIRECCION_EMPTY_PARTS, parseDireccion } from './direccion';
import { splitEmployeeNameForForm, splitNombresForForm } from './employee-name';
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
    locationId: employee.locationId ?? '',
    primerNombre: nameParts.primerNombre,
    segundoNombre: nameParts.segundoNombre,
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
    departamento: '',
    ciudad: '',
    barrio: employee.barrio ?? '',
    localidad: employee.localidad ?? '',
    ...DIRECCION_EMPTY_PARTS,
    costCenter: (employee.costCenter as PayrollEmployeeFormValues['costCenter']) ?? 'OPERACIONES',
    laborClassification:
      (employee.laborClassification as PayrollEmployeeFormValues['laborClassification']) ??
      'ADMINISTRATIVO',
    nonSalaryAmount: employee.nonSalaryAmount ?? '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaParentesco: '',
    contactoEmergenciaTelefono: '',
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

  const nombresFromPersonalData = personalData.nombres?.trim()
    ? splitNombresForForm(personalData.nombres)
    : null;

  const direccionParts = personalData.direccion?.trim()
    ? parseDireccion(personalData.direccion)
    : null;

  return {
    ...values,
    documentType: personalData.tipoDocumento
      ? mapPersonalDataDocumentType(personalData.tipoDocumento)
      : values.documentType,
    cedula: personalData.numeroDocumento?.trim() || values.cedula,
    // Prefiere los campos divididos; registros previos al backfill caen al split de `nombres`.
    primerNombre:
      personalData.primerNombre?.trim() ||
      nombresFromPersonalData?.primerNombre ||
      values.primerNombre,
    // Los datos personales son la fuente de verdad del segundo nombre (puede ser vacío).
    segundoNombre:
      personalData.primerNombre != null
        ? (personalData.segundoNombre ?? '')
        : nombresFromPersonalData
          ? nombresFromPersonalData.segundoNombre
          : values.segundoNombre,
    primerApellido: personalData.primerApellido?.trim() || values.primerApellido,
    segundoApellido: personalData.segundoApellido?.trim() || values.segundoApellido,
    email: personalData.correo?.trim() || values.email,
    departamento: personalData.departamento?.trim() || values.departamento,
    ciudad: personalData.ciudad?.trim() || values.ciudad,
    barrio: personalData.barrio?.trim() || values.barrio,
    localidad: personalData.localidad?.trim() || values.localidad,
    contactoEmergenciaNombre:
      personalData.contactoEmergenciaNombre?.trim() || values.contactoEmergenciaNombre,
    contactoEmergenciaParentesco:
      personalData.contactoEmergenciaParentesco?.trim() || values.contactoEmergenciaParentesco,
    contactoEmergenciaTelefono:
      personalData.contactoEmergenciaTelefono?.trim() || values.contactoEmergenciaTelefono,
    ...(direccionParts ?? {}),
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
