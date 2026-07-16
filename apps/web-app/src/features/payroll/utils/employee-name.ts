import type { DocumentType } from '../types/payroll.types';

export function buildEmployeeFullName(parts: {
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

/** Combina primer y segundo nombre en el campo `nombres` de datos personales. */
export function buildNombres(parts: { primerNombre: string; segundoNombre?: string }): string {
  return [parts.primerNombre, parts.segundoNombre]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
}

/** Divide el campo combinado `nombres` (datos personales) en primer y segundo nombre. */
export function splitNombresForForm(nombres: string): {
  primerNombre: string;
  segundoNombre: string;
} {
  const parts = nombres.trim().split(/\s+/).filter(Boolean);
  return {
    primerNombre: parts[0] ?? '',
    segundoNombre: parts.slice(1).join(' '),
  };
}

export function splitEmployeeNameForForm(fullName: string): {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' };
  }
  if (parts.length === 1) {
    return { primerNombre: parts[0]!, segundoNombre: '', primerApellido: '', segundoApellido: '' };
  }
  if (parts.length === 2) {
    return {
      primerNombre: parts[0]!,
      segundoNombre: '',
      primerApellido: parts[1]!,
      segundoApellido: '',
    };
  }
  const nombres = splitNombresForForm(parts.slice(0, -2).join(' '));
  return {
    primerNombre: nombres.primerNombre,
    segundoNombre: nombres.segundoNombre,
    primerApellido: parts.at(-2) ?? '',
    segundoApellido: parts.at(-1) ?? '',
  };
}

export function mapDocumentTypeToPersonalData(documentType: DocumentType): string {
  if (documentType === 'PASSPORT') return 'PASAPORTE';
  return documentType;
}
