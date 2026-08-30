import type { DocumentFileType } from '@prisma/client';

export interface EmployeeDocumentRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  fileType: DocumentFileType;
  title: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  storageObjectId: string;
  mimeType: string;
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeDocumentData {
  employeeId: string;
  fileType: DocumentFileType;
  title: string;
  storageObjectId: string;
  issueDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface ListEmployeeDocumentsOptions {
  fileType?: DocumentFileType;
  includeDeleted?: boolean;
}

export interface IEmployeeDocumentsRepository {
  create(tenantId: string, data: CreateEmployeeDocumentData): Promise<EmployeeDocumentRecord>;
  findById(tenantId: string, id: string): Promise<EmployeeDocumentRecord | null>;
  findByEmployee(
    tenantId: string,
    employeeId: string,
    options?: ListEmployeeDocumentsOptions,
  ): Promise<EmployeeDocumentRecord[]>;
  softDelete(tenantId: string, id: string): Promise<EmployeeDocumentRecord>;
}

export interface IEmployeeDocumentsService {
  create(tenantId: string, data: CreateEmployeeDocumentData): Promise<EmployeeDocumentRecord>;
  findById(tenantId: string, id: string): Promise<EmployeeDocumentRecord>;
  findByEmployee(
    tenantId: string,
    employeeId: string,
    options?: ListEmployeeDocumentsOptions,
  ): Promise<EmployeeDocumentRecord[]>;
  remove(tenantId: string, id: string): Promise<EmployeeDocumentRecord>;
  getDownloadUrl(tenantId: string, id: string): Promise<string>;
}
