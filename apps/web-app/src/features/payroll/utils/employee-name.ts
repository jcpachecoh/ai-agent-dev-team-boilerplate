import type { DocumentType } from '../types/payroll.types';

export function buildEmployeeFullName(parts: {
  nombres: string;
  primerApellido: string;
  segundoApellido?: string;
}): string {
  return [parts.nombres, parts.primerApellido, parts.segundoApellido]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
}

export function splitEmployeeNameForForm(fullName: string): {
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { nombres: '', primerApellido: '', segundoApellido: '' };
  }
  if (parts.length === 1) {
    return { nombres: parts[0]!, primerApellido: '', segundoApellido: '' };
  }
  if (parts.length === 2) {
    return { nombres: parts[0]!, primerApellido: parts[1]!, segundoApellido: '' };
  }
  return {
    nombres: parts.slice(0, -2).join(' '),
    primerApellido: parts.at(-2) ?? '',
    segundoApellido: parts.at(-1) ?? '',
  };
}

export function mapDocumentTypeToPersonalData(documentType: DocumentType): string {
  if (documentType === 'PASSPORT') return 'PASAPORTE';
  return documentType;
}
