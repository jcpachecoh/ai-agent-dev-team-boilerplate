export type DocumentFileType =
  | 'IDENTIFICATION'
  | 'DRIVER_LICENSE'
  | 'STUDY_CERTIFICATE'
  | 'DEPENDANT_DOCUMENT'
  | 'MEDICAL_CERTIFICATE'
  | 'OTHER';

export interface EmployeeDocument {
  id: string;
  tenantId: string;
  employeeId: string;
  fileType: DocumentFileType;
  title: string;
  issueDate: string | null;
  expiryDate: string | null;
  storageObjectId: string;
  mimeType: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDocumentInput {
  employeeId: string;
  fileType: DocumentFileType;
  title: string;
  storageObjectId: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
}

export const DOCUMENT_FILE_TYPE_LABELS: Record<DocumentFileType, string> = {
  IDENTIFICATION: 'Identificación',
  DRIVER_LICENSE: 'Licencia de conducción',
  STUDY_CERTIFICATE: 'Certificado de estudios',
  DEPENDANT_DOCUMENT: 'Documentos de dependientes',
  MEDICAL_CERTIFICATE: 'Certificado médico',
  OTHER: 'Otro',
};

export const DOCUMENT_FILE_TYPE_OPTIONS: { value: DocumentFileType; label: string }[] = [
  { value: 'IDENTIFICATION', label: 'Identificación' },
  { value: 'DRIVER_LICENSE', label: 'Licencia de conducción' },
  { value: 'STUDY_CERTIFICATE', label: 'Certificado de estudios' },
  { value: 'DEPENDANT_DOCUMENT', label: 'Documentos de dependientes' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Certificado médico' },
  { value: 'OTHER', label: 'Otro' },
];
