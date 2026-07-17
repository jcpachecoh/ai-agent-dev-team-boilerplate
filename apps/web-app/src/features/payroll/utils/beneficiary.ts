import type { BeneficiaryFormRow } from '../types/payroll.types';

export const BENEFICIARY_TYPE_OPTIONS = [
  { value: 'FATHER', label: 'Padres — Padre' },
  { value: 'MOTHER', label: 'Padres — Madre' },
  { value: 'SPOUSE', label: 'Cónyuge' },
  { value: 'CHILD', label: 'Hijo/Hija' },
  { value: 'MINOR_IN_CHARGE', label: 'Menor a Cargo' },
  { value: 'ORPHAN_SIBLING', label: 'Hermano huérfano de padre y madre' },
] as const;

export const DISABILITY_OPTIONS = [
  { value: 'NOT_APPLICABLE', label: 'No aplica' },
  { value: 'PHYSICAL', label: 'Física' },
  { value: 'AUDITORY', label: 'Auditiva' },
  { value: 'VISUAL', label: 'Visual' },
  { value: 'DEAFBLINDNESS', label: 'Sordoceguera' },
  { value: 'INTELLECTUAL_COGNITIVE', label: 'Intelectual / Cognitiva' },
  { value: 'PSYCHOSOCIAL', label: 'Psicosocial (Mental)' },
  { value: 'MULTIPLE', label: 'Múltiple' },
] as const;

export const BENEFICIARY_DOCUMENT_TYPE_OPTIONS = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'PEP', label: 'Permiso especial de permanencia' },
] as const;

export const EMPTY_BENEFICIARY_FORM_ROW: BeneficiaryFormRow = {
  documentType: '',
  documentNumber: '',
  relationshipType: 'CHILD',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  fechaNacimiento: '',
  disability: 'NOT_APPLICABLE',
};

export function buildBeneficiaryFullName(parts: {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
}): string {
  return [parts.primerNombre, parts.segundoNombre, parts.primerApellido, parts.segundoApellido]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
}

export function calculateAge(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  const birth = new Date(`${fechaNacimiento}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(age, 0);
}

export function validateBeneficiaryForm(
  values: BeneficiaryFormRow,
): Partial<Record<keyof BeneficiaryFormRow, string>> {
  const errors: Partial<Record<keyof BeneficiaryFormRow, string>> = {};

  if (!values.relationshipType) {
    errors.relationshipType = 'Selecciona el tipo de beneficiario';
  }
  if (!values.primerNombre.trim()) {
    errors.primerNombre = 'El primer nombre es obligatorio';
  }
  if (!values.primerApellido.trim()) {
    errors.primerApellido = 'El primer apellido es obligatorio';
  }
  if (!values.fechaNacimiento) {
    errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
  } else {
    const birth = new Date(`${values.fechaNacimiento}T00:00:00`);
    if (Number.isNaN(birth.getTime()) || birth > new Date()) {
      errors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura';
    }
  }
  if (!values.disability) {
    errors.disability = 'Selecciona una opción de discapacidad';
  }

  return errors;
}
