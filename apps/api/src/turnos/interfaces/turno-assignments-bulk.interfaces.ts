export interface BulkEmployeeInfo {
  id: string;
  userId: string;
  nombre: string;
  documento: string;
  locationId: string;
  isActive: boolean;
}

export interface GenerateTemplateOptions {
  from: Date;
  to: Date;
  weekdaysIso: number[];
  employeeIds: string[];
}

export interface BulkImportRowError {
  row: number;
  employee?: string;
  date?: string;
  reason: string;
}

export interface BulkImportResult {
  totalRows: number;
  totalAssignments: number;
  createdOrUpdated: number;
  returnedToBase: number;
  restDays: number;
  excluded: number;
  errorCount: number;
  errors: BulkImportRowError[];
}
