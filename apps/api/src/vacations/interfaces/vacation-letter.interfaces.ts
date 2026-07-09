import type { VacationRequestRecord } from './vacations.interfaces';

export const VACATION_LETTER_FORM_CODE = 'VAC-FOR-001';
export const VACATION_LETTER_FORM_VERSION = '1.0';

export const VACATION_LETTER_HR_SIGNATORY = {
  name: 'Andrea Cortes Daza',
  title: 'Jefe de Gestión Humana',
  email: 'jefetalentohumano@palosdelena.com',
} as const;

export interface VacationLetterContext {
  tenant: {
    legalName: string;
    tradeName: string | null;
    logoUrl: string | null;
    city: string | null;
  };
  employee: {
    fullName: string;
    cedula: string;
    position: string;
    email: string;
    city: string;
    hireDate: Date;
  };
  request: VacationRequestRecord;
  accrualPeriod: { start: Date; end: Date };
  returnToWorkDate: Date;
  cashCompensationDays: number;
  hrSignatory: {
    name: string;
    title: string;
    email: string;
  };
  letterDate: Date;
  rejectionReason?: string;
  logoBuffer: Buffer | null;
}

export type VacationLetterVariant = 'APPROVAL' | 'REJECTION';
