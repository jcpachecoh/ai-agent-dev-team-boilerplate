export type PilaPeriodExportStatus = 'GENERATED' | 'PAID' | 'VOIDED';
export type PilaExportFormat = 'TXT' | 'XLSX';

/** Estados derivados solo en frontend (no existen en backend). */
export type PilaUiStatus = 'PENDING' | 'VALIDATION_FAILED' | PilaPeriodExportStatus;

export type PilaDeadlineStatus =
  | 'NOT_DUE'
  | 'UPCOMING'
  | 'DUE_TODAY'
  | 'OVERDUE'
  | 'PAID'
  | 'CONFIG_INCOMPLETE';

export interface PilaDeadlineResponse {
  period: string;
  paymentMonth: string;
  dueDate: string | null;
  businessDayNumber: number | null;
  lastTwoNitDigits: string | null;
  daysRemaining: number | null;
  status: PilaDeadlineStatus;
  shouldAlert: boolean;
  timezone: string;
  message?: string;
}

export interface PilaValidationError {
  code: string;
  field: string;
  message: string;
  employeeId?: string;
  employeeName?: string;
}

export interface PilaValidationResponse {
  ok: boolean;
  errors: PilaValidationError[];
  summary?: Record<string, unknown> | null;
}

export interface PilaPeriodExport {
  id: string;
  tenantId: string;
  periodHealth: string;
  periodOther: string;
  format: PilaExportFormat;
  status: PilaPeriodExportStatus;
  version: number;
  technicalVersion: string;
  fileName: string;
  fileChecksum: string;
  employeeCount: number;
  totalPayrollAmount: number;
  totalContribution: number;
  storageObjectId: string;
  generatedAt: string;
  generatedBy: string;
  paidAt?: string | null;
  paidConfirmedBy?: string | null;
  planNumber?: string | null;
  paymentReference?: string | null;
  voidedAt?: string | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarkPilaExportPaidInput {
  planNumber: string;
  paymentReference?: string;
  paidAt: string;
}

export interface VoidPilaExportInput {
  reason: string;
}

export interface PilaDownloadResult {
  blob: Blob;
  filename: string;
}
