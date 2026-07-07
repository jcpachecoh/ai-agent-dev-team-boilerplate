import { z } from 'zod';
import type { DocumentFileType } from '../types/employee-document.types';

export const employeeDocumentSchema = z.object({
  fileType: z.enum(
    [
      'IDENTIFICATION',
      'DRIVER_LICENSE',
      'STUDY_CERTIFICATE',
      'DEPENDANT_DOCUMENT',
      'MEDICAL_CERTIFICATE',
      'OTHER',
    ] as const,
    { message: 'Selecciona el tipo de documento' },
  ),
  title: z.string().min(1, 'El título es requerido').max(200),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export interface EmployeeDocumentFormValues {
  fileType: DocumentFileType;
  title: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
}

export type EmployeeDocumentFormSchema = z.infer<typeof employeeDocumentSchema>;
